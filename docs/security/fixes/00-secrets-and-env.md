# Fix area: Secrets & environment hygiene

**Status:** Mostly **PASS** (no live secrets in code)  
**Severity of remaining gaps:** MEDIUM / LOW  
**Related checklist IDs:** S1–S5, L2–L3

---

## Audit result (secrets in code)

| Item | Result |
|------|--------|
| Hardcoded `sk_live` / real `whsec_` / PEM private keys | Not found |
| Committed `.env` | Not present; `.gitignore` has `.env*` with `!.env.example` |
| Secret consumption | Via `lib/env.ts` (`AUTH_SECRET`, `DATABASE_URL`, Stripe, Google, SMTP, seed password) |
| `.env.example` | Placeholders only |

**Conclusion:** Secrets belong in `.env` (or host secret store) only. Do not commit real values.

---

## Gaps that still need fixing / ops discipline

### 1. Never enable `SKIP_ENV_VALIDATION` in production

`lib/env.ts` allows skipping Zod env checks when `SKIP_ENV_VALIDATION` is set. That can hide missing Stripe/Auth secrets until runtime failures or insecure defaults.

**Fix:** Document and enforce in deploy checklist: unset in production. Fail the deploy if required secrets are empty.

### 2. Rotate if any secret was ever pasted into chat / tickets / screenshots

Ops process only — no code change required for the audit finding.

### 3. Prefer a secret manager in production

Examples: Docker/K8s secrets, Vercel/Railway env UI, AWS Secrets Manager. Avoid long-lived secrets in shell history or shared docs.

### 4. Logging PII

`registerUser` logs email at info level. Prefer hashed user id or redact emails in production logs.

### 5. Docker Compose password

`docker-compose.yml` uses `cstu:cstu` — acceptable for **local** only. See [05-database-docker.md](./05-database-docker.md).

---

## Verification commands (for maintainers)

```bash
# Ensure .env is ignored
git check-ignore -v .env

# Scan working tree for common secret patterns (adjust as needed)
rg -n 'sk_live_|whsec_[A-Za-z0-9]{16,}|BEGIN (RSA |EC )?PRIVATE KEY' --glob '!.git/**' --glob '!pnpm-lock.yaml'
```

---

## Acceptance criteria

- [ ] No real secrets in git-tracked files
- [ ] Production deploy has `SKIP_ENV_VALIDATION` unset
- [ ] Production secrets injected via platform secret store
- [ ] Optional: log redaction for emails / tokens
