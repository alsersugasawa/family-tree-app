#!/bin/bash

# Family Tree App - Google Cloud Deployment Script
# This script deploys the application to Google Cloud Run with Cloud SQL

set -e

echo "========================================="
echo "Family Tree App - Google Cloud Deployment"
echo "========================================="
echo ""

# Configuration
PROJECT_ID=""
REGION="us-central1"
APP_NAME="familytree-app"
DB_INSTANCE_NAME="familytree-db"
DB_NAME="familytree"
DB_USER="postgres"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get or prompt for project ID
if [ -z "$PROJECT_ID" ]; then
    echo "Enter your Google Cloud Project ID:"
    read PROJECT_ID
fi

echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "App Name: $APP_NAME"
echo ""

# Set project
echo "Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo ""
echo "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create Cloud SQL instance (if not exists)
echo ""
echo "Checking Cloud SQL instance..."
if gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID 2>/dev/null; then
    echo "Cloud SQL instance already exists."
else
    echo "Creating Cloud SQL PostgreSQL instance... (this may take several minutes)"
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_14 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$(openssl rand -base64 32)

    echo "Cloud SQL instance created successfully."
fi

# Create database
echo ""
echo "Creating database..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME 2>/dev/null || echo "Database already exists."

# Get Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo "Cloud SQL Connection Name: $CONNECTION_NAME"

# Prompt for database password
echo ""
echo "Enter a password for the database user '$DB_USER' (or press Enter to generate one):"
read -s DB_PASSWORD
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 16)
    echo "Generated password: $DB_PASSWORD"
    echo "IMPORTANT: Save this password securely!"
fi

# Set database user password
echo ""
echo "Setting database user password..."
gcloud sql users set-password $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD

# Build DATABASE_URL
DATABASE_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

# Build and deploy using Cloud Build
echo ""
echo "Building and deploying application..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$APP_NAME

# Deploy to Cloud Run
echo ""
echo "Deploying to Cloud Run..."
gcloud run deploy $APP_NAME \
    --image gcr.io/$PROJECT_ID/$APP_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars DATABASE_URL="$DATABASE_URL" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10

# Get service URL
SERVICE_URL=$(gcloud run services describe $APP_NAME --platform managed --region $REGION --format="value(status.url)")

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Your application is now live at:"
echo "$SERVICE_URL"
echo ""
echo "Access the app:"
echo "  - Web App: $SERVICE_URL/static/index.html"
echo "  - API Docs: $SERVICE_URL/docs"
echo ""
echo "Database Details:"
echo "  - Instance: $DB_INSTANCE_NAME"
echo "  - Connection: $CONNECTION_NAME"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo ""
echo "IMPORTANT: Store these credentials securely:"
echo "  - Database Password: $DB_PASSWORD"
echo ""
echo "To view logs:"
echo "  gcloud run services logs read $APP_NAME --region $REGION"
echo ""
echo "To update the app:"
echo "  gcloud builds submit --tag gcr.io/$PROJECT_ID/$APP_NAME"
echo "  gcloud run deploy $APP_NAME --image gcr.io/$PROJECT_ID/$APP_NAME --region $REGION"
echo ""
