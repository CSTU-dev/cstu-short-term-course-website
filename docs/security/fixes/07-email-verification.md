# Fix area: Email verification on signup

**Status:** **FAIL**  
**Severity:** MEDIUM  
**Related checklist IDs:** A5  
**Key files:** `lib/actions/auth.actions.ts`, Auth.js credentials flow, SMTP env (`SMTP_URL`, `EMAIL_FROM`)

---

## Problem

Credentials registration creates an active `USER` immediately with no email verification step. Fake or typo emails can enroll, abuse referral flows, or create support noise. SMTP is already modeled for admin invites but not used to verify learners.

---

## Recommended fixes

1. On register: create user as unverified (or hold in a pending table); send signed token email (nanoid/JWT, short TTL, hashed at rest like invites).
2. Block sensitive actions (enroll/pay/referral earnings) until verified — product decision.
3. Resend verification with rate limits (see [02-rate-limiting.md](./02-rate-limiting.md)).
4. Google OAuth users can be treated as verified via provider email claim.

---

## Acceptance criteria

- [ ] Credentials users cannot complete high-risk actions until email verified (per product policy)
- [ ] Tokens hashed at rest, single-use, TTL
- [ ] Verification + resend rate-limited
