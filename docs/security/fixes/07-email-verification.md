# Fix area: Email verification on signup

**Status:** **DONE** (implemented 2026-07-16)  
**Severity:** MEDIUM  
**Related checklist IDs:** A5  
**Key files:** `lib/actions/auth.actions.ts`, `lib/verification.ts`, `lib/tokens.ts`, `lib/auth/access.ts`, `lib/auth/index.ts`, `app/(public)/verify/[token]/`, SMTP env (`SMTP_URL`, `EMAIL_FROM`)

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

## Implemented (2026-07-16)

Product policy chosen: **unverified users can sign in, but cannot enroll, pay,
or manage/earn referrals** until verified.

- **Signup** (`registerUser`) creates the `USER`, emails a verification link via
  `sendVerificationEmail`, and still signs them in.
- **Token** = generic `UserToken` row (`purpose = EMAIL_VERIFICATION`): high-entropy
  `nanoid(32)`, **SHA-256 at rest**, **24h TTL**, **single-use** (`usedAt`), and
  reissuing invalidates prior unused tokens. See `lib/tokens.ts`.
- **Consume** at `/verify/[token]` → `verifyEmail` sets `User.emailVerified`.
- **High-risk gates** call `isEmailVerified(userId)` (DB read, not JWT) in
  `saveEnrollment`, `createCheckoutSession`, and `changeReferralCode`.
- **Google SSO** users are treated as verified via the `signIn` callback in
  `lib/auth/index.ts` (provider asserts email ownership).
- **Resend** (`resendVerification`) surfaced as a banner on `/my`
  (`VerifyEmailBanner`), rate-limited 3 / 10 min per user (see
  [02-rate-limiting.md](./02-rate-limiting.md)).

## Acceptance criteria

- [x] Credentials users cannot complete high-risk actions until email verified (enroll/pay/referral gated)
- [x] Tokens hashed at rest, single-use, TTL (24h)
- [x] Verification + resend rate-limited (resend 3 / 10 min per user)
