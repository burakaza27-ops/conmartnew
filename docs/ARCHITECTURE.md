# Architecture

## The shape of the problem

ConMart is an introduction broker, not a payment processor. It never holds money
for a materials trade. That single fact explains most of the design:

- There is no checkout, no escrow, and no order settlement.
- The only money that moves inside the system is the supplier's prepaid wallet.
- The valuable asset is a phone number, so masking is a revenue control rather
  than a privacy nicety.

## Layers

```
Route (server component)
  -> requireRole()                  authorization, from the database
  -> lib/data/*                     read-side queries, masked on the way out
  -> Client component               presentation and interaction
       -> Server action
            -> authorize()          authorization, again
            -> Zod schema           input validation
            -> lib/wallet | engine  domain logic
            -> Prisma               persistence
```

Two rules hold this together:

**Authorization is re-derived at every entry point.** A server action is a
public HTTP endpoint. It cannot assume the page that rendered its button ran a
check, so it runs its own.

**Masking happens in the data layer, not the view.** `lib/data/catalog.ts`
returns already-masked data. A component cannot leak what it was never given.

## Module boundaries

| Module | Responsibility | Why it is separate |
| --- | --- | --- |
| `lib/money.ts` | Currency rounding | No imports, so client and server share one rounding rule |
| `lib/engine/pricing.ts` | Proforma line items | Pure; the buyer's preview and the server's invoice call the same function |
| `lib/wallet/accounting.ts` | Wallet arithmetic | Pure; the rules that move money are unit-testable without Postgres |
| `lib/wallet/wallet-service.ts` | Wallet transactions | Owns the database transactions and concurrency guards |
| `lib/marketplace/enquiry-service.ts` | Enquiry lifecycle & unlocks | Owns transaction orchestrations and unlock validation |
| `lib/data/buyer-history.ts` | Buyer history queries | Bounded query module for buyer activity |
| `lib/auth/session.ts` | Authorization | One place to audit; memoized per request |
| `lib/config/env.ts` | Environment | Server-only, so a non-public variable cannot silently read as `undefined` in the browser |
| `lib/security/masking.ts` | Contact masking | Pure and heavily tested; the paywall depends on it |
| `lib/security/rate-limit.ts` | Rate limiting | Fail-closed Upstash Redis limiter for DDoS and spam protection |

The pure modules exist because their impure neighbours import `server-only` and
a database client. Splitting the arithmetic out is what makes it testable, and
the arithmetic is the part that must not be wrong.

## Decisions worth knowing

### Roles live in Postgres, not in the JWT

Supabase writes sign-up metadata into `user_metadata`, which the account holder
can modify. Reading a role from there means users choose their own privileges.
The cost of doing it correctly is one indexed query per request, memoized with
`React.cache` so a layout, its page, and any action in the same render share it.

### The proxy does not authorize

`src/proxy.ts` runs at the edge without database access, so the only role claim
available there is the untrustworthy one. Rather than perform a check that is
both spoofable and unreliable, it refreshes the session, blocks anonymous
requests to authenticated areas, and attaches security headers. Role decisions
happen where the database is reachable.

The `/dashboard` route exists for the same reason: after sign-in, something has
to resolve the caller's landing page from an authoritative role.

### The root layout is dynamic

Reading the CSP nonce from request headers in the root layout opts the tree out
of static rendering. This is a real cost, accepted because nearly every route
is authenticated and database-backed anyway, and the alternative is either no
CSP or a theme flash on first paint.

### Top-ups are settled manually

Not an unfinished integration. The Ethiopian payment rails available to the
platform provide no server-to-server confirmation, so a human matches the
reference against a bank or Telebirr statement. The code models this honestly:
a `TopUpRequest` is `PENDING` until an administrator claims and approves it.

### Concurrency is handled with conditional writes

Read-then-write on a wallet balance is a double-spend. Instead of table locks or
a serializable isolation level, debits are `updateMany` calls guarded on the
balances that were read; the loser of a race updates zero rows and the
transaction aborts. Credits use atomic increments and read the result back for
the ledger. This is portable across the pooler, which does not support advisory
locks reliably.

---

## Known trade-offs and follow-ups

### The legacy orders flow is deprecated

`Order`, `OrderItem`, the cart, and the proforma PDF predate the contact-unlock
model. Under the current business model an order is generated but nothing
settles against it — the introduction is the product.

It is still wired up (`/buyer/orders`, `/buyer/proforma`, the admin orders
table) because some suppliers use the generated proforma as a quote document.
It is not the primary flow and should not be extended. Removing it means
dropping two tables, the cart context, and four routes; that is a deliberate
product decision, not a refactor.

New work belongs in the enquiry flow.

### Rejected top-up reasons are not persisted

`rejectTopUpRequest` logs the administrator's reason rather than storing it,
because `TopUpRequest` has no column for it. Adding `rejectionReason` to the
model is a one-line migration and should happen before suppliers start
disputing rejections.

### Rate limiting depends on an external service

The in-memory fallback is per-instance and therefore not a real limit under
serverless. `/api/health` reports `degraded` when Upstash is not configured in
production, so an uptime monitor catches it, but the app still serves traffic
rather than refusing to boot. That is the right trade-off for a limiter — the
alternative is an outage caused by a missing environment variable — but it does
mean the misconfiguration is only visible if someone watches the endpoint.

### Amharic strings are in a TypeScript module

`lib/i18n/translations.ts` is a large hand-maintained record. This works and has
no runtime cost, but it does not scale to a third language or to translators who
do not use git.
