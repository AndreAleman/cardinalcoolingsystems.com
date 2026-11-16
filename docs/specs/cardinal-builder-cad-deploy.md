# Cardinal Builder CAD: deploy runbook

**For:** David. **Plan:** [cardinal-builder-plan.md](cardinal-builder-plan.md) B7 (CAD Review), B8 (CAD scope), B9 (own cad-service).
**Code:** `cad-service/` (Python), `backend/src/lib/cad`, `backend/src/modules/cad-request`, `backend/src/subscribers/cad-request-process.ts`, `backend/src/jobs/process-cad-queue.ts`, the `cad-requests` / `cad-downloads` / `cad-settings` API routes and the admin **CAD Requests** page.

CAD Review is **on** from the first deploy (`cad_setting.require_review` defaults to true): every CAD Package is generated, then waits in Admin → CAD Requests → **Awaiting review** until someone clicks **Approve & send**. Nothing reaches a requester before that.

## 1. Create the cad-service on Railway

In the `cardinal_cooling_systems` project:

1. **New service → GitHub repo** (this repo). Settings:
   - **Root Directory:** `cad-service`
   - **Builder:** Dockerfile (picked up from `cad-service/railway.json`: `dockerfilePath: Dockerfile`, healthcheck `/health` with a 300 s timeout, restart on failure, watch `cad-service/**`).
   - **Service name:** `cad-service`. Renaming a service does **not** change its private hostname. A service created under a random name keeps it; production's is `athletic-embrace.railway.internal`. Always use a Railway reference to it; never type the hostname by hand.
2. **Networking:** do **not** generate a public domain. The backend reaches it over Railway's private network; uvicorn binds `::` on `$PORT` (8080 by default).
3. **Variables** (cad-service):

   | Variable | Value |
   |---|---|
   | `CAD_SERVICE_TOKEN` | a long random secret, e.g. `openssl rand -hex 32`; the same value goes on the backend |
   | `PORT` | `8080` (optional; the Dockerfile defaults to it) |

   Never set `CAD_SERVICE_DEV` on Railway. Without the token, or without libcairo (installed by the Dockerfile), the service refuses to start, so a broken PDF path never goes live.
4. **Deploy and wait for healthy.** The first boot imports CadQuery and builds one warm-up transition (about a minute on a cold container); `/health` answers 503 until then, so Railway won't route to it early. 1 vCPU / 2 GB RAM is plenty (a 48-drop manifold builds in about 2–3 s).

## 2. Backend variables

On the backend service (`cardinal_cooling_systems` backend):

| Variable | Value | Notes |
|---|---|---|
| `CAD_SERVICE_URL` | `http://${{cad-service.RAILWAY_PRIVATE_DOMAIN}}:8080` | Railway reference variable: it follows the service's real private hostname |
| `CAD_SERVICE_TOKEN` | the same secret as the cad-service | without both, `POST /store/cad-requests` answers 503 `cad_unavailable` |
| `CAD_REQUEST_INBOX_EMAIL` | `aleman@cardinalcoolingsystems.com` | staff alerts (review, queued, failed, allowance). Comma-separated list allowed. This is also the default when unset |
| `STOREFRONT_URL` | `https://cardinalcoolingsystems.com` | already set; emailed links are `{STOREFRONT_URL}/us/cad/download/{token}` and `{STOREFRONT_URL}/us/build/...` |
| `BACKEND_PUBLIC_URL` | already set | admin links in staff alerts: `{BACKEND_PUBLIC_URL}/app/cad-requests/{id}` |
| `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | already set | CAD files go to a **private** bucket `cad-packages`, created on first use with no public policy (`medusa-media` is public-read, so CAD files never go there) |
| `CAD_MINIO_BUCKET` | optional | default `cad-packages` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | already set | without them CAD emails are not sent: the backend logs the download link and the alert recipients instead. Buyer emails go from `RESEND_INFO_FROM_EMAIL` (info@), alerts from `RESEND_FROM_EMAIL` |
| `TURNSTILE_SECRET_KEY`, `STOREFRONT_SHARED_SECRET`, `REDIS_URL` | already set | the CAD request route reuses the contact form's bot protection (ADR-0008) |

Without MinIO (local only) files go to `backend/.cad-cache` (git-ignored; `CAD_CACHE_DIR` overrides).

## 3. Order

1. **Run the migrations by hand. Deploys do not run them.**
   - `init-backend` only migrates when it seeds an empty database. On production it logs "Database is already seeded" and skips the migrations.
   - Run `npx medusa db:migrate --skip-links` from `/app/.medusa/server`, inside the backend container, using Railway SSH.
   - Run it after the deploy that ships the migration files; before that deploy, the files aren't in the container.

   The builder release added three migrations, all additive. They were run on production on 2026-10-19:
   - `Migration20261019015851`: build_configuration
   - `Migration20261019015900`: quote line pricing
   - `Migration20261019030000`: cad_request, cad_package, cad_setting
2. **Deploy the cad-service** (step 1) and wait for it to be healthy.
3. **Set the backend variables** (step 2).
4. **Push / merge** the backend (and the storefront, whose CAD panel calls these routes).
5. Both sides must be deployed from the **same commit**: the backend sends its `CPQ_TABLES_HASH` and cad-service answers 409 `tables_mismatch` when its `cpq_shared/` copy differs. After any change to `shared/cpq/dimensions`, redeploy both.

## 4. Health checks

- **cad-service:** Railway healthcheck `/health`. From the backend container, which has no curl, fetch `$CAD_SERVICE_URL/health` with `node -e` →
  `{"ok":true,"generator_version":"1","tables_hash":"9aa195d46dc2","warm":true,"pdf":true,"kinds":{"transition":"step+pdf","row-manifold":"step+pdf","cdu-kit":"pdf","strainer":"pdf","hose":"pdf"}}`
  (the `tables_hash` changes whenever the tables do; it must equal the backend's).
- **Admin:** Medusa Admin → **CAD Requests**. The header badge reads **CAD service: healthy** with the generator version and tables hash; "not configured" means `CAD_SERVICE_URL`/`CAD_SERVICE_TOKEN` are missing on the backend, "unreachable" means the service is down or the URL is wrong.
- **End to end:** request CAD files on a builder page with a work email. In admin it appears under **Awaiting review** with the PDF inline and **Download STEP** (transition and manifold only). **Approve & send** emails the link; it works for 7 days and 20 downloads.

## 5. Day-to-day

- **Require review** switch (admin header): on by default. Turning it off sends links without review (Sanitube Phase 3 behaviour; signed-in customers then download instantly).
- **Daily cap** (default 10 never-generated Part Numbers per day, America/New_York): over the cap a request is **Queued**; the hourly job generates it at 9:00 Eastern on the next business day and it then waits for review. **Generate now** does it immediately.
- **Allowance:** 10 counted requests per work email per 30 days and 5 per buyer IP per 24 h (only the storefront-forwarded IP counts). Signed-in customers are never counted.
- **Reject** / **Mark spam** on a request in review or queued; a spam request keeps counting toward the allowance.
- Files are reference-only; every PDF says "CERTIFIED DRAWING ON QUOTE APPROVAL".

## 6. Rollback

- Turn CAD off without a deploy: remove `CAD_SERVICE_URL` (or the token) on the backend. The route answers 503 `cad_unavailable`; requests already stored stay in admin.
- The migration only adds tables; leave them in place on a code rollback.
