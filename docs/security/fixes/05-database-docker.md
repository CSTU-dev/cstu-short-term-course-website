# Fix area: Database & Docker exposure

**Status:** **PARTIAL (2026-07-22)** — dev `docker-compose.yml` now binds
`127.0.0.1` only (D2) with a warning comment that it's local-dev-only. Production
credentials + managed/private DB (D1, D4) remain ops responsibilities.  
**Severity:** HIGH (public/LAN exposure) / MEDIUM (weak local defaults)  
**Related checklist IDs:** D1–D4, S5  
**Key files:** `docker-compose.yml`, `.env.example`, `prisma/seed.ts`

---

## Problem

Local compose publishes Postgres on host port `5432` with weak defaults:

```yaml
POSTGRES_USER: cstu
POSTGRES_PASSWORD: cstu
ports:
  - "5432:5432"
```

**Impact if this runs on a VPS / shared network:** anyone who can reach `:5432` can authenticate with `cstu:cstu` and read/modify all application data (users, enrollments, payment metadata, referral data).

Seed itself is fine: `SUPERADMIN_PASSWORD` comes from env and is bcrypt-hashed.

---

## Recommended fixes

### Local development

- Keep weak defaults **only** for localhost.
- Prefer binding to loopback only:

  ```yaml
  ports:
    - "127.0.0.1:5432:5432"
  ```

### Production / staging

- Do **not** use this compose file unchanged.
- Use managed Postgres or private network only (no public `5432`).
- Strong unique password; store in secret manager; rotate on staff change.
- Restrict firewall / security groups to app subnet.
- Use `prisma migrate deploy` in CI/CD; avoid casual `db push` on prod.
- Regular backups + tested restore; encrypt backups at rest.
- Least-privilege DB user for the app (no superuser).

### Application

- Ensure `DATABASE_URL` never logged.
- Confirm TLS to DB where supported (`sslmode=require`).

---

## Acceptance criteria

- [ ] Production DB not reachable from the public internet
- [ ] Production credentials ≠ `cstu`/`cstu`
- [x] Local compose bound to `127.0.0.1` (done 2026-07-22)
- [ ] Deploy docs state migrate strategy and backup ownership
