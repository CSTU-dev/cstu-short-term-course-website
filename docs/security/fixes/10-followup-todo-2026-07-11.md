# Follow-up audit (2026-07-11) — new findings & master fix TODO

**Scope:** Re-audit of the full repo against the 2026-07-10 checklist, focused on
(1) secret strings, (2) common web security issues (authorization in particular),
(3) superAdmin / database access, (4) Google (Cloud) access.
**Mode:** Read-only audit as of 2026-07-11 — the *findings* below were proposals
at that date; no code had been changed then.

> **Update log — 2026-07-16:** an email + auth-hardening pass landed. Several
> TODO items are now implemented; checkboxes below are updated with `— DONE`
> / `— PARTIAL` annotations. New residuals are cross-linked to their owning fix
> docs ([01](./01-auth-jwt-role.md), [02](./02-rate-limiting.md)) rather than
> duplicated here. The N1/N2/N-detail *narrative* sections further down are left
> as the original audit record.

---

## Verdict on the four requested checks

| # | Check | Result |
|---|-------|--------|
| 1 | No secret strings in the repo | **PASS** — re-scanned working tree **and full git history** (`sk_live`, `whsec_`, AWS `AKIA…`, Google `AIza…`, PEM private keys, GitHub `ghp_…`, JWTs): nothing found. Only `.env.example` placeholders were ever committed. |
| 2 | Popular web security issues handled | **Mostly** — authorization is layered (middleware → `requireRole` → per-action `canManageCourse` / ownership checks) and all `/my`, `/admin`, `/superAdmin` pages call `requireRole`. Open items are tracked below (the previously-found HIGH items plus new findings N1–N9). |
| 3 | superAdmin / DB access secure | **DB:** covered by [05-database-docker.md](./05-database-docker.md) (compose password + port binding are local-dev-only settings; harden before any shared deploy). **superAdmin:** seed uses env + bcrypt (good), but see N1, N3, N10 below. No Supabase is used anywhere in this repo. |
| 4 | Google Cloud access limited to developers | **Code side OK** — the only Google integration is Google SSO via Auth.js; it is disabled unless `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set, and no GCP SDK / service-account files exist in the repo. Remaining work is ops-side: see N2. |

---

## Master fix TODO (all open issues, priority order)

Work top-down. Items marked **[new]** were found in this follow-up run; the rest
carry over from the 2026-07-10 checklist and link to their fix notes.

### P0 — before any real users / real money

- [x] **[new] N1 — Stop promoting unverified accounts to ADMIN.** — **DONE 2026-07-16.** `assignAdmin` now direct-promotes only an existing account whose email is already verified (control proven by #1); every other case (no account / unverified) goes through the email-bound invite, and `acceptAdminInvite` additionally requires `emailVerified`. Invite is emailed via SMTP (link no longer returned). Audit gains an `existingAccount` flag.
- [ ] **Refresh role from DB / force re-login on role change** (stale JWT role) → [01-auth-jwt-role.md](./01-auth-jwt-role.md) — still open; password reset/change now also depend on this (session invalidation, see 01 Problem 5).
- [ ] **Rate-limit login, signup, and the credentials `authorize` path** → [02-rate-limiting.md](./02-rate-limiting.md) — **PARTIAL 2026-07-16.** Action-level limits done (login 10/min, signup 5/min, per IP; Postgres-backed). **Residual:** the native `/api/auth/callback/credentials` path still bypasses it — move the limit into `authorize`. See 02.
- [ ] **Wire manual refunds to real Stripe Refunds** (or clearly label the ledger-only behavior) → [03-payments-stripe.md](./03-payments-stripe.md)
- [ ] **Production DB: strong unique credentials + never bind 5432 publicly** → [05-database-docker.md](./05-database-docker.md)

### P1 — hardening before public launch

- [x] **Email verification for credentials signup** (also the prerequisite for N1) → [07-email-verification.md](./07-email-verification.md) — **DONE 2026-07-16.** Unverified users can sign in but can't enroll/pay/manage referrals; hashed single-use 24h token; resend banner on `/my`; Google SSO auto-verified.
- [ ] **[new] N2 — Keep Google access developer-only for now (ops):**
  - Keep the GCP OAuth consent screen in **Testing** mode with only the developers listed as test users; do not click "Publish app" until launch.
  - Keep `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` **unset** in any non-dev deployment until launch — the code already hides the Google button when they are absent, so this is pure configuration.
  - In the GCP project IAM, grant roles only to developer accounts (no domain-wide or "allUsers" grants); the OAuth client secret lives only in `.env` / the host secret store.
  - When later opening to the public, restrict the OAuth client's authorized redirect URIs to the production domain only.
- [ ] **Security headers** (CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `nosniff`) in `next.config.ts` → [04-security-headers.md](./04-security-headers.md)
- [ ] **Webhook amount reconciliation + double-payment guard** → [03-payments-stripe.md](./03-payments-stripe.md)
  - [ ] **[new] N8 (extends P6):** make the `amount_total / 100` conversion currency-aware (zero-decimal currencies) and reject/flag events whose `currency` doesn't match the enrollment's `currency`.
- [ ] **Restrict `videoUrl` to `https:` URLs** in `SectionFormSchema` → [06-input-validation-xss.md](./06-input-validation-xss.md)
- [x] **[new] N3 — Add a password change + reset flow.** — **DONE 2026-07-16** (except session revocation). `requestPasswordReset` (uniform response, rate-limited by IP + email, credential accounts only) → `/reset/[token]` → `resetPassword`; `changePassword` (requires current password) on `/my/info`. Uses the `PASSWORD_RESET` `UserToken` (SHA-256, 1h TTL, single-use). **Residual:** does not yet revoke other active sessions — depends on session versioning → [01-auth-jwt-role.md](./01-auth-jwt-role.md) Problem 5.
- [ ] **Referral click endpoint: IP+code rate limit, Zod body validation, generic responses** → [08-referral-api.md](./08-referral-api.md)
- [ ] **CI: `pnpm audit` + Dependabot/Renovate; track `next-auth` beta advisories** → [09-dependencies.md](./09-dependencies.md)

### P2 — defense-in-depth / hygiene

- [ ] **[new] N4 — Uniform-time credentials login.** In `lib/auth/index.ts#authorize`, run a bcrypt compare against a static dummy hash when the user is not found or has no `passwordHash`, so both branches cost the same (complements R4 in [02-rate-limiting.md](./02-rate-limiting.md)).
- [ ] **[new 2026-07-16] N11 — `RateLimit` stale-row cleanup.** The rate limiter (`lib/rate-limit.ts`, `RateLimit` table) never deletes rows for keys that stop recurring → unbounded growth. Add a periodic `DELETE ... WHERE "windowEnd" < now()` (Cloud Scheduler → protected route, or `pg_cron`). → [02-rate-limiting.md](./02-rate-limiting.md) residual #2.
- [ ] **[new] N5 — Zod-validate the login / Google sign-in form data.** `loginWithCredentials` and `signInWithGoogle` read `FormData` with raw casts; validate email format, password max length (≤ 72 bytes for bcrypt), and `redirectTo` shape the same way `registerUser` does.
- [ ] **`redirectTo` allowlist** (accept only same-site paths starting with a single `/`) applied in one shared helper used by login, signup, and invite pages → [01-auth-jwt-role.md](./01-auth-jwt-role.md)
- [ ] **[new] N6 — Referral code hygiene.** In `lib/referral/*`: enforce case-insensitive uniqueness (store a normalized column or lowercase on write/lookup), add a reserved-word blocklist (`admin`, `cstu`, `official`, staff names, …) for user-chosen codes, and decide a retention policy for old codes — they currently stay valid forever and accumulate without bound (3 new codes/day/user).
- [ ] **[new] N7 — Validate refund amounts as finite numbers.** `recordManualRefund` passes a raw client-supplied `number` into `recordRefund`; a `NaN` slips past both guard comparisons and only fails at the DB layer. Add a Zod check (`z.number().finite().positive().max(…)`) at the action boundary.
- [ ] **[new] N9 — Align `EnrollSchema.snapshotEmail` with `ProfileSchema.preferredEmail`** (email-format refine); today any ≤200-char string is accepted.
- [ ] **[new] N10 — Seed-script guardrails (ops).** `prisma/seed.ts` upserts by `SUPERADMIN_EMAIL` and force-sets `role: SUPER_ADMIN` on every run — document that pointing this env var at an existing user's email promotes that account, and remove/rotate `SUPERADMIN_PASSWORD` from the environment after the initial seed.
- [ ] **Admin demotion / session-revocation path** (pairs with the stale-JWT fix) → [01-auth-jwt-role.md](./01-auth-jwt-role.md)
- [ ] **Redact email PII from info-level logs** → [00-secrets-and-env.md](./00-secrets-and-env.md) — `registerUser` was switched to log `userId` (2026-07-16), but the new auth/email code adds fresh raw-email logs (`requestPasswordReset` OAuth/unknown branch, `assignAdmin`). Address as a group: log user ids or hashed emails.
- [ ] **Deploy checklist: `SKIP_ENV_VALIDATION` unset in production; secrets from a secret store** → [00-secrets-and-env.md](./00-secrets-and-env.md)
- [ ] **Production runs behind a trusted reverse proxy** (required by `trustHost: true`) with HTTPS enforced → [01-auth-jwt-role.md](./01-auth-jwt-role.md), [04-security-headers.md](./04-security-headers.md)

