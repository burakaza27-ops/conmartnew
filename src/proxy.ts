// =============================================================================
// ConMart — Edge Proxy (Next.js 16 Proxy Convention)
// =============================================================================
// Runs before every matched request and is responsible for three things:
//
// 1. Refreshing the Supabase session so access tokens rotate.
// 2. Rejecting anonymous requests to authenticated areas.
// 3. Attaching security headers, including a per-request CSP nonce.
//
// It deliberately makes no role-based decision. The only role claim available
// here is `user_metadata.role` from the JWT, which the account holder can set
// during sign-up — trusting it would let anyone forge an ADMIN token. Role
// authorization lives in layouts and server actions, which read the `users`
// table. See src/lib/auth/session.ts.
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Path prefixes that require a signed-in user. */
const AUTHENTICATED_PREFIXES = [
  "/admin",
  "/seller",
  "/buyer",
  "/agent",
  "/account",
  "/dashboard",
  "/api/upload",
] as const;

/** Pages that make no sense once signed in. */
const ANONYMOUS_ONLY_ROUTES = ["/login", "/register", "/forgot-password"] as const;

const SUPABASE_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"
).origin;

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const csp = buildContentSecurityPolicy(nonce);

  // Rebuilt on each response because Supabase mutates `request.cookies` while
  // refreshing the session, and those mutations must reach the route handlers.
  const nextResponse = () =>
    NextResponse.next({ request: { headers: buildRequestHeaders(request, nonce, csp) } });

  let response = nextResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = nextResponse();

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() validates the token against Supabase; getSession() only decodes
  // whatever the cookie claims and must not be used for an access decision.
  // A transient network failure is treated as "not signed in" rather than
  // failing the request outright.
  let isAuthenticated = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = !error && Boolean(data?.user);
  } catch (error) {
    console.error("Proxy auth check failed, treating request as anonymous:", error);
  }

  const { pathname } = request.nextUrl;

  if (isAuthenticated && ANONYMOUS_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      csp
    );
  }

  const requiresAuth = AUTHENTICATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (requiresAuth && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Authentication required." }, { status: 401 }),
        csp
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), csp);
  }

  return withSecurityHeaders(response, csp);
}

function buildRequestHeaders(request: NextRequest, nonce: string, csp: string): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  // Next.js reads this request header to nonce the scripts it injects itself.
  headers.set("content-security-policy", csp);
  return headers;
}

/**
 * `strict-dynamic` means the nonce, not the host list, decides what may run,
 * so an injected `<script src>` is rejected even if its origin is allowlisted.
 */
function buildContentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  const directives = [
    `default-src 'self'`,
    // 'unsafe-eval' is required by React Refresh and is dev-only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""}`,
    // Tailwind and inline `style` props emit inline styles; there is no
    // nonce-compatible alternative that does not require a build-time rewrite.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${SUPABASE_ORIGIN} ${isDev ? "ws: wss:" : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ];

  return directives
    .map((directive) => directive.replace(/\s{2,}/g, " ").trim())
    .join("; ");
}

function withSecurityHeaders(response: NextResponse, csp: string): NextResponse {
  // Set CSP_REPORT_ONLY=true to observe violations without blocking, which is
  // how a policy change should be rolled out to production.
  const cspHeader =
    process.env.CSP_REPORT_ONLY === "true"
      ? "content-security-policy-report-only"
      : "content-security-policy";

  response.headers.set(cspHeader, csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort()"
  );
  response.headers.set(
    "strict-transport-security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|uploads/).*)",
  ],
};
