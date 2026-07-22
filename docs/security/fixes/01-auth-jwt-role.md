# Fix area: Authentication — stale JWT role & related gaps

**Status:** **FIXED (2026-07-22)** for Problems 1, 3, 4, 5. Node `jwt` callback
(`lib/auth/index.ts`) re-reads role from DB every request and compares
`sessionVersion`; password reset/change bump it. `demoteAdmin` (Problem 5 / Z6)
sets role→USER, clears course assignments, and bumps `sessionVersion`.
`redirectTo` allowlist (`lib/auth/safe-redirect.ts`) + password max-length (≤72)
landed. **Residual:** `trustHost` (Problem 2) remains an ops requirement.  
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

## Problem 5 — No in-app admin demotion + no session invalidation (LOW→MEDIUM) — FIXED 2026-07-22

> **Resolved.** `sessionVersion` (User column) is baked into the JWT at sign-in
> and re-checked from the DB on every request in the Node `jwt` callback; a
> mismatch returns `null` (signs the session out). It is incremented on password
> **reset**, password **change**, and the new `demoteAdmin` action (SUPER_ADMIN
> only: role→USER + delete all `CourseAssignment` + audit). The paragraphs below
> are the original finding, kept for context.

`assignAdmin` can promote `USER` → `ADMIN`; no demotion path. Combined with stale JWT, revocation is weak.

**New dependents (2026-07-16):** the password **reset** and **change** flows
(`resetPassword` / `changePassword` in `lib/actions/auth.actions.ts`) now update
`passwordHash` but **cannot revoke other active sessions** — under the JWT
strategy a stolen/old token stays valid until expiry (default 30 days). Both
actions carry a `TODO` pointing here. This weakens the primary purpose of
"change password to lock out an intruder." Same mechanism is needed for admin
demotion. Raising this from LOW toward MEDIUM now that self-service password
change exists.

**Fix:** Add demote/revoke action + force session refresh; invalidate sessions
by rotating a `sessionVersion` (or `tokenValidAfter`) claim on the user row,
compared per request in the `jwt`/`session` callback. Bump it on password
reset, password change, and demotion. (Alternative: switch to database sessions,
where revocation is a row delete.)

---

## Acceptance criteria

- [x] Role changes in DB are reflected in authz within one request (jwt DB refresh) — 2026-07-22
- [ ] Demotion / invite accept both covered by tests
- [x] **Password reset/change and demotion revoke other active sessions** (sessionVersion) — 2026-07-22
- [ ] Production proxy + `trustHost` documented (ops)
- [x] `redirectTo` allowlist + password max length — 2026-07-22

> Note (2026-07-16): `acceptAdminInvite` now additionally requires
> `emailVerified` (see [10-followup N1](./10-followup-todo-2026-07-11.md) and
> [07-email-verification.md](./07-email-verification.md)); the stale-role gap in
> Problem 1 is unchanged.
