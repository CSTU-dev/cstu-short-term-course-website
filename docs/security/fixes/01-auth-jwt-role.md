# Fix area: Authentication — stale JWT role & related gaps

**Status:** **FAIL** (stale role) + related GAPs  
**Severity:** HIGH (role staleness) / MEDIUM (`trustHost`) / LOW (redirect, password policy)  
**Related checklist IDs:** A3, A6–A8, Z5–Z6  
**Key files:** `lib/auth/config.ts`, `lib/auth/guards.ts`, `proxy.ts`, `lib/actions/admin.actions.ts`

---

## Problem 1 — JWT role never refreshed from DB (HIGH)

Auth.js uses `session: { strategy: "jwt" }`. Role is written into the token only when `user` is present (sign-in):

```ts
// lib/auth/config.ts — jwt callback
if (user) {
  token.id = user.id;
  token.role = user.role ?? "USER";
}
return token;
```

Authorization (`requireRole`, `proxy.ts`, `canManageCourse`) trusts `session.user.role` from this JWT.

**Impact:**

- After `acceptAdminInvite` promotes a user to `ADMIN` in the DB, the JWT may still say `USER` until re-login → broken access or confusing UX.
- If an admin is later demoted in the DB, the JWT may still say `ADMIN` until expiry → **privilege persistence**.

**Recommended fixes (pick one or combine):**

1. In `jwt` callback, periodically (or every request) re-read `role` from DB by `token.id` (cache briefly if needed).
2. After invite accept / role change, force `signOut` + `signIn` or rotate session and update token claims immediately.
3. For sensitive gates, call `requireRole` that loads role from DB, not only JWT (defense in depth).

---

## Problem 2 — `trustHost: true` (MEDIUM)

Required for reverse-proxy deployments, but unsafe if the Node process is exposed directly to the internet without a trusted proxy stripping/forging `X-Forwarded-*` / `Host`.

**Fix:** Ensure production sits behind nginx/Caddy/Cloudflare that sets forwarded headers correctly; do not expose the app port publicly without that layer. Document the requirement.

---

## Problem 3 — `redirectTo` allowlist (LOW)

Login accepts `redirectTo` from query/form and passes it to `signIn`. Auth.js same-host default mitigates classic open redirects, but an app-level allowlist (paths starting with `/` only, deny `//`, deny external hosts) is stronger defense-in-depth.

---

## Problem 4 — Password policy (LOW)

Register requires min 8 characters; no max length / complexity. bcrypt truncates at 72 bytes — enforce a max length (e.g. 72 or 128) and optional complexity rules.

---

## Problem 5 — No in-app admin demotion (LOW)

`assignAdmin` can promote `USER` → `ADMIN`; no demotion path. Combined with stale JWT, revocation is weak.

**Fix:** Add demote/revoke action + force session refresh; optionally invalidate sessions by rotating a `sessionVersion` claim stored on the user row.

---

## Acceptance criteria

- [ ] Role changes in DB are reflected in authz within one request or forced re-login
- [ ] Demotion / invite accept both covered by tests
- [ ] Production proxy + `trustHost` documented
- [ ] Optional: `redirectTo` allowlist + password max length
