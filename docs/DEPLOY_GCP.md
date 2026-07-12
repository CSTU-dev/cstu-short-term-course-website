# Deploying to GCP (Cloud Run + Cloud Build)

This app deploys as a container to **Cloud Run**, built and shipped by **Cloud
Build** on every push to your deploy branch. Migrations run automatically as part
of the pipeline.

- **Compute:** Cloud Run (serverless container)
- **Build/CD:** Cloud Build (`cloudbuild.yaml`)
- **Registry:** Artifact Registry
- **Secrets:** Secret Manager
- **Database:** your existing Postgres (Cloud SQL assumed — see the note at the
  end if it's an external/managed Postgres)

Files in the repo that make this work:
| File | Purpose |
|------|---------|
| [Dockerfile](../Dockerfile) | Multi-stage build → lean standalone runtime image |
| [.dockerignore](../.dockerignore) | Keeps build context small |
| [next.config.ts](../next.config.ts) | `output: "standalone"` for containerization |
| [cloudbuild.yaml](../cloudbuild.yaml) | build → push → migrate → deploy |

---

## One-time setup

Set your shell variables first (adjust to taste):

```bash
export PROJECT_ID=your-gcp-project
export REGION=us-central1
export REPO=cstu
export SERVICE=cstu-web
export CLOUDSQL_INSTANCE=$PROJECT_ID:$REGION:your-instance   # <project>:<region>:<instance>
gcloud config set project $PROJECT_ID
```

### 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com
```

### 2. Create the Artifact Registry repository

```bash
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="CSTU container images"
```

### 3. Create secrets

Two DB URLs are needed because Cloud Run reaches Cloud SQL over a **unix socket**,
while the migration step reaches it over **TCP via the Cloud SQL Auth Proxy**.

```bash
# Runtime URL (Cloud Run, unix socket). Note the empty host and the ?host=... suffix:
printf 'postgresql://DBUSER:DBPASS@/DBNAME?host=/cloudsql/%s' "$CLOUDSQL_INSTANCE" \
  | gcloud secrets create DATABASE_URL --data-file=-

# Migration URL (Cloud Build, via proxy on 127.0.0.1):
printf 'postgresql://DBUSER:DBPASS@127.0.0.1:5432/DBNAME' \
  | gcloud secrets create MIGRATE_DATABASE_URL --data-file=-

# App secrets:
printf '%s' "$(openssl rand -base64 33)" | gcloud secrets create AUTH_SECRET --data-file=-
printf 'sk_live_xxx'   | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
printf 'whsec_xxx'     | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

Optional secrets (add matching `--set-secrets` entries in `cloudbuild.yaml` if you
use them): `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `SMTP_URL`, `EMAIL_FROM`.

> To update a secret later: `printf 'newvalue' | gcloud secrets versions add NAME --data-file=-`

### 4. Grant IAM

**Cloud Build's service account** (runs the pipeline):

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CB_SA=$PROJECT_NUMBER@cloudbuild.gserviceaccount.com

for ROLE in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor \
  roles/iam.serviceAccountUser ; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CB_SA" --role="$ROLE"
done
```

**Cloud Run's runtime service account** (serves traffic — default compute SA
unless you set a dedicated one) needs to read secrets and reach Cloud SQL:

```bash
RUN_SA=$PROJECT_NUMBER-compute@developer.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$RUN_SA" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$RUN_SA" --role="roles/cloudsql.client"
```

### 5. Create the Cloud Build trigger

Point it at your deploy branch and pass the substitutions. Replace the repo
owner/name and branch:

```bash
gcloud builds triggers create github \
  --name=cstu-deploy \
  --repo-owner=YOUR_GH_ORG --repo-name=YOUR_GH_REPO \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=$REGION,_REPO=$REPO,_SERVICE=$SERVICE,_CLOUDSQL_INSTANCE=$CLOUDSQL_INSTANCE,_NEXT_PUBLIC_BASE_URL=https://your-domain,_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

(First connect the GitHub repo to Cloud Build once via the console:
Cloud Build → Triggers → Connect Repository.)

---

## Deploy

Push to the deploy branch — the trigger runs `cloudbuild.yaml` end to end.

To run it manually without pushing:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=$REGION,_REPO=$REPO,_SERVICE=$SERVICE,_CLOUDSQL_INSTANCE=$CLOUDSQL_INSTANCE,_NEXT_PUBLIC_BASE_URL=https://your-domain,_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Get the service URL:

```bash
gcloud run services describe $SERVICE --region=$REGION --format='value(status.url)'
```

---

## After the first deploy

1. **Base URL / callbacks.** `NEXT_PUBLIC_BASE_URL` is baked into the client
   bundle at build time, and `AUTH_URL` is set from the same value. Use your
   final domain from the start. If you must use the generated
   `*.run.app` URL, deploy once to learn it, then set `_NEXT_PUBLIC_BASE_URL`
   to it and redeploy so the client bundle matches.
2. **Custom domain.** Map it with
   `gcloud run domain-mappings create --service=$SERVICE --domain=your-domain --region=$REGION`,
   then update DNS.
3. **Stripe webhook.** In the Stripe Dashboard add an endpoint at
   `https://your-domain/webhook/stripe`, copy its signing secret, and update the
   `STRIPE_WEBHOOK_SECRET` secret (add a new version), then redeploy.
4. **Google SSO** (if used). Authorized redirect URI:
   `https://your-domain/api/auth/callback/google`.
5. **Seed the superadmin** (only if the DB is empty). Run `prisma db seed`
   against the DB once via the proxy — see below.

### Running one-off DB commands (seed, psql) via the proxy

```bash
cloud-sql-proxy --port 5432 "$CLOUDSQL_INSTANCE" &
DATABASE_URL='postgresql://DBUSER:DBPASS@127.0.0.1:5432/DBNAME' \
  SUPERADMIN_EMAIL=you@example.com SUPERADMIN_PASSWORD='...' \
  pnpm prisma db seed
```

---

## If your database is NOT Cloud SQL (Neon, Supabase, self-hosted…)

Then it's reachable over plain TCP and the proxy/socket wiring is unnecessary:

- **Secrets:** use one plain `DATABASE_URL` (`postgresql://user:pass@host:5432/db?sslmode=require`).
  You don't need a separate `MIGRATE_DATABASE_URL` — point both at it.
- **`cloudbuild.yaml`:** in the `migrate` step, drop the `cloud-sql-proxy`
  download/start lines and set `DATABASE_URL="$$DATABASE_URL"` (map `DATABASE_URL`
  in `availableSecrets`). In the `deploy` step, remove
  `--add-cloudsql-instances=...`.
- **IAM:** the `roles/cloudsql.client` grants are not needed.

---

## Notes / gotchas

- **Migrations run once per deploy** in the `migrate` step (decoupled from
  container startup), so autoscaling never double-runs them.
- The `migrate` step runs `pnpm install --frozen-lockfile` to get the Prisma CLI;
  it's the slowest step. Fine for occasional deploys; can be optimized later with
  a cached/prebuilt migration image.
- **`--allow-unauthenticated`** makes the service public (correct for a website).
  Remove it if you want it private.
- Cloud Run injects `PORT` (8080); the Dockerfile's standalone server honors it.
- To scale to zero cost when idle, Cloud Run's default `min-instances=0` is fine;
  set `--min-instances=1` on the deploy step if cold starts bother you.
