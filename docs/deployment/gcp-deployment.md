# GCP Cloud Run Deployment Guide

This guide covers deploying Study Buddy to Google Cloud Platform using Cloud Run.

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally
- GCP project created

## Initial Setup

### 1. Configure GCP Project

```bash
# Set your project ID
export PROJECT_ID=your-project-id
export REGION=us-central1

# Set default project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Create Artifact Registry

```bash
# Create Docker repository
gcloud artifacts repositories create study-buddy \
  --repository-format=docker \
  --location=$REGION \
  --description="Study Buddy container images"

# Configure Docker to use Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

### 3. Configure Secrets

```bash
# Create secrets for sensitive values
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "your-anthropic-key" | \
  gcloud secrets create anthropic-api-key --data-file=-

echo -n "your-gemini-key" | \
  gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${PROJECT_ID}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_ID}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_ID}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Deploy Backend

### 1. Build and Push Image

```bash
# Build backend image
docker build \
  -f docker/backend/Dockerfile \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/backend:latest \
  .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/backend:latest
```

### 2. Deploy to Cloud Run

```bash
# Get frontend URL (if already deployed) or use placeholder
FRONTEND_URL="https://frontend-xxxxx-uc.a.run.app"

gcloud run deploy study-buddy-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="DEBUG=false,STORAGE_BACKEND=sqlite,STORAGE_PATH=/app/data/study-buddy.db" \
  --set-env-vars="CORS_ORIGINS=${FRONTEND_URL}" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"
```

### 3. Get Backend URL

```bash
BACKEND_URL=$(gcloud run services describe study-buddy-backend \
  --region=$REGION \
  --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

## Deploy Frontend

### 1. Build and Push Image

```bash
# Build frontend with backend URL
docker build \
  -f docker/frontend/Dockerfile \
  --build-arg VITE_API_URL=${BACKEND_URL}/api/v1 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest \
  .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy study-buddy-frontend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=128Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --port=8080
```

### 3. Update Backend CORS

```bash
FRONTEND_URL=$(gcloud run services describe study-buddy-frontend \
  --region=$REGION \
  --format='value(status.url)')

# Update backend with correct frontend URL
gcloud run services update study-buddy-backend \
  --region=$REGION \
  --set-env-vars="CORS_ORIGINS=${FRONTEND_URL}"
```

## Custom Domain Setup

### 1. Map Custom Domain

```bash
# For frontend
gcloud run domain-mappings create \
  --service=study-buddy-frontend \
  --domain=app.yourdomain.com \
  --region=$REGION

# For backend (optional)
gcloud run domain-mappings create \
  --service=study-buddy-backend \
  --domain=api.yourdomain.com \
  --region=$REGION
```

### 2. Configure DNS

Add the DNS records shown by the domain mapping command to your DNS provider.

### 3. Rebuild Frontend with Production URL

```bash
# Rebuild with production API URL
docker build \
  -f docker/frontend/Dockerfile \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api/v1 \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest \
  .

# Push and deploy
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest
gcloud run deploy study-buddy-frontend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend:latest \
  --region=$REGION
```

## CI/CD with Cloud Build

### 1. Create Cloud Build Configuration

Create `cloudbuild.yaml` in project root:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'docker/backend/Dockerfile'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/backend:$COMMIT_SHA'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/backend:latest'
      - '.'

  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'docker/frontend/Dockerfile'
      - '--build-arg'
      - 'VITE_API_URL=${_BACKEND_URL}/api/v1'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/frontend:$COMMIT_SHA'
      - '-t'
      - '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/frontend:latest'
      - '.'

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/backend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '--all-tags', '${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/frontend']

  # Deploy backend
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'study-buddy-backend'
      - '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/backend:$COMMIT_SHA'
      - '--region=${_REGION}'

  # Deploy frontend
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'study-buddy-frontend'
      - '--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/study-buddy/frontend:$COMMIT_SHA'
      - '--region=${_REGION}'

substitutions:
  _REGION: us-central1
  _BACKEND_URL: https://study-buddy-backend-xxxxx-uc.a.run.app

options:
  logging: CLOUD_LOGGING_ONLY
```

### 2. Create Build Trigger

```bash
gcloud builds triggers create github \
  --repo-name=my-ai-study-buddy \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Monitoring

### View Logs

```bash
# Backend logs
gcloud run services logs read study-buddy-backend --region=$REGION

# Frontend logs
gcloud run services logs read study-buddy-frontend --region=$REGION

# Stream logs
gcloud run services logs tail study-buddy-backend --region=$REGION
```

### Set Up Alerts

```bash
# Create uptime check
gcloud monitoring uptime-check-configs create study-buddy-health \
  --display-name="Study Buddy Health Check" \
  --http-check-path="/health" \
  --http-check-port=443 \
  --monitored-resource-type="uptime_url"
```

## Cost Optimization

### Reduce Costs

1. **Set minimum instances to 0** for development
2. **Use regional deployments** (single region)
3. **Right-size memory/CPU** based on actual usage
4. **Set request timeout** to avoid runaway costs

### Estimated Costs

| Resource | Monthly Cost (Low Traffic) |
|----------|---------------------------|
| Cloud Run (backend) | $5-20 |
| Cloud Run (frontend) | $2-10 |
| Artifact Registry | $1-5 |
| Secret Manager | <$1 |
| **Total** | **$10-35** |

## Cleanup

Remove all resources:

```bash
# Delete Cloud Run services
gcloud run services delete study-buddy-backend --region=$REGION --quiet
gcloud run services delete study-buddy-frontend --region=$REGION --quiet

# Delete secrets
gcloud secrets delete jwt-secret --quiet
gcloud secrets delete anthropic-api-key --quiet
gcloud secrets delete gemini-api-key --quiet

# Delete Artifact Registry images
gcloud artifacts docker images delete \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/backend --quiet
gcloud artifacts docker images delete \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/study-buddy/frontend --quiet
```
