# Google Cloud Run Deployment

Bazodiac is a Same-Origin BFF: one container serves the built SPA **and** `/api/*`.
The server reads `process.env.PORT` (Cloud Run injects it, default 8080) and binds
`0.0.0.0`, so it runs on Cloud Run with no code changes.

Container: see `Dockerfile` (multi-stage — build with full deps, run with `--omit=dev`
+ `dist/`). Entrypoint: `node dist/server.cjs`.

## Secrets (Secret Manager — never in env vars, never in the image)

```bash
PROJECT_ID=your-project
for s in FUFIRE_API_KEY GOOGLE_MAPS_API_KEY GEMINI_API_KEY; do
  gcloud secrets create "$s" --project="$PROJECT_ID" --replication-policy=automatic 2>/dev/null || true
done
# Add values (repeat per secret):
printf '%s' 'REAL_FUFIRE_KEY'  | gcloud secrets versions add FUFIRE_API_KEY      --project="$PROJECT_ID" --data-file=-
printf '%s' 'REAL_GMAPS_KEY'   | gcloud secrets versions add GOOGLE_MAPS_API_KEY --project="$PROJECT_ID" --data-file=-
printf '%s' 'REAL_GEMINI_KEY'  | gcloud secrets versions add GEMINI_API_KEY      --project="$PROJECT_ID" --data-file=-
```

Grant the Cloud Run runtime service account access:

```bash
RUNTIME_SA="$(gcloud iam service-accounts list --project="$PROJECT_ID" \
  --filter='displayName:Compute Engine default service account' --format='value(email)')"
for s in FUFIRE_API_KEY GOOGLE_MAPS_API_KEY GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding "$s" --project="$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
done
```

## Manual deploy (from the repo, builds the Dockerfile via Cloud Build)

```bash
PROJECT_ID=your-project
REGION=europe-west1
SERVICE=bazodiac

gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" --region="$REGION" \
  --source=. \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="NODE_ENV=production,APP_URL=https://<your-cloud-run-url>,FUFIRE_API_URL=https://<fufire-host>,FUFIRE_API_PATH_PREFIX=v1,FUFIRE_API_VERSION=,REQUEST_TIMEOUT_MS=12000,ENABLE_LOCAL_ASTROLOGY_FALLBACK=false,ENABLE_DEMO_PROFILES=false" \
  --set-secrets="FUFIRE_API_KEY=FUFIRE_API_KEY:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

`--source=.` makes Cloud Build use the repo `Dockerfile`. After the first deploy, set
`APP_URL` to the printed service URL and redeploy (or set it once you reserve a domain).

## Automated deploy on push (GitHub Actions)

`.github/workflows/deploy-cloudrun.yml` deploys on push to `master`/`main`. It uses
**Workload Identity Federation** (no long-lived SA key in GitHub).

One-time GCP setup:

```bash
PROJECT_ID=your-project
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
REPO=DYAI2025/New_Bazi

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com iam.googleapis.com --project="$PROJECT_ID"

# Deployer service account
gcloud iam service-accounts create gh-deployer --project="$PROJECT_ID" --display-name="GitHub Cloud Run deployer"
DEPLOYER="gh-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
for role in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.admin roles/iam.serviceAccountUser roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${DEPLOYER}" --role="$role"
done

# Workload Identity pool + provider bound to this GitHub repo
gcloud iam workload-identity-pools create github --project="$PROJECT_ID" --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github \
  --project="$PROJECT_ID" --location=global --workload-identity-pool=github \
  --display-name="GitHub OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='${REPO}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --project="$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${REPO}"

echo "WIF provider = projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/providers/github"
```

GitHub repo **Variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Example |
| --- | --- |
| `GCP_PROJECT_ID` | `your-project` |
| `GCP_REGION` | `europe-west1` |
| `GCP_SERVICE` | `bazodiac` |
| `GCP_WIF_PROVIDER` | `projects/<num>/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_SERVICE_ACCOUNT` | `gh-deployer@your-project.iam.gserviceaccount.com` |
| `APP_URL` | `https://bazodiac-xxxx.run.app` |
| `FUFIRE_API_URL` | `https://<fufire-host>` |
| `FUFIRE_API_PATH_PREFIX` | `v1` |
| `FUFIRE_API_VERSION` | optional release label only (leave empty unless needed for display) |

The FuFirE/Google/Gemini **keys live in Secret Manager only** (above) and are mapped
via `--set-secrets`. No secret is stored in GitHub or baked into the image.

## Notes

- Default branch here is `master`; the workflow triggers on both `master` and `main`.
- `/api/health` returns app + FuFirE health — useful as a Cloud Run startup/liveness signal.
- The container does not load `vite` at runtime (it is dynamically imported only in dev),
  keeping cold starts lean.
