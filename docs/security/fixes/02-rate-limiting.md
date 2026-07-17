# Fix area: Rate limiting & brute-force protection

**Status:** **PARTIAL** (app/action-level done 2026-07-16; native callback path + cleanup open)  
**Severity:** HIGH (login/signup) / LOW (email enumeration)  
**Related checklist IDs:** A4, R1, R4  
**Key files:** `lib/rate-limit.ts`, `lib/actions/auth.actions.ts`, `lib/actions/admin.actions.ts`, `lib/auth/index.ts`, Auth.js credentials `authorize`

---

## Problem

There is **no application-level rate limiting** on:

- Credential login (`loginWithCredentials` / Auth.js `authorize`)
- Signup (`registerUser`)
- Related auth endpoints under `/api/auth/*`

An attacker can run online password spraying / credential stuffing without throttling.

Additionally:

- Register returns a clear “email already exists” message → email enumeration.
- Login may short-circuit before bcrypt when the user is missing → timing oracle (LOW).

Referral code *edit* already has a 3/24h limit (PASS). Referral *click* abuse is covered in [08-referral-api.md](./08-referral-api.md).

---

## Implemented (2026-07-16)

A Postgres-backed fixed-window limiter (`lib/rate-limit.ts`, `RateLimit` table)
shared across Cloud Run instances. Fails **open** on DB error (a limiter outage
must not lock users out). Client IP is read from `x-forwarded-for` / `x-real-ip`
(`clientIp()`). Thresholds live in `RATE_LIMITS`. Applied to:

| Action | Key | Threshold |
|---|---|---|
| `loginWithCredentials` | `login:ip:<ip>` | 10 / min |
| `registerUser` | `signup:ip:<ip>` | 5 / min |
| `resendVerification` | `resend-verify:user:<id>` | 3 / 10 min |
| `assignAdmin` (invite) | `admin-invite:email:<email>` | 5 / h |
| `requestPasswordReset` | `pwreset:ip:<ip>` + `pwreset:email:<email>` | 5 / 15 min + 3 / h |

Enumeration: `requestPasswordReset` now returns a **uniform** response
regardless of account existence. Signup still returns "email already exists"
(open — see below); login timing oracle (N4) also still open.

## Residual gaps (open)

1. **Native `/api/auth/*` callback path is NOT throttled.** The limiter sits in
   the `loginWithCredentials` *server action*; a direct `POST` to
   `/api/auth/callback/credentials` reaches `authorize` in `lib/auth/index.ts`
   and **bypasses it**. Fix: rate-limit inside the `authorize` callback — the one
   choke point all credential paths funnel through. Auth.js v5 passes `request`
   as the 2nd arg to `authorize`, so IP (+ email) keys are available there.
   Optionally add an edge/WAF limit (Cloud Armor) on `/api/auth/*` as
   defense-in-depth. (Middleware can't host the DB limiter: it runs on the Edge
   runtime, which can't reach Postgres.)
2. **`RateLimit` stale-row cleanup.** Active keys reset their window on the next
   hit, but keys that never recur leave dead rows → unbounded table growth.
   Add a periodic `DELETE FROM "RateLimit" WHERE "windowEnd" < now()` (Cloud
   Scheduler → protected route, or `pg_cron`). Deleting expired rows is safe: the
   next hit re-creates them via upsert.

---

## Recommended fixes

1. **Edge / middleware or reverse-proxy rate limits** keyed by IP (+ optionally email hash) on:
   - `POST` login / credentials
   - signup
   - Auth.js callback routes as appropriate
2. Use Redis / Upstash / Cloudflare Rate Limiting / nginx `limit_req`.
3. Progressive delays or temporary lockout after N failures (careful with DoS on a victim email).
4. Soften enumeration: generic “If an account exists…” messages; constant-time password check path where practical.
5. Monitor failed-login metrics / alerts.

---

## Acceptance criteria

- [x] Sustained login attempts from one IP are throttled — 10/min per IP (action-level)
- [x] Signup similarly throttled — 5/min per IP
- [ ] **Native `/api/auth/*` credential path throttled** (residual #1 — move limit into `authorize`)
- [ ] **`RateLimit` stale-row cleanup job** (residual #2)
- [ ] Reduce email enumeration signals — PARTIAL: password-reset uniform (done); signup still enumerates; login timing (N4) open
- [ ] Document WAF / CDN rate limits if used instead of app-level (Cloud Armor)