---

## New findings in detail (fix-oriented)

### N1 — Admin promotion must require a verified email (HIGH)

`assignAdmin` has two paths: unknown email → invite token (good: hashed, TTL,
email-bound); **known email → immediate promotion to ADMIN + course assignment**.
Because credentials signup never verifies email ownership ([07](./07-email-verification.md)),
"an account exists with this email" does not prove the intended person controls it.

**Fix plan**

1. Make the invite-token flow the *only* promotion path — for existing accounts too
   (`assignAdmin` should always create an `AdminInvite` and email the link).
2. In `acceptAdminInvite`, additionally require `user.emailVerified` to be set.
3. Ship email verification ([07](./07-email-verification.md)) first; treat Google-SSO
   emails as verified via the provider claim.
4. Keep the existing audit-log entries; add one for "invite sent to existing account".

### N2 — Google access, developer-only phase (MEDIUM, ops)

Covered in the TODO above. Summary of the current safe state: Google SSO is the
only Google touchpoint, it is opt-in via env, the OAuth secret is env-only, and
Auth.js's default behavior does **not** auto-link a Google login to an existing
same-email credentials account (`allowDangerousEmailAccountLinking` is not
enabled — keep it that way). The developer-only restriction is enforced in the
GCP console (Testing mode + test-user allowlist), not in this codebase.

