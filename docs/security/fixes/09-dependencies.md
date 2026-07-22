# Fix area: Dependencies & supply chain

**Status:** **FIXED (2026-07-22)** for the CI gap — `.github/workflows/security-audit.yml`
runs `pnpm audit --prod --audit-level=high` on PRs, pushes to main, and weekly;
`.github/dependabot.yml` opens weekly update PRs (npm + actions). **Residual:**
`next-auth` beta remains a RISK to track; the `shadcn` runtime-dep review is open.  
**Severity:** MEDIUM  
**Related checklist IDs:** Dep1–Dep3  
**Key files:** `package.json`, `pnpm-lock.yaml`

---

## Problems

1. **`next-auth@5.0.0-beta.31`** — authentication is on a beta line. Track GitHub advisories and upgrade promptly when stable releases / patches land.
2. **No evidence of CI dependency audit** in-repo for this audit pass — run `pnpm audit` regularly and/or enable Dependabot / Renovate.
3. **`shadcn` as a runtime dependency** is unusual (CLI is typically dev-only) — review whether it must ship in production `dependencies` (smaller prod surface is better).

Lockfile is present (good). Prefer `pnpm install --frozen-lockfile` in CI.

---

## Recommended fixes

- Add CI job: `pnpm audit --prod` (or org policy equivalent); fail on high/critical.
- Enable Dependabot/Renovate for npm.
- Pin and review Auth.js upgrades; read changelogs before bumping.
- Remove unused runtime deps if confirmed unnecessary.

---

## Acceptance criteria

- [x] Automated vulnerability scanning in CI — 2026-07-22 (`security-audit.yml`)
- [ ] Process to patch Auth.js / Next / Stripe SDKs within a defined SLA — Dependabot opens PRs; SLA still to be defined
- [ ] Production dependency set reviewed for unnecessary packages — `shadcn` runtime dep still to review
