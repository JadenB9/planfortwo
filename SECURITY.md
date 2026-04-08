# Security Policy

PlanForTwo handles sensitive data (guest contacts, RSVPs, payment metadata, photos, vendor records). Security is treated as a first-class concern.

## Reporting a Vulnerability

If you believe you have found a security vulnerability, **please do not open a public issue.** Instead, report it privately:

- **Email:** jadenbutler@cedarville.edu
- **Subject line:** `[PlanForTwo Security] <short description>`

Please include, where possible:

1. A description of the vulnerability and the impact you believe it has.
2. Steps to reproduce, or a proof-of-concept.
3. The affected version, route, or component.
4. Whether the issue is already public anywhere.

You should expect an acknowledgement within a few days. I'll keep you updated on remediation progress and credit you in the release notes if you'd like (or keep your report anonymous, your choice).

## Supported Versions

This is a single-tenant project under active development. Only the latest release on `main` receives security updates.

| Version | Supported |
| ------- | --------- |
| 1.1.x   | Yes       |
| < 1.1   | No        |

## Security Posture

A few things that are already in place:

- **Input validation:** every API route validates input with Zod schemas shared between the client and server. There is no implicit trust at the API boundary.
- **Authentication:** Clerk handles all auth flows. JWTs are verified server-side via `@clerk/backend` middleware on every protected route.
- **Authorization:** every wedding-scoped resource is checked through `resolveWeddingMiddleware`, which enforces that the requesting user is a member of the target wedding. IDOR was specifically swept across all 26 wedding-scoped routes.
- **Output sanitization:** user-generated HTML (vows, ceremony outlines, guestbook entries, custom website sections, inbox messages) is sanitized through DOMPurify (`isomorphic-dompurify`) before storage and again on render.
- **Rate limiting:** sensitive endpoints (auth, RSVP, guestbook, contact forms) are rate-limited at the edge via a token-bucket implementation backed by the database.
- **CSP:** the web app ships a strict Clerk-backed Content Security Policy with explicit directives.
- **Dependency scanning:** `pnpm audit` runs in CI on every push and PR. Known vulnerabilities block merges.
- **Secrets:** no secrets in source. Environment variables are loaded from `.env*` (gitignored) and validated at boot. `.env.example` files document the required variables with placeholder values only.
- **Database:** Drizzle ORM 0.45.2+ (SQL injection advisory GHSA-gpj5-g38j-94v9 patched). Parameterized queries everywhere. No raw SQL with user input.
- **Cascading deletes:** when a user account is deleted, all owned weddings and their related data (guests, photos, vendors, etc.) are purged via foreign-key cascade. No orphaned PII.

## Out of Scope

The following are not considered security vulnerabilities for the purposes of this policy:

- Issues that require physical access to a user's device.
- Self-XSS that requires the victim to paste a payload into a developer console.
- Missing security headers that have no demonstrable impact (e.g., `X-Frame-Options` on a route that already sets `frame-ancestors` via CSP).
- Best-practice recommendations without a demonstrated exploit.
- Vulnerabilities in third-party services we depend on (Clerk, Stripe, Supabase, Resend, Cloudflare, Inngest, Vercel, Railway). Report those upstream.
