# Google Cloud Platform Deployment Guide

This guide provides step-by-step instructions for deploying the Family Tree application to Google Cloud Platform.

## Quick Start

The fastest way to deploy:

```bash
./deploy-gcp.sh
```

## Prerequisites

1. **Google Cloud Account**
   - Sign up at [cloud.google.com](https://cloud.google.com)
   - Enable billing for your account

2. **Install Google Cloud CLI**
   ```bash
   # macOS
   brew install --cask google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

3. **Authenticate**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

4. **Create a Project**
   ```bash
   # Via CLI
   gcloud projects create YOUR-PROJECT-ID --name="Family Tree App"

   # Or via Console: https://console.cloud.google.com/projectcreate
   ```

## Architecture

The deployment uses:
- **Cloud Run**: Serverless container platform for the web app
- **Cloud SQL**: Managed PostgreSQL database
- **Container Registry**: Docker image storage
- **Cloud Build**: CI/CD pipeline

## Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

When prompted:
1. Enter your Google Cloud Project ID
2. Enter a secure database password (or press Enter to generate one)
3. Wait for deployment (typically 5-10 minutes)

### Option 2: Manual Deployment

#### Step 1: Set Up Project

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
```

#### Step 2: Enable APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 3: Create Cloud SQL Instance

```bash
# Create instance (takes ~5 minutes)
gcloud sql instances create familytree-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=$REGION \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create familytree \
  --instance=familytree-db

# Set password
gcloud sql users set-password postgres \
  --instance=familytree-db \
  --password="YOUR_SECURE_PASSWORD"
```

#### Step 4: Build Container Image

```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/familytree-app
```

#### Step 5: Deploy to Cloud Run

```bash
# Get Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe familytree-db \
  --format="value(connectionName)")

# Build database URL
DATABASE_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@/familytree?host=/cloudsql/$CONNECTION_NAME"

# Deploy
gcloud run deploy familytree-app \
  --image gcr.io/$PROJECT_ID/familytree-app \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $CONNECTION_NAME \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

#### Step 6: Get Service URL

```bash
gcloud run services describe familytree-app \
  --platform managed \
  --region $REGION \
  --format="value(status.url)"
```

## Configuration

### Environment Variables

Set via Cloud Run:

```bash
gcloud run services update familytree-app \
  --region $REGION \
  --set-env-vars "DATABASE_URL=your-database-url"
```

### Resource Limits

Adjust memory and CPU:

```bash
gcloud run services update familytree-app \
  --region $REGION \
  --memory 1Gi \
  --cpu 2
```

### Scaling

Configure autoscaling:

```bash
gcloud run services update familytree-app \
  --region $REGION \
  --min-instances 1 \
  --max-instances 20
```

## Monitoring & Logs

### View Logs

```bash
# Application logs
gcloud run services logs read familytree-app --region $REGION --limit 50

# Follow logs in real-time
gcloud run services logs tail familytree-app --region $REGION

# Database logs
gcloud sql operations list --instance=familytree-db
```

### Metrics Dashboard

Access via Cloud Console:
- Cloud Run: https://console.cloud.google.com/run
- Cloud SQL: https://console.cloud.google.com/sql

## Database Management

### Connect to Database

```bash
# Via Cloud SQL Proxy
gcloud sql connect familytree-db --user=postgres

# Or install Cloud SQL Proxy
cloud_sql_proxy -instances=CONNECTION_NAME=tcp:5432
psql -h localhost -U postgres -d familytree
```

### Backup and Restore

```bash
# Create on-demand backup
gcloud sql backups create --instance=familytree-db

# List backups
gcloud sql backups list --instance=familytree-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=familytree-db --backup-instance=familytree-db
```

## CI/CD with Cloud Build

### Automatic Deployment on Git Push

1. Connect your GitHub repository in Cloud Console
2. Create a trigger:

```bash
gcloud builds triggers create github \
  --repo-name=YOUR_REPO \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

Now every push to `main` will automatically deploy!

## Cost Optimization

### Development Environment

For development, use minimal resources:

```bash
# Smaller database tier
gcloud sql instances patch familytree-db \
  --tier=db-f1-micro

# Reduce Cloud Run instances
gcloud run services update familytree-app \
  --region $REGION \
  --min-instances 0 \
  --max-instances 3
```

### Production Environment

For production, increase resources:

```bash
# Larger database tier
gcloud sql instances patch familytree-db \
  --tier=db-n1-standard-1

# More Cloud Run instances
gcloud run services update familytree-app \
  --region $REGION \
  --min-instances 2 \
  --max-instances 100
```

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log BUILD_ID
```

### Database Connection Issues

```bash
# Verify Cloud SQL instance is running
gcloud sql instances describe familytree-db

# Test connection
gcloud sql connect familytree-db --user=postgres
```

### Application Not Responding

```bash
# Check service status
gcloud run services describe familytree-app --region $REGION

# View recent logs
gcloud run services logs read familytree-app --region $REGION --limit 100
```

### Out of Memory Errors

```bash
# Increase memory allocation
gcloud run services update familytree-app \
  --region $REGION \
  --memory 1Gi
```

## Cleanup

To delete all resources and stop billing:

```bash
# Delete Cloud Run service
gcloud run services delete familytree-app --region $REGION

# Delete Cloud SQL instance
gcloud sql instances delete familytree-db

# Delete container images
gcloud container images delete gcr.io/$PROJECT_ID/familytree-app
```

## Security Best Practices

1. **Use Secret Manager** for sensitive data:
   ```bash
   echo -n "your-secret" | gcloud secrets create db-password --data-file=-
   ```

2. **Enable VPC Connector** for private database access

3. **Set up IAM roles** properly:
   ```bash
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:SERVICE_ACCOUNT" \
     --role="roles/cloudsql.client"
   ```

4. **Enable Cloud Armor** for DDoS protection

5. **Use Cloud CDN** for static assets

## Support

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Google Cloud Support](https://cloud.google.com/support)

## Cost Estimate

For a small to medium application:

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| Cloud Run | 512Mi RAM, minimal traffic | $0-5 |
| Cloud SQL | db-f1-micro, 10GB storage | $7-10 |
| Container Registry | < 1GB | Free |
| Cloud Build | < 120 build-minutes/day | Free |
| **Total** | | **$7-15/month** |

Actual costs may vary based on usage. Use [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator) for accurate estimates.
