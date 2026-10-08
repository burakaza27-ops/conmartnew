# Security

## Reporting a vulnerability

Email the platform operations desk rather than opening a public issue. Include
what you did, what happened, and what you expected. Expect an acknowledgement
within two business days.

---

## Threat model

ConMart sells one thing: the introduction between a contractor and a verified
supplier. That shapes what is worth attacking.

| Asset | Attack | Mitigation |
| --- | --- | --- |
| Contact details before unlock | Reading them out of the RSC payload, search results, or a free-text field | Masked server-side in `src/lib/security/masking.ts` before serialization |
| Supplier wallet balance | Racing two enquiry acceptances to spend the same birr twice | Conditional writes guarded on the balances that were read; see `executeUnlockIntroductionTransaction` |
| Administrative access | Registering as `ADMIN`, or forging the role in the JWT | Role removed from the sign-up form; every check reads the `users` table |
| Unlock revenue | Reporting a deal failure on someone else's enquiry to trigger a refund | Every action verifies the caller is a party to the record |
| Storage and egress bill | Automated uploads or enquiry spam | Per-user and per-IP rate limits on sign-in, sign-up, enquiries, top-ups, and uploads |

---

## Controls

### Authorization

Roles are read from the `users` table on every check. `user_metadata` in the
Supabase JWT is writable by the account holder, so it is treated as display
data only — never as a claim.

- `src/proxy.ts` answers only "is this authenticated?"
- `requireRole()` guards layouts and pages
- `authorize()` guards server actions

Server actions are public HTTP endpoints. Rendering rules are not access
control; each action re-derives the caller and confirms they are a party to the
record.

### Privileged roles

`ADMIN` and `FIELD_AGENT` are not offered at sign-up. They are granted with
`scripts/grant-role.ts` by someone who already has database credentials.

### Money

- Debits are conditional writes guarded on the balances that were read, so a
  concurrent request updates zero rows instead of overwriting the first.
- Credits use atomic increments and read the post-update balance back for the
  ledger.
- `UnlockRecord.enquiryId` is unique, so one enquiry can never be charged twice.
- All rounding goes through `src/lib/money.ts`. The buyer's live price preview
  and the server's authoritative calculation call the same function, so the two
  cannot disagree.

### Uploads

Format is determined from the file's magic bytes, not its declared
`Content-Type` or extension — an HTML or SVG payload can arrive labelled
`image/jpeg`, and serving it back from the storage origin would be stored XSS.
SVG is refused outright: it is a script-bearing document. The stored object name
is generated server-side, so a client-supplied filename cannot contain path
separators.

### Transport and headers

`src/proxy.ts` sets HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, and a nonce-based Content Security
Policy using `strict-dynamic`, so an injected script tag is rejected even from
an allowlisted origin.

Database TLS certificates are verified. `DATABASE_SSL_NO_VERIFY` exists only
for local proxies with self-signed certificates; enabling it in production
would let a man-in-the-middle read every query.

### Rate limiting

Backed by Upstash Redis in production, and by an in-memory fallback in local development.
In production (`NODE_ENV=production`), rate limiting is **fail-closed**: if Upstash credentials are missing or the service is unreachable, mutating endpoints refuse requests with HTTP 503 rather than silently allowing unmetered traffic. In development, it falls back to an in-process map with console warnings.

### Secret & Key Hygiene

`scripts/check-secret-hygiene.js` is run as part of `npm run verify` and CI. It scans the working tree for uncommitted keystores (`*.keystore`, `*.jks`), private keys (`*.pem`), committed `.env` secrets, and hardcoded credential patterns to guarantee secrets cannot be committed.

### Error messages

Only `DomainError` messages reach the client. Everything else is logged
server-side and replaced with a generic message, so driver and query errors do
not leak table names, column names, or connection details.

---

## Operational requirements

### Rotate anything that has been committed

The Supabase database password was hardcoded in `prisma/seed.ts` and
`scripts/test-unlock-engine.mjs`, and is present in commit `b7b4470`. **Deleting
it from the working tree does not remove it from git history.** Rotate the
database password in the Supabase dashboard and update `DATABASE_URL` and
`DATABASE_POOLER_URL`.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is designed to be public and does not need
rotating. `SUPABASE_SERVICE_ROLE_KEY` must never appear in the repository, in a
`NEXT_PUBLIC_` variable, or in a client component.

### Row Level Security

`supabase/rls-policies.sql` must be applied to the database. The application
enforces authorization in its own layer, but RLS is the backstop if a query is
ever issued with the anon key.

### Before the first real transaction

- [ ] Database password rotated after the credential in git history
- [ ] RLS policies applied
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set server-side only
- [ ] Upstash credentials set, so rate limits are global
- [ ] CSP verified in report-only mode, then enforced
- [ ] First administrator promoted via `scripts/grant-role.ts`
- [ ] Seed script never pointed at production
