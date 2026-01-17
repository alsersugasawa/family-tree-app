# GitHub Actions CI/CD Setup Guide

This guide explains how to set up automated CI/CD pipelines for the Family Tree application using GitHub Actions.

## Overview

The project includes two GitHub Actions workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`) - Runs on every push and pull request
2. **GCP Deployment** (`.github/workflows/deploy-gcp.yml`) - Deploys to Google Cloud on main branch

## Workflows

### 1. CI Pipeline - Build and Test

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- **Test**: Runs tests with PostgreSQL database
- **Build**: Builds and tests Docker image
- **Security Scan**: Scans for vulnerabilities using Trivy

**What it does:**
- Sets up Python 3.11
- Installs dependencies
- Runs linting (optional)
- Builds Docker image
- Runs security scans

### 2. GCP Deployment Pipeline

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**What it does:**
- Authenticates with Google Cloud
- Builds Docker image
- Pushes to Google Container Registry
- Deploys to Cloud Run
- Runs health check
- Reports deployment URL

## Setup Instructions

### Prerequisites

1. **Google Cloud Project**
   - Active GCP project with billing enabled
   - Cloud Run API enabled
   - Cloud SQL API enabled
   - Container Registry API enabled

2. **Service Account**
   - Create a service account for GitHub Actions
   - Grant necessary permissions

### Step 1: Create Google Cloud Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=$PROJECT_ID

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Display the key (you'll copy this to GitHub)
cat key.json
```

### Step 2: Set Up GitHub Secrets

Go to your GitHub repository settings:

**Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

1. **GCP_PROJECT_ID**
   - Your Google Cloud Project ID
   - Example: `my-project-12345`

2. **GCP_SA_KEY**
   - The entire contents of `key.json` file
   - Copy and paste the complete JSON

3. **DATABASE_URL**
   - Your Cloud SQL connection string
   - Format: `postgresql+asyncpg://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME`
   - Example: `postgresql+asyncpg://postgres:mypassword@/familytree?host=/cloudsql/my-project:us-central1:familytree-db`

### Step 3: Deploy Initial Infrastructure

Before GitHub Actions can deploy, you need to create the Cloud SQL instance:

```bash
# Run the deployment script once manually
./deploy-gcp.sh

# Or create Cloud SQL manually
gcloud sql instances create familytree-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create familytree \
  --instance=familytree-db

gcloud sql users set-password postgres \
  --instance=familytree-db \
  --password=YOUR_SECURE_PASSWORD
```

### Step 4: Test the Workflow

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Add GitHub Actions"
   git push origin main
   ```

2. **Watch the workflow:**
   - Go to your GitHub repository
   - Click on "Actions" tab
   - Watch the deployment progress

3. **Manual trigger:**
   - Go to "Actions" tab
   - Select "Deploy to Google Cloud Platform"
   - Click "Run workflow"

## Workflow Configuration

### Customizing CI Pipeline

Edit `.github/workflows/ci.yml`:

```yaml
# Change Python version
- name: Set up Python
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'  # Change this

# Add more tests
- name: Run tests
  run: |
    pytest tests/
```

### Customizing Deployment

Edit `.github/workflows/deploy-gcp.yml`:

```yaml
# Change region
env:
  REGION: europe-west1  # Change this

# Adjust resources
gcloud run deploy $SERVICE_NAME \
  --memory 1Gi \      # Increase memory
  --cpu 2 \           # More CPU
  --min-instances 1   # Keep warm instance
```

## Monitoring Deployments

### View Workflow Runs

1. Go to GitHub repository → Actions
2. Click on a workflow run to see details
3. View logs for each step

### Deployment Summary

Each successful deployment creates a summary with:
- Service URL
- Web App URL
- API Docs URL
- Deployment time
- Docker image tag

### Failed Deployments

If deployment fails:

1. **Check workflow logs** in GitHub Actions
2. **Common issues:**
   - Invalid GCP credentials
   - Missing secrets
   - Cloud SQL instance not created
   - Insufficient permissions

3. **Debug:**
   ```bash
   # Test locally
   docker build -t test .
   docker run -e DATABASE_URL="your-url" test

   # Check GCP permissions
   gcloud auth list
   gcloud projects get-iam-policy $PROJECT_ID
   ```

## Environment-Specific Deployments

### Staging Environment

Create a staging workflow:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: familytree-app-staging
  # ... rest of config
```

Add staging secrets:
- `DATABASE_URL_STAGING`
- Use same `GCP_SA_KEY` and `GCP_PROJECT_ID`

### Production Environment

Add protection to main branch:

1. **Settings → Branches → Add rule**
2. **Branch name pattern:** `main`
3. **Enable:**
   - Require pull request reviews
   - Require status checks to pass
   - Include CI workflow

## Advanced Features

### Deploy on Tag

Deploy when creating a release:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Rollback

Rollback to previous version:

```bash
# List recent deployments
gcloud run revisions list --service=familytree-app --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic familytree-app \
  --region=us-central1 \
  --to-revisions=familytree-app-00002-abc=100
```

### Canary Deployments

Split traffic between versions:

```yaml
- name: Canary Deployment
  run: |
    gcloud run services update-traffic $SERVICE_NAME \
      --region $REGION \
      --to-revisions=LATEST=20,$PREVIOUS=80
```

## Security Best Practices

1. **Rotate Service Account Keys**
   ```bash
   # Create new key
   gcloud iam service-accounts keys create new-key.json \
     --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

   # Update GitHub secret
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Use Workload Identity Federation** (more secure than service account keys)
   - Follow [GitHub's guide](https://github.com/google-github-actions/auth#setup)

3. **Limit Permissions**
   - Use least privilege principle
   - Only grant necessary roles

4. **Enable Branch Protection**
   - Require reviews before merging
   - Require status checks to pass

## Cost Management

### Optimize Workflow Runs

```yaml
# Skip CI on documentation changes
on:
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Cache Dependencies

```yaml
- name: Cache pip packages
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
```

## Troubleshooting

### Authentication Failures

```bash
# Verify service account
gcloud iam service-accounts list

# Check permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:github-actions@*"
```

### Deployment Timeouts

```yaml
# Increase timeout
--timeout 600  # 10 minutes
```

### Database Connection Issues

```bash
# Verify Cloud SQL instance
gcloud sql instances describe familytree-db

# Test connection
gcloud sql connect familytree-db --user=postgres
```

## Notifications

### Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

GitHub automatically sends emails for:
- Failed workflows
- Successful deployments (if configured)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud GitHub Actions](https://github.com/google-github-actions)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)

## Quick Reference

### Essential Commands

```bash
# View workflow runs
gh run list

# Watch workflow
gh run watch

# View logs
gh run view --log

# Trigger workflow manually
gh workflow run deploy-gcp.yml

# List secrets
gh secret list

# Set secret
gh secret set GCP_PROJECT_ID
```

### Workflow Status Badge

Add to README.md:

```markdown
![Deploy](https://github.com/USERNAME/REPO/workflows/Deploy%20to%20Google%20Cloud%20Platform/badge.svg)
```
