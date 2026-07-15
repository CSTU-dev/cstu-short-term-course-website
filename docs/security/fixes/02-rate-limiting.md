# Fix area: Rate limiting & brute-force protection

**Status:** **FAIL**  
**Severity:** HIGH (login/signup) / LOW (email enumeration)  
**Related checklist IDs:** A4, R1, R4  
**Key files:** `lib/actions/auth.actions.ts`, `lib/auth/index.ts`, Auth.js credentials `authorize`

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

- [ ] Sustained login attempts from one IP are throttled (document thresholds, e.g. 10/min then backoff)
- [ ] Signup similarly throttled
- [ ] Optional: reduce email enumeration signals
- [ ] Document WAF / CDN rate limits if used instead of app-level
