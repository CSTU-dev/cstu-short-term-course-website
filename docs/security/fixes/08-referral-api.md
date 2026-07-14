# Fix area: Referral click API & invite token hygiene

**Status:** **FAIL** / GAP  
**Severity:** LOW–MEDIUM  
**Related checklist IDs:** C4, R2, T2–T3, V5  
**Key files:** `app/api/referral/click/route.ts`, `lib/referral/*`, invite accept pages

---

## Problem 1 — Click inflation (MEDIUM)

`POST /api/referral/click` is public. Deduping relies on an httpOnly cookie (`ref_seen_*`, 12h), which is trivial to bypass (clear cookies, other browsers, scripts).

Cross-site POSTs can also inflate click stats (integrity issue, not account takeover). No IP rate limit.

**Fix:**

- Rate-limit by IP + code
- Optional: require same-origin / CSRF token for browser posts
- Soften analytics: treat clicks as untrusted signals; never pay out on clicks alone (conversions should remain payment-backed)

---

## Problem 2 — Code existence oracle (LOW)

API returns `{ valid: true/false }`, enabling enumeration of short custom codes.

**Fix:** Always return a generic success for well-formed requests; record clicks only when code exists. Or add CAPTCHA / stricter rate limits for invalid codes.

---

## Problem 3 — Weak body validation (LOW)

Raw JSON parse without Zod — validate shape and length of `code` / fields.

---

## Problem 4 — Invite token in URL path (LOW)

Invite tokens appear in `/invite/[token]`. If the invitee navigates to a third-party site, `Referer` may leak the token.

**Mitigation:** Strict `Referrer-Policy` (see [04-security-headers.md](./04-security-headers.md)); prefer one-time exchange of path token for a short-lived cookie/session; keep hashing + email bind + TTL (already PASS).

---

## Acceptance criteria

- [ ] Click endpoint rate-limited
- [ ] No useful code-existence oracle (or throttled heavily)
- [ ] Request body validated with Zod
- [ ] Referrer-Policy deployed to reduce invite token leakage