### N3 — No password change / reset flow (MEDIUM)

Users who suspect compromise cannot rotate their password, and there is no
self-service recovery. Implement change-password (requires current password) and
reset-by-email (single-use hashed token, short TTL, rate-limited, uniform
responses). On success, invalidate existing sessions (pairs with the
session-versioning idea in [01](./01-auth-jwt-role.md)).

### N4–N10 — smaller items

Each is a one-to-few-line change; see the TODO entries above for the exact fix.
None is individually urgent, but N4/N5 belong with the rate-limiting work
([02](./02-rate-limiting.md)) and N7/N9 are cheap wins whenever the touched file
is next edited.

---

## Re-verified this run (no new action needed)

- Full git-history secret scan: clean (only `.env.example` ever committed).
- All protected pages (`/my/*`, `/admin/*`, `/superAdmin/*`) call `requireRole`;
  admin course detail additionally checks `canManageCourse` per course.
- Server actions re-check `auth()` + ownership (enrollment, checkout, profile,
  referral) — no IDOR found in this pass.
- Stripe webhook verifies signatures, forces the Node runtime, and only trusts
  `payment_status === "paid"`; checkout price always derives from the server-side
  enrollment snapshot.
- Course content (video links) is only rendered for PAID / PARTIALLY_REFUNDED
  enrollments owned by the viewer.
- No raw SQL, no `dangerouslySetInnerHTML`, no file upload, no server-side fetch
  of user-supplied URLs, no GCP service-account keys, no Supabase.
- `.github/` contains only issue templates — no workflows handling secrets or
  running untrusted PR code.
