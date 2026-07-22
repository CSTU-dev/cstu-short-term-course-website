# CSTU Short-Term Course Website — Security Checklist

**Audit date:** 2026-07-10 (follow-up re-audit: **2026-07-11**)  
**Scope:** Full repository (`/home/bolun/cstu`), public website + PostgreSQL + Auth.js + Stripe  
**Mode:** Read-only audit (no application code changes)  
**Stack:** Next.js 16, Auth.js v5 (JWT), Prisma 7, PostgreSQL, Stripe Checkout

This document is the master cybersecurity checklist. Items marked **FAIL** or **GAP** have a dedicated fix note under `docs/security/fixes/`.

> **2026-07-11 follow-up:** a second read-only pass found additional items (N1–N10) and
> consolidated every open issue into a single prioritized fix TODO —
> see [fixes/10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md).
> New checklist rows from that pass are tagged `(new 07-11)` below.
>
> **2026-07-22 remediation:** the remaining HIGH/MEDIUM **code** items were fixed
> (stale-JWT role + session revocation, native-path rate limiting, ledger-only
> refund relabel, webhook reconciliation, security headers, `https:` URL
> restriction, referral-click hardening, and the small N4–N9 items). The status
> column below is updated to **FIXED**/**PARTIAL** accordingly. The
> [master TODO](./fixes/10-followup-todo-2026-07-11.md) has the per-item detail
> and the still-open (mostly ops) residuals. **A DB migration is required** —
> `prisma/migrations/20260722120000_add_session_version_and_payment_anomaly`.

---

## Verdict (secrets)

| Check | Result |
|-------|--------|
| Live API keys / private keys / JWTs hardcoded in source | **PASS** — none found |
| Committed `.env` file | **PASS** — not present; `.env*` gitignored except `.env.example` |
| Secrets only via environment (`lib/env.ts`) | **PASS** |
| `.env.example` placeholders only | **PASS** (`sk_test_...`, `whsec_...`, empty `AUTH_SECRET`) |
| Seed password hardcoded | **PASS** — reads `SUPERADMIN_PASSWORD` from env |

See also: [fixes/00-secrets-and-env.md](./fixes/00-secrets-and-env.md) (hardening notes, not a leak).

---

## Full checklist

### 1. Secrets & configuration

| ID | Control | Status | Severity if fail | Fix doc |
|----|---------|--------|------------------|---------|
| S1 | No secrets in source / git history of tracked files | PASS (re-verified 07-11: full-history pattern scan clean) | — | — |
| S2 | `.gitignore` covers `.env*` | PASS | — | — |
| S3 | Env validated at startup (`@t3-oss/env-nextjs`) | PASS | — | — |
| S4 | `SKIP_ENV_VALIDATION` must be unset in production | GAP | MEDIUM | [00-secrets-and-env.md](./fixes/00-secrets-and-env.md) |
| S5 | Docker Compose default DB password not for production | FAIL (prod misuse) | HIGH | [05-database-docker.md](./fixes/05-database-docker.md) |

### 2. Authentication

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| A1 | Password hashing (bcrypt cost ≥ 12) | PASS | — | — |
| A2 | Session cookies httpOnly / framework-signed | PASS | — | — |
| A3 | JWT role refreshed from DB after role change | **FIXED** (07-22) | HIGH | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| A4 | Login / signup rate limiting | **FIXED** (07-22, incl. native path) | HIGH | [02-rate-limiting.md](./fixes/02-rate-limiting.md) |
| A5 | Email verification for credentials signup | **FIXED** (07-16) | MEDIUM | [07-email-verification.md](./fixes/07-email-verification.md) |
| A6 | `trustHost` only behind trusted reverse proxy | GAP (ops) | MEDIUM | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| A7 | App-level allowlist for `redirectTo` | **FIXED** (07-22, `safe-redirect.ts`) | LOW | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| A8 | Password complexity / max length policy | **FIXED** (07-22, ≤72 bytes) | LOW | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| A9 | Password change / reset flow exists `(new 07-11)` | **FIXED** (07-16; session revoke 07-22) | MEDIUM | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N3) |
| A10 | Uniform-time login (dummy hash compare on unknown user) `(new 07-11)` | **FIXED** (07-22, N4) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N4) |
| A11 | Login / Google sign-in form data Zod-validated `(new 07-11)` | **FIXED** (07-22, N5) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N5) |
| A12 | Google OAuth app restricted to developers (GCP Testing mode + test users) `(new 07-11)` | OPS | MEDIUM | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N2) |

### 3. Authorization / IDOR

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| Z1 | Server actions re-check `auth()` / roles | PASS | — | — |
| Z2 | Enrollment read scoped to owner | PASS | — | — |
| Z3 | Checkout scoped to owner | PASS | — | — |
| Z4 | Admin course access via `canManageCourse` | PASS | — | — |
| Z5 | Authz uses live DB role (not stale JWT) | **FIXED** (07-22) | HIGH | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| Z6 | Admin demotion / revoke path | **FIXED** (07-22, `demoteAdmin`) | LOW | [01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) |
| Z7 | Admin promotion requires verified email / invite-token acceptance (no direct promote of existing unverified account) `(new 07-11)` | **FIXED** (07-16, N1) | HIGH | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N1) |

### 4. Input validation / injection / XSS

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| V1 | Zod on enroll / course / profile / register | PASS | — | — |
| V2 | No Prisma raw SQL (`$queryRaw`) | PASS | — | — |
| V3 | No `dangerouslySetInnerHTML` | PASS | — | — |
| V4 | `videoUrl` restricted to `https:` (no `javascript:`) | **FIXED** (07-22) | MEDIUM | [06-input-validation-xss.md](./fixes/06-input-validation-xss.md) |
| V5 | Referral click API Zod validation | **FIXED** (07-22) | LOW | [08-referral-api.md](./fixes/08-referral-api.md) |
| V6 | Refund amount validated as finite positive number at action boundary `(new 07-11)` | **FIXED** (07-22, N7) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N7) |
| V7 | `snapshotEmail` email-format validation `(new 07-11)` | **FIXED** (07-22, N9) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N9) |

### 5. CSRF & HTTP method safety

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| C1 | Mutations via Server Actions (origin checks) | PASS | — | — |
| C2 | No state-changing GET for money/auth | PASS | — | — |
| C3 | Stripe webhook uses signature (not cookies) | PASS | — | — |
| C4 | Public `POST /api/referral/click` abuse resistance | **FIXED** (07-22, IP limit + Zod) | LOW–MEDIUM | [08-referral-api.md](./fixes/08-referral-api.md) |

### 6. Payments (Stripe)

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| P1 | Webhook signature verification | PASS | — | — |
| P2 | PAID only after webhook `payment_status === paid` | PASS | — | — |
| P3 | Checkout amount from server enrollment snapshot | PASS | — | — |
| P4 | Payment idempotency unique key | PASS | — | — |
| P5 | Manual refund creates Stripe Refund | **RESOLVED** (07-22: ledger-only by decision + warnings) | HIGH | [03-payments-stripe.md](./fixes/03-payments-stripe.md) |
| P6 | Webhook amount vs expected net price | **FIXED** (07-22, flag on mismatch) | MEDIUM | [03-payments-stripe.md](./fixes/03-payments-stripe.md) |
| P7 | Prevent double successful payment on one enrollment | **FIXED** (07-22, detect + flag) | MEDIUM | [03-payments-stripe.md](./fixes/03-payments-stripe.md) |
| P8 | Currency-aware webhook amount conversion + currency match check `(new 07-11)` | **FIXED** (07-22, N8) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N8) |

### 7. Security headers & transport

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| H1 | CSP / HSTS / X-Frame-Options / Referrer-Policy / etc. | PARTIAL (07-22: baseline headers set; CSP deferred) | MEDIUM | [04-security-headers.md](./fixes/04-security-headers.md) |
| H2 | HTTPS enforced in production | OPS | MEDIUM | [04-security-headers.md](./fixes/04-security-headers.md) |

### 8. Database & Docker

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| D1 | Strong unique DB credentials in production | GAP (ops; dev creds are local-only) | HIGH | [05-database-docker.md](./fixes/05-database-docker.md) |
| D2 | Postgres not publicly bound (`0.0.0.0:5432`) | **FIXED** (07-22: dev binds `127.0.0.1`) | HIGH | [05-database-docker.md](./fixes/05-database-docker.md) |
| D3 | Seed uses env + bcrypt | PASS | — | — |
| D4 | Production uses `migrate deploy` (not casual `db push`) | OPS | MEDIUM | [05-database-docker.md](./fixes/05-database-docker.md) |
| D5 | Seed guardrails: `SUPERADMIN_EMAIL` upsert force-promotes; rotate/remove `SUPERADMIN_PASSWORD` after first seed `(new 07-11)` | OPS | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N10) |

### 9. Logging & PII

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| L1 | Passwords / card data / Stripe secrets not logged | PASS | — | — |
| L2 | Email PII in registration logs | **FIXED** (07-22: userId only) | LOW | [00-secrets-and-env.md](./fixes/00-secrets-and-env.md) |
| L3 | Log redaction middleware | GAP | LOW | [00-secrets-and-env.md](./fixes/00-secrets-and-env.md) |

### 10. Rate limiting & abuse

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| R1 | Login / signup / credentials authorize rate limit | **FIXED** (07-22, incl. `authorize`) | HIGH | [02-rate-limiting.md](./fixes/02-rate-limiting.md) |
| R2 | Referral click IP throttle | **FIXED** (07-22, 30/min per IP) | MEDIUM | [08-referral-api.md](./fixes/08-referral-api.md) |
| R3 | Referral code edit limit (3/24h) | PASS | — | — |
| R4 | Email enumeration on register/login | GAP | LOW | [02-rate-limiting.md](./fixes/02-rate-limiting.md) |

### 11. Tokens (invite / referral)

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| T1 | Invite: high-entropy nanoid + SHA-256 at rest + TTL + email bind | PASS | — | — |
| T2 | Invite token in URL (Referer leakage) | GAP | LOW | [08-referral-api.md](./fixes/08-referral-api.md) |
| T3 | Referral click returns code validity oracle | GAP | LOW | [08-referral-api.md](./fixes/08-referral-api.md) |
| T4 | Referral code case-insensitive uniqueness + reserved-word blocklist + retention policy `(new 07-11)` | **FIXED** (07-22, N6; retention kept-valid by design) | LOW | [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) (N6) |

### 12. File upload / SSRF

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| F1 | No file upload endpoints | PASS | — | — |
| F2 | No server-side fetch of user URLs | PASS | — | — |

### 13. Dependencies / supply chain

| ID | Control | Status | Severity | Fix doc |
|----|---------|--------|----------|---------|
| Dep1 | Lockfile present (`pnpm-lock.yaml`) | PASS | — | — |
| Dep2 | `next-auth` still beta — track advisories | RISK | MEDIUM | [09-dependencies.md](./fixes/09-dependencies.md) |
| Dep3 | CI `pnpm audit` / Dependabot | **FIXED** (07-22) | MEDIUM | [09-dependencies.md](./fixes/09-dependencies.md) |

---

## What is already solid (do not regress)

1. Secrets via env + Zod validation; `.env` not committed.
2. bcrypt cost 12; passwords never logged.
3. Defense-in-depth: `proxy.ts` + `requireRole` + action-level checks.
4. Enrollment / checkout ownership checks (IDOR largely defended).
5. Stripe: server-priced Checkout, webhook signature, PAID not from browser redirect.
6. Invite tokens hashed at rest, email-bound, TTL, single-use.
7. Audit log on sensitive mutations.
8. No raw SQL, no `dangerouslySetInnerHTML`, no upload/SSRF surface.

---

## Priority remediation order

> Superseded by the consolidated, prioritized fix TODO in
> [fixes/10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md),
> which merges the list below with the 07-11 findings (N1–N10).

0. **HIGH (new 07-11)** — Admin promotion only via invite token + verified email → [10 (N1)](./fixes/10-followup-todo-2026-07-11.md)
1. **HIGH** — Refresh JWT role from DB / force re-login after role change → [01](./fixes/01-auth-jwt-role.md)
2. **HIGH** — Rate-limit login & signup → [02](./fixes/02-rate-limiting.md)
3. **HIGH** — Wire Stripe Refunds (or label ledger-only) → [03](./fixes/03-payments-stripe.md)
4. **HIGH** — Harden Postgres exposure & credentials for any non-local deploy → [05](./fixes/05-database-docker.md)
5. **MEDIUM** — Security headers → [04](./fixes/04-security-headers.md)
6. **MEDIUM** — Payment amount reconciliation & double-pay → [03](./fixes/03-payments-stripe.md)
7. **MEDIUM** — Restrict `videoUrl` schemes → [06](./fixes/06-input-validation-xss.md)
8. **MEDIUM** — Email verification → [07](./fixes/07-email-verification.md)
9. **LOW–MEDIUM** — Referral click abuse / oracle → [08](./fixes/08-referral-api.md)
10. **MEDIUM** — Dependency audit in CI → [09](./fixes/09-dependencies.md)

---

## Fix notes index

| File | Area |
|------|------|
| [fixes/00-secrets-and-env.md](./fixes/00-secrets-and-env.md) | Secrets hygiene (mostly PASS) + ops gaps |
| [fixes/01-auth-jwt-role.md](./fixes/01-auth-jwt-role.md) | Stale JWT role, trustHost, redirects |
| [fixes/02-rate-limiting.md](./fixes/02-rate-limiting.md) | Brute force / credential stuffing |
| [fixes/03-payments-stripe.md](./fixes/03-payments-stripe.md) | Refunds, amount checks, double pay |
| [fixes/04-security-headers.md](./fixes/04-security-headers.md) | CSP, HSTS, framing, etc. |
| [fixes/05-database-docker.md](./fixes/05-database-docker.md) | DB exposure & credentials |
| [fixes/06-input-validation-xss.md](./fixes/06-input-validation-xss.md) | Stored XSS via video URLs |
| [fixes/07-email-verification.md](./fixes/07-email-verification.md) | Unverified signup |
| [fixes/08-referral-api.md](./fixes/08-referral-api.md) | Click inflation / enumeration |
| [fixes/09-dependencies.md](./fixes/09-dependencies.md) | Beta auth, audit pipeline |
| [fixes/10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) | 07-11 follow-up: new findings N1–N10 + master prioritized fix TODO |

## 中文详解（Chinese Walkthrough）

> ⚠️ **状态说明（2026-07-22）**：本节的文字是 **2026-07-10 / 07-11 审计当时**的快照，
> 里面的"FAIL / GAP / 目前没有…"描述的是**当时**的状态。此后经过 07-16 与 07-22 两轮
> 修复，**大部分 FAIL/GAP 已修复**。每条的**最新结论以上方表格和
> [fixes/10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) 为准**；
> 下文对结论已变化的条目就地加了 `【YYYY-MM-DD 已修复：…】` 标注。原始描述保留，方便理解问题背景。

> 本节把每一条检查项用中文展开讲清楚：**这项在查什么、对应什么安全概念、为什么重要、当前结果是什么**。按第 1–13 类顺序讲解，编号（S1、A1、Z1…）与上面表格一一对应，方便对照查阅。

### 第 1 类：Secrets & configuration（密钥与配置）

这一类检查"有没有把密码/密钥这类敏感信息硬编码进代码里"。这是最基本也最容易被忽视的问题——一旦密钥进了 git 历史，即使后来删除，只要仓库公开过，密钥就已经泄露了。

- **S1 - 源码/git历史里没有密钥**：扫描了整个 git 提交历史（不只是当前文件），用正则匹配 Stripe 密钥格式(`sk_live_`)、AWS密钥(`AKIA`)、Google API key(`AIza`)、私钥文件头(`-----BEGIN...PRIVATE KEY`)、GitHub token(`ghp_`)等特征串。结果：**PASS**，干净。
- **S2 - `.gitignore` 排除了 `.env*`**：`.env` 文件（真正装密钥的地方）不会被提交，只有 `.env.example`（占位符模板）被提交。**PASS**。
- **S3 - 启动时校验环境变量**：项目用了 `@t3-oss/env-nextjs`，在 `lib/env.ts` 里用 Zod 定义每个环境变量该是什么格式，启动时如果缺失必填项会直接报错崩溃，而不是"悄悄地用空值运行"。这是好的工程实践——Fail Fast（尽早暴露配置问题）。**PASS**。
- **S4 - `SKIP_ENV_VALIDATION` 不能在生产环境开启**：这个开关是为了让 CI 构建时（没有真实密钥）也能跑通，但如果生产环境不小心留着这个开关，S3 的保护就失效了。**GAP**（有隐患，需要在部署清单里明确禁止）。
- **S5 - Docker Compose 默认密码不能用于生产**：`docker-compose.yml` 里数据库账号密码是 `cstu:cstu`，只是为了让开发者本地能一键启动数据库，绝对不能照搬到线上。**FAIL（如果被误用于生产）**。

### 第 2 类：Authentication（身份认证）

这一类查的是"你是谁"——登录、密码、会话管理是否安全。

- **A1 - 密码哈希用 bcrypt cost≥12**：密码不能明文存数据库，必须用慢哈希算法（bcrypt）加盐处理，`cost=12` 表示计算强度足够大，让暴力破解成本很高。**PASS**。
- **A2 - Session cookie 是 httpOnly**：登录后的会话 cookie 不能被 JavaScript 读取（防止 XSS 攻击时脚本偷走登录态），且由框架（Auth.js）签名防篡改。**PASS**。
- **A3 - JWT 里的角色（role）在权限变化后会刷新**：FAIL，高危。这个项目用 JWT 存 session，用户角色（USER/ADMIN/SUPER_ADMIN）是在登录那一刻写进 JWT 令牌的。问题是：如果超级管理员把某个 ADMIN 降级成 USER，数据库改了，但这个人手里的 JWT 令牌还带着旧的 "ADMIN" 身份，要等 token 过期或重新登录才会失效——这段时间里他依然能用管理员权限操作。这叫"权限持久化（stale privilege）"漏洞。 **【2026-07-22 已修复：Node 端 jwt 回调每次请求从数据库刷新 role 并比对 `sessionVersion`，角色变更一个请求内即生效；配合 `demoteAdmin` 降级会 `sessionVersion +1` 立即作废旧会话。】**
- **A4 - 登录/注册有频率限制**：FAIL，高危。目前没有任何机制阻止有人对登录接口疯狂尝试密码（暴力破解/撞库攻击 credential stuffing）。 **【2026-07-16/07-22 已修复：Postgres 固定窗口限流（登录 10/分、注册 5/分，按 IP），且限流已下沉到 Auth.js `authorize`，原生 `/api/auth/callback/credentials` 路径也覆盖到了。】**
- **A5 - 邮箱验证**：FAIL，中危。用密码注册后账号立刻可用，没有发验证邮件确认这个邮箱真的是你的。会导致虚假邮箱注册、滥用推荐系统等问题。 **【2026-07-16 已修复：注册后发哈希单次 24h 验证链接；未验证可登录但不能报名/支付/管理推广；Google 登录视为已验证。见 07-email-verification.md。】**
- **A6 - `trustHost` 只能在受信任的反向代理后面使用**：`trustHost: true` 让 Auth.js 信任请求里的 Host/X-Forwarded-* 头。如果这个 Node 服务直接暴露在公网（没有 nginx/Cloudflare 这类反代层过滤请求头），攻击者可以伪造 Host 头来欺骗系统生成错误的回调链接（比如钓鱼）。GAP，需要保证生产环境部署在受信任代理之后。
- **A7 - `redirectTo` 白名单**：登录后允许携带一个 `redirectTo` 参数跳转，如果不做校验，理论上可能被诱导跳到外部恶意网站（开放重定向 open redirect，常被用于钓鱼）。GAP，低危但建议加固。 **【2026-07-22 已修复：共享 `lib/auth/safe-redirect.ts`——只接受以单个 `/` 开头的同站路径，拒绝 `//host` 和带协议的 URL；登录与 Google 登录都用它。】**
- **A8 - 密码复杂度/长度策略**：目前只要求≥8位，没有最大长度限制。bcrypt 算法本身只处理前 72 字节，超过部分会被忽略，理论上应该显式限制最大长度。GAP，低危。 **【2026-07-22 已修复：注册/登录/authorize 均限制密码 ≤72 字节。】**
- **A9（新发现）- 没有"修改密码/找回密码"功能**：用户如果怀疑密码泄露，没有任何自助方式更换密码。FAIL，中危。 **【2026-07-16 已修复：`requestPasswordReset`（统一响应、IP+邮箱限流）→ `/reset/[token]` → `resetPassword`；`/my/info` 的 `changePassword`（需当前密码）。2026-07-22 补上会话吊销：改密码/重置会 `sessionVersion +1` 作废旧会话。】**
- **A10（新发现）- 登录耗时不一致（计时侧信道）**：`authorize` 函数里，如果邮箱不存在，直接返回 null；如果邮箱存在但密码错，会跑一次 bcrypt 比较（耗时几十毫秒）。攻击者可以通过测量响应时间差异来判断"这个邮箱是否注册过"。GAP，低危，修复方式是无论邮箱存在与否都跑一次假的 bcrypt 比较，让耗时一致。 **【2026-07-22 已修复（N4）：`authorize` 在用户不存在/无密码时对常量 `DUMMY_PASSWORD_HASH` 跑一次 bcrypt，两分支耗时一致。】**
- **A11 - 登录表单没有用 Zod 校验**：注册用了 Zod 校验输入，但登录/Google登录的表单数据是直接强制类型转换读取的，缺少统一校验。GAP，低危。 **【2026-07-22 已修复（N5）：`loginWithCredentials` 用 `LoginSchema`、`authorize` 用 `CredentialsSchema`（邮箱格式 + 密码 ≤72），`redirectTo` 走 `safe-redirect.ts` 白名单。】**
- **A12（新发现）- Google OAuth 目前应仅限开发者使用**：见文末"专题：Google Cloud / Google OAuth 权限"。

### 第 3 类：Authorization / IDOR（授权与越权访问）

IDOR = Insecure Direct Object Reference（不安全的直接对象引用），意思是"我能不能通过改一个 ID 就看到/改到不属于我的数据"，比如 `/my/courses/123` 改成 `124` 能不能看别人的课程订单。这是 Web 安全里最常见也最容易被忽视的漏洞类型之一。

- **Z1 - 每个 server action 都重新检查 `auth()`/角色**：即使前端已经隐藏了某个按钮，后端的每个操作函数依然会重新验证"你现在是谁、有没有权限"，不信任前端传来的任何身份声明。PASS，这是纵深防御（defense in depth）的核心思想。
- **Z2 - 查看报名信息时限定为本人**：`getMyEnrollment(id, session.user.id)` 查询时把 userId 也作为过滤条件，即使猜中了别人的报名记录 ID，查不到别人的（Prisma 查询里 userId 不匹配就返回空）。PASS。
- **Z3 - 结账（checkout）限定为本人的报名记录**：同上道理，不能拿别人的 enrollmentId 去发起支付。PASS。
- **Z4 - 管理员访问课程要走 `canManageCourse` 检查**：ADMIN 只能管理被分配给自己的课程，不能管理别人负责的课程（SUPER_ADMIN 可以管所有）。PASS。
- **Z5 - 授权判断要基于数据库里的实时角色，而不是过时的 JWT**：这其实是 A3 的另一种表述——整个权限体系（中间件、`requireRole`、`canManageCourse`）都读的是 JWT 里的 role 字段，而不是每次去数据库查最新角色。FAIL，高危，和 A3 是同一个根因。 **【2026-07-22 已修复：同 A3——jwt 回调每次请求刷新 role，`session.user.role` 因此始终是数据库实时值，`requireRole`/`canManageCourse` 用的就是刷新后的角色。】**
- **Z6 - 管理员降级/撤权功能**：目前只有"提权"的代码路径（`assignAdmin` 把 USER 提升为 ADMIN），没有反向"撤销管理员身份"的功能。GAP，低危。 **【2026-07-22 已修复：新增 `demoteAdmin`——role 降回 USER + 清空全部课程分配 + `sessionVersion +1` 踢下线 + 审计；superAdmin 课程页每个管理员有"Revoke admin"按钮。】**
- **Z7（新发现，高危）— 管理员提权应要求已验证的邮箱 / 走邀请token流程**：这是本轮审计发现的最重要问题。 **【2026-07-16 已修复（N1）：仅当已存在账号且邮箱已验证才直接提权，其余一律走邮箱绑定的邀请 token，`acceptAdminInvite` 额外要求 `emailVerified`。】**`assignAdmin` 函数（`lib/actions/admin.actions.ts`）逻辑是——超级管理员想给某个邮箱授权成 ADMIN：
  - 如果这个邮箱**还没注册过**：系统生成一个邀请 token（哈希存储、有效期7天、绑定邮箱），走"邀请接受"流程，比较安全。
  - 如果这个邮箱**已经注册过账号**：系统**直接**把这个已存在的账号提升为 ADMIN，不需要这个人做任何确认动作。

  问题在于：项目目前没有邮箱验证机制（对应 A5）。也就是说，任何人都可以用"老板的邮箱地址"注册一个账号（反正没人验证这封邮箱是不是真的属于他），如果这个"老板的邮箱"恰好被超级管理员在后台输入准备邀请他做管理员，系统会直接把这个"冒充者注册的账号"提升为管理员权限——因为系统认为"邮箱匹配=同一个人"，但邮箱从未被验证过。

  修复思路：让"已存在账号"也必须走邀请token确认流程，并且要求该账号的邮箱已经过验证（`emailVerified` 字段有值）才能被提权。

### 第 4 类：Input validation / injection / XSS（输入校验/注入/跨站脚本）

- **V1 - 报名/课程/资料/注册接口都用 Zod 做输入校验**：PASS，防止畸形数据、超长字符串等问题进入数据库。
- **V2 - 没有用 Prisma 的 `$queryRaw`（拼接原始SQL）**：Prisma 默认用参数化查询防 SQL 注入，只要不手写原始SQL拼字符串，就基本没有注入风险。PASS。
- **V3 - 没有用 `dangerouslySetInnerHTML`**：React 里这个 API 会把字符串当 HTML 直接渲染，如果内容来自用户输入且没转义，就是经典的存储型 XSS（跨站脚本攻击）入口。这个项目完全没用这个 API。PASS。
- **V4 - 课程视频链接（videoUrl）限制为 https 协议**：FAIL，中危。目前只用 `z.url()` 校验"这是个合法URL格式"，但没限制协议类型。理论上恶意管理员/被入侵的管理员账号可以填入 `javascript:alert(1)` 这样的伪协议链接，当学生点击"观看"按钮时执行恶意脚本。修复很简单：加一个协议白名单只允许 `https:`。 **【2026-07-22 已修复：`videoUrl`、`zoomLink`、`ZoomLinkSchema` 统一走 `httpsUrl()` refine，只允许 https（dev 放行 localhost），`javascript:`/`data:` 被拒。】**
- **V5 - 推广链接点击接口的 Zod 校验**：`/api/referral/click` 直接手动 `JSON.parse`，没有走 Zod 校验请求体格式。GAP，低危。 **【2026-07-22 已修复：请求体走 `ClickSchema`（code 1–64、courseSlug 可选 ≤200）。】**
- **V6（新发现）- 退款金额没校验为"有限的正数"**：手动退款功能里，如果传入 `NaN`（不是数字），代码里的两个数值比较会因为 `NaN` 参与比较全部返回 false，直接"漏过"两道校验，最后才在数据库层报错。应该在业务代码入口就用 Zod 拦截。GAP，低危。 **【2026-07-22 已修复（N7）：`recordManualRefund` 入口加 `RefundAmountSchema`（`z.number().finite().positive().max(1_000_000)`）。】**
- **V7（新发现）- 报名快照邮箱字段没做邮箱格式校验**：其他地方（如 profile 页面）的邮箱字段都校验了格式，报名表单的 `snapshotEmail` 却只限制了长度。GAP，低危，属于代码一致性问题。 **【2026-07-22 已修复（N9）：抽出共享 `optionalEmail()` refine，`snapshotEmail` 与 `preferredEmail` 一致做邮箱格式校验。】**

### 第 5 类：CSRF & HTTP method safety（跨站请求伪造）

CSRF：你已经登录了 A 网站，然后打开一个恶意页面 B，B 页面偷偷让你的浏览器向 A 网站发一个请求（比如转账），因为浏览器会自动带上 A 网站的 cookie，A 网站误以为是你本人操作。

- **C1 - 所有会修改数据的操作都通过 Next.js Server Actions 完成**：Server Actions 有内置的 Origin 校验机制，本身对经典 CSRF 有防护。PASS。
- **C2 - 没有用 GET 请求做涉及金钱/身份变更的操作**：GET 请求容易被恶意链接、图片标签等触发，绝不应该用来做转账、改密码这类操作。PASS。
- **C3 - Stripe webhook 用签名验证而不是 cookie**：webhook 是 Stripe 服务器直接调用的，没有用户 cookie，靠密钥签名（`stripe-signature` 头）验证请求真的来自 Stripe，不是靠登录态。PASS。
- **C4 - 公开的推广点击接口缺乏滥用防护**：FAIL，低到中危。`/api/referral/click` 是公开接口任何人都能调用，没做频率限制，可以被用来刷点击数据（虽然不会导致资金损失，因为佣金只在真实付款后才产生，但会污染统计数据）。 **【2026-07-22 已修复：请求体走 Zod 校验，且按 IP 限流 30/分。仍返回 `{valid}`（低危枚举 oracle，客户端需要），已被限流覆盖。】**

### 第 6 类：Payments — Stripe 支付（涉及真金白银，最需要仔细看的一类）

- **P1 - Webhook 签名验证**：PASS，webhook 收到 Stripe 消息后必须验证签名，防止别人伪造"支付成功"的假消息。
- **P2 - 只有 webhook 确认 `payment_status === paid` 才标记为已支付**：PASS，非常关键的设计——用户支付完 Stripe 会把浏览器重定向回网站的"成功页"，但绝不能靠这个重定向来判断支付是否成功（浏览器关闭、网络中断都可能导致重定向没发生，重定向也可以被伪造）。真正权威的信号只能是 Stripe 服务器主动调用的 webhook。这个项目做对了。
- **P3 - 结账金额来自服务器端的报名快照，不是前端传来的**：PASS，价格在服务端根据数据库记录计算，不接受前端说"这个课程999元"这种前端传参，防止改价篡改攻击。
- **P4 - 支付有幂等性（同一笔支付不会被处理两次）**：PASS，通过 `(provider, externalId)` 做唯一性判断。
- **P5 - 手动退款要真正调用 Stripe 的退款接口**：FAIL，高危。目前后台的"退款"按钮只是在自己数据库里记一笔"已退款"，并没有真的调用 Stripe API 把钱退给用户的银行卡。这是个很严重的业务逻辑漏洞——管理员点了退款，系统显示退款成功，但用户的钱其实还在公司账户里没退，等于系统记录和真实资金状态不一致。 **【2026-07-22 处理：经产品决策改为"纯记账"——`recordManualRefund` 只写内部账本，UI 改名"Record ledger adjustment"并加红框警告"不退真钱，请到 Stripe 后台退"，并加 N7 金额校验。真实退款在 Stripe 后台执行，因此记录与资金状态的语义现在是一致的（明确标注为账本调整）。】**
- **P6 - webhook 收到的金额要跟预期净价核对**：FAIL，中危。如果 Stripe 传来的金额跟服务器记录的应付金额不一致（比如中间人篡改，或 Stripe 那边价格被意外改动），目前没有做二次核验。 **【2026-07-22 已修复：`recordPayment` 比对到账金额与净价（±1 分）、比对币种，不符则写 `PAYMENT_ANOMALY` 审计 + error 日志告警（钱已到账故照实入账，异常交运维处理）。】**
- **P7 - 防止同一笔报名被"成功支付"两次**：FAIL，中危，跟 P4 的幂等键设计有关联但还有额外的业务规则要补。 **【2026-07-22 已修复：对已支付报名再次到账（重复 Checkout Session）会被检测并写 `PAYMENT_ANOMALY` 告警；佣金已有 `!wasPaid` 守卫不会重复发放，重复款项由运维在 Stripe 手动退。】**
- **P8（新发现）- 货币换算要考虑"零小数位货币"**：Stripe 对不同货币的最小单位不同。比如美元(USD)：`amount_total` 是"分"，除以100才是"元"；但日元(JPY)这类货币没有小数位，`amount_total` 本身就是"元"，如果不判断货币类型直接除以100，会算错100倍。目前代码写死了"除以100"，没有按币种判断。GAP，低危（因为目前项目只用一种货币，但换算逻辑本身是有缺陷的）。 **【2026-07-22 已修复（N8）：新增 `lib/payments/currency.ts` 的 `fromStripeMinorUnits`，按零小数位币种集合换算；webhook 传入币种，`recordPayment` 额外做币种一致性校验。】**

### 第 7 类：Security headers & transport（安全响应头与传输层）

这一类查的是浏览器和服务器之间"约定的安全规则"有没有通过 HTTP 响应头开启。这些头不是代码逻辑，而是浏览器内置防护机制的开关。

- **H1 - CSP/HSTS/X-Frame-Options/Referrer-Policy 等**：FAIL，中危。`next.config.ts` 目前完全是空的，一个安全头都没配置。 **【2026-07-22 部分修复：`next.config.ts` 已加基线响应头——`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`X-Frame-Options: DENY`、`Permissions-Policy`，生产环境加 HSTS。**残留：**强制 CSP 暂缓（需配合 Stripe/Google 调优并在 staging 验证，建议先 report-only）。】** 具体缺哪些、各自防什么：
  - `Content-Security-Policy`(CSP)：限制页面能加载哪些来源的脚本/样式/图片，是防 XSS 的第二道防线（就算 V4 那种 `javascript:` 链接漏网，CSP 也能拦截）。
  - `Strict-Transport-Security`(HSTS)：强制浏览器以后都用 HTTPS 访问这个域名，即使用户手动输入 `http://` 也会被浏览器自动升级，防止"中间人降级攻击"。
  - `X-Frame-Options` / CSP `frame-ancestors`：防止别的网站把你的网站嵌入一个隐藏的 `<iframe>` 里做点击劫持（clickjacking）——比如伪装成"点击领奖"的按钮，实际上底下藏着你网站的"确认转账"按钮。
  - `X-Content-Type-Options: nosniff`：防止浏览器"猜测"文件类型，避免把本该是纯文本的文件当成 HTML/JS 执行。
  - `Referrer-Policy`：控制"从A页面跳到B页面时，B页面能看到多少A页面的URL信息"——这个项目里邀请链接、推广链接的 token 都在 URL 路径里，如果用户从邀请页面点了外部链接，没做 Referrer-Policy 的话，那个 token 可能会泄露给第三方网站的服务器日志。
- **H2 - 生产环境强制 HTTPS**：OPS（运维层面），代码本身管不了这个，要看部署方式（反代/云平台）有没有强制 TLS。

### 第 8 类：Database & Docker（数据库与容器暴露）

这一类是"你的数据库有没有对外面的世界敞开大门"。

- **D1 - 生产环境用强且唯一的数据库密码**：FAIL（如果照搬 compose 文件）。`docker-compose.yml` 里数据库账号密码就是 `cstu / cstu`，这是特意为了让开发者本地一条命令就能跑起来，绝对不能带去生产环境。
- **D2 - Postgres 不能绑定在 `0.0.0.0:5432`（即不能对公网开放）**：FAIL（如果部署到VPS且照搬这份配置）。现在 compose 文件里写的是 `ports: ["5432:5432"]`，这个写法会让数据库端口在宿主机的所有网卡上监听，如果这台服务器是云主机且防火墙没管住5432端口，等于全世界都能直接连你的数据库——只要知道 `cstu:cstu` 这组弱密码，就能读写/删除所有用户、订单、支付元数据。修复思路：本地开发改成 `"127.0.0.1:5432:5432"`（只在本机回环地址监听），生产环境干脆不通过 compose 暴露端口，用私有网络或托管数据库（如 RDS/Cloud SQL）。 **【2026-07-22 已修复（开发侧）：`docker-compose.yml` 的 db 与 mailpit 端口都改为绑定 `127.0.0.1`，并加了"仅本地开发"警告注释。生产强密码/托管库仍属运维职责（D1）。】**
- **D3 - 种子脚本用环境变量+bcrypt**：种子脚本本身写得没问题，密码是从环境变量读的，也做了 bcrypt 哈希。PASS。
- **D4 - 生产环境要用 `migrate deploy` 而不是随手 `db push`**：Prisma 的 `db push` 是"我describe一下现在想要什么schema，你帮我强行同步"，没有变更历史、也没有回滚能力，适合本地快速试错；`migrate deploy` 是"按照版本化的migration文件顺序执行"，可审计、可回滚，生产环境应该固定用后者。OPS，中危。
- **D5（新发现）- 种子脚本的"隐藏提权"风险**：`prisma/seed.ts` 逻辑是：根据 `SUPERADMIN_EMAIL` 这个环境变量做 upsert（存在则更新，不存在则创建），每次运行都会强制把这个邮箱对应账号的角色设为 SUPER_ADMIN。如果部署流程里这个种子脚本被重复执行（比如 CI/CD 每次部署都跑一遍），而运维不小心把 `SUPERADMIN_EMAIL` 改成了别的邮箱（哪怕是笔误），就会把一个意想不到的现有账号提升为超级管理员。另外首次种子完之后，`SUPERADMIN_PASSWORD` 这个环境变量就该从生产环境里移除/轮换掉，长期留着没有必要还增加风险面。OPS，低危。

### 第 9 类：Logging & PII（日志与个人信息保护）

这一类关心的是"日志里有没有不该记录的敏感信息"。日志系统通常权限管理比数据库宽松（很多人能看日志平台），万一日志里混进了密码或者身份证号，等于变相泄露。

- **L1 - 密码/银行卡数据/Stripe密钥不会被记录到日志**：PASS，检查了 `lib/logger.ts` 和各处 `log.info(...)` 调用，没有发现密码明文、Stripe密钥这类高敏感信息被打进日志。
- **L2 - 注册日志里有邮箱这类PII（个人可识别信息）**：GAP，低危。`registerUser` 函数里有一行 `log.info({ email }, "user registered")`，把用户邮箱明文记进了结构化日志。虽然邮箱不算"高度敏感"信息，但严格来说属于PII，很多合规框架（比如GDPR）要求日志里的PII要脱敏或者限制访问。建议改成只记 user id 或者对邮箱做部分掩码（如 `bo***@gmail.com`）。 **【2026-07-16/07-22 已修复：`registerUser` 改记 `userId`；`requestPasswordReset` 未知/OAuth 分支与 `assignAdmin` 的 info 日志去掉了明文邮箱（审计表作为有意留存的记录仍保留邮箱）。】**
- **L3 - 日志脱敏中间件**：目前没有一个统一的"自动过滤敏感字段"的日志中间件，都是靠每个开发者自觉不要把敏感字段传进 `log.info()`。GAP，低危，属于"人治不如制度"的典型例子——建议做一层通用的 redact 逻辑，自动屏蔽 `password`、`token`、`secret` 等字段名，而不依赖开发者记性。

### 第 10 类：Rate limiting & abuse（频率限制与滥用防护）

这类和第2类的 A4 是同一个根因，但从"系统整体防滥用"的角度再看一遍：

- **R1 - 登录/注册/凭证验证要有频率限制**：FAIL，高危（同 A4）。 **【2026-07-16/07-22 已修复，见 A4：动作层 + `authorize` 层双重限流覆盖了原生 callback 路径。】** 具体后果：
  - 暴力破解（brute force）：对着一个已知邮箱疯狂试密码。
  - 撞库攻击（credential stuffing）：黑客手里有从别的网站泄露的"邮箱+密码"库，拿来批量试你的网站，因为很多人多个网站用同一个密码。
  
  这两种攻击在没有频率限制的情况下，理论上可以每秒尝试几十上百次，很快就能撞中弱密码账号。
- **R2 - 推广点击接口的IP限流**：FAIL，中危（同C4），可以被脚本刷点击量污染统计数据。 **【2026-07-22 已修复：`/api/referral/click` 按 IP 限流 30/分。另外 2026-07-16 起限流器还有一个残留项 N11——过期行清理——已于 2026-07-22 通过 `/api/cron/cleanup-rate-limits` 定时清理路由解决。】**
- **R3 - 推广码修改次数限制（24小时内最多3次）**：PASS，这是少数几个已经做了限流的地方，说明开发者是知道"限流"这个概念的，只是没有覆盖到登录这个最关键的入口。
- **R4 - 注册/登录时的"邮箱枚举"问题**：GAP，低危。`registerUser` 如果邮箱已存在，会明确返回"An account with this email already exists"，攻击者可以拿一批邮箱地址批量测试，通过这个提示筛选出哪些邮箱在本站已注册过，为后续精准钓鱼或撞库提供"确认目标"的信息。修复思路是统一返回模糊提示（如"如果这个邮箱未注册，我们已发送了一封确认邮件"），不管邮箱是否存在都返回一样的话。

### 第 11 类：Tokens（邀请码/推广码令牌设计）

这类专门审查项目里"一次性令牌"的设计是否安全——邀请链接、推广码本质上都是"持有这个字符串就能做某件事"的凭证。

- **T1 - 邀请令牌：高熵nanoid + SHA-256哈希存储 + 有效期 + 绑定邮箱**：PASS，这是设计得比较好的部分，值得学习：
  - 高熵（high-entropy）：用 `nanoid(32)` 生成随机字符串，32个字符的随机性，暴力猜测几乎不可能。
  - 哈希存储（不是明文存token）：数据库里存的是 `hashToken(token)`（SHA-256的结果），而不是token原文——即使数据库被拖库（数据泄露），攻击者拿到的哈希值也无法反推出原始token，无法冒用邀请链接。这跟密码哈希是同一个思路。
  - 有效期（TTL）：7天后邀请自动失效。
  - 绑定邮箱：即使token被别人截获，接受邀请时还要校验"当前登录账号的邮箱是否等于邀请里指定的邮箱"，多一层防护。
- **T2 - 邀请token出现在URL路径里，可能通过Referer泄露**：GAP，低危（跟H1的Referrer-Policy是配套修复项）。因为 `/invite/[token]` 这种设计，如果用户在这个页面点击了跳转到第三方网站的链接，浏览器默认行为下，第三方网站的服务器日志可能会记录到"来源URL"，从而看到这个token。 **【2026-07-22 已缓解：`Referrer-Policy: strict-origin-when-cross-origin` 已上线，跨站跳转时只发送 origin、不带路径里的 token。一次性换 token 为短期 cookie 仍可作为后续加固。】**
- **T3 - 推广点击接口存在"验证有效性的oracle"**：GAP，低危（同C4/T2那批）。接口返回明确的 `{valid: true/false}`，攻击者可以用这个接口批量爆破/枚举出哪些短推广码是真实存在的。 **【2026-07-22 已缓解：接口现按 IP 限流 30/分，批量枚举被显著抑制；仍返回 `{valid}`（客户端需要），完全消除 oracle 未做。】**
- **T4（新发现）- 推广码缺少大小写唯一性/保留词黑名单/清理策略**：三个小问题打包在一起： **【2026-07-22 已修复（N6）：加了保留词黑名单 `isReservedReferralCode`（admin/cstu/official 等）+ 改码时大小写不敏感查重（`findFirst … mode:"insensitive"`）。第 3 点"清理策略"按设计保留——旧码故意保持有效以免分享链接失效；DB 级大小写唯一索引暂缓。】**
  1. 大小写唯一性：如果推广码判重时是大小写敏感的（`ABC` 和 `abc` 被当成两个不同的码），用户可能会误以为自己的码被占用了/或者产生混淆的分享链接。
  2. 保留词黑名单：用户可以自定义推广码（4-32位字母数字），但没有防止用户抢注 `admin`、`cstu`、`official` 这类敏感词，可能被用来做钓鱼式的分享链接（让人误以为是官方码）。
  3. 清理策略：用户每天最多改3次码，但旧码"永久有效不会失效"，长期下来数据库里会堆积大量废弃但依然可用的历史码，没有清理机制。

### 第 12 类：File upload / SSRF（文件上传/服务端请求伪造）

这一类两项都是 PASS，而且是"结构性安全"——不是靠代码写得好，而是这个功能压根不存在，所以对应的攻击面天然就是零：

- **F1 - 没有文件上传接口**：文件上传功能如果做得不好，容易出现"上传一个伪装成图片的可执行脚本，然后想办法让服务器执行它"这类漏洞。这个项目完全没有文件上传功能，所以没有这个风险。
- **F2 - 没有服务器端去抓取用户提供的URL**：SSRF（Server-Side Request Forgery）是指如果服务器会"帮用户去访问一个用户指定的URL"（比如生成网页预览图、验证链接是否可达），攻击者可以让服务器去访问内网地址（如云服务商的元数据接口 `169.254.169.254`），窃取内网凭证。这个项目里视频链接只是存起来交给用户浏览器自己去打开，服务器从不会主动去请求这个URL，所以没有SSRF风险。

### 第 13 类：Dependencies / supply chain（依赖与供应链安全）

这类关心"你信任的第三方代码包，会不会成为攻击入口"。近几年供应链攻击（比如某个npm包被黑客接管后植入恶意代码，波及所有使用它的项目）越来越常见。

- **Dep1 - 有锁文件（`pnpm-lock.yaml`）**：PASS。锁文件保证"每次安装时，依赖树里每一个包（包括依赖的依赖）版本完全一致"，避免"我本地能跑，生产环境跑不起来"或者"某天依赖悄悄更新到了一个有漏洞的新版本"。
- **Dep2 - `next-auth` 还在beta版本，需要持续关注漏洞通告**：RISK，中危。项目用的是 `next-auth@5.0.0-beta.31`，这是身份认证这个最核心、最敏感的模块，却依赖一个还没正式发布（beta）的库版本——beta版本可能还有未发现的bug，且beta阶段的版本更新可能包含breaking change或者安全修复但不一定有清晰的CVE通告。这不是代码问题,是一个需要长期跟踪的风险项。
- **Dep3 - CI里没有自动化的依赖漏洞扫描**：GAP，中危。目前没看到 `pnpm audit` 或者 Dependabot/Renovate 这类自动检测"你依赖的某个包被曝出已知漏洞"的机制，等于对供应链风险是"睁眼瞎"状态,直到出问题才会发现。 **【2026-07-22 已修复：`.github/workflows/security-audit.yml`（`pnpm audit --prod --audit-level=high`，PR/push/每周）+ `.github/dependabot.yml`（npm + actions 每周）。next-auth beta 仍需人工跟踪。】**

### 专题：Google Cloud / Google OAuth 权限

先澄清一个可能的误解：这个项目本身没有使用任何 Google Cloud 服务（不是 GCS 存储、不是 BigQuery、不是 Cloud SQL）。代码库里唯一和"Google"沾边的东西，是 Google 一键登录（Google SSO / OAuth），用来让用户"用Google账号登录"这个便利功能。所以"Google Cloud访问权限"这件事，实际上分成两层，一层在代码里管得到，一层在代码外（GCP控制台里）管不到：

**1. 代码里能控制、而且已经做对的部分：**

- 在 `lib/auth/config.ts` 里，Google 登录选项是条件性加载的：只有当环境变量 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET` 同时存在时，才会把 Google 登录按钮加入登录页；缺一个都不会显示。
- 目前 `.env.example` 里这两个值都是空字符串占位符，说明默认情况下这个功能是关闭的，只有明确配置了才会启用。
- 代码里没有开启 `allowDangerousEmailAccountLinking` 这个 Auth.js 选项——这个选项如果打开，会导致"用同一个邮箱，先用密码注册，后用Google登录"时，两个账号自动合并。听起来方便，但如果没做邮箱验证（回顾 A5 那个问题），会被人利用来劫持别人账号。这个项目没开启这个危险选项，是件好事。

**2. 代码管不到、必须去 GCP 控制台（Google Cloud Console）手动配置的部分：**

这才是"Google Cloud访问只限开发者"的真正含义——它不是代码安全问题，是GCP项目的IAM权限配置和OAuth应用发布状态问题：

- **OAuth同意屏幕（OAuth consent screen）的发布状态**：Google Cloud项目里配置OAuth登录时，有一个"Testing"（测试）模式和"In production"（已发布）模式的区分。
  - Testing模式：只有你在GCP控制台里手动加进"测试用户名单"的Google账号，才能用这个OAuth走通登录流程，其他人点"用Google登录"会看到"该应用未经过Google验证"或者根本无法授权。
  - 发布（Publish）模式：任何持有Google账号的人都能用这个OAuth登录你的网站。
  
  需要确认：这个OAuth应用目前停留在Testing模式，且"测试用户"名单里只填了开发团队自己的Google账号邮箱，还没到正式对外发布的阶段——这一步完全在GCP控制台的网页界面操作，代码库里看不到、也改不了。

- **GCP项目的IAM（身份与访问管理）权限**：这是"谁能登录GCP控制台去修改这个项目的配置"的问题，跟"谁能用Google账号登录你的网站"是两码事。需要确认：
  - 只有开发团队成员的Google账号被加进了这个GCP项目的IAM角色（比如 Owner/Editor）。
  - 没有意外授予"allUsers"或"allAuthenticatedUsers"这种公开权限给任何GCP资源。
  - OAuth客户端的secret（也就是`AUTH_GOOGLE_SECRET`）只保存在`.env`文件或者部署平台的密钥管理界面里，绝不要粘贴到聊天记录、共享文档、GitHub issue里。

- **授权重定向URI白名单**：GCP的OAuth客户端配置里，会有一个"Authorized redirect URIs"列表，规定这个OAuth凭证只能被用在哪些域名上回调。等以后要正式对外开放时，记得把这个列表收紧到只有生产域名，不要留着localhost或者测试域名的条目，否则等于给攻击者留了一个"用你的OAuth凭证在别的域名上钓鱼"的可能性。

**结论**：代码层面这部分是干净的（功能默认关闭、没开危险选项）；"确保只限开发者访问"这件事，需要去 console.cloud.google.com 手动检查 OAuth 同意屏幕状态和 IAM 成员列表，这一步是代码审计工具没法直接验证的，只能提醒开发团队去核实。

---

以上是全部 13 大类、约 50 个检查项。整体来看，这个项目的架构底子是不错的（分层授权、密码哈希、Stripe webhook签名验证这些"硬核"的安全基础都做对了），问题主要集中在"权限变更后没有及时生效"（JWT角色过时、可以绕过邮箱验证提权）和"缺少防滥用的节流机制"（登录/注册/点击接口都没限流）这两大类，这也是为什么 [10-followup-todo-2026-07-11.md](./fixes/10-followup-todo-2026-07-11.md) 里把这两类问题排在最优先修复的位置。