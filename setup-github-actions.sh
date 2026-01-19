#!/bin/bash

# GitHub Actions Service Account Setup Script
# This script creates and configures a service account for GitHub Actions

set -e

echo "========================================="
echo "GitHub Actions Service Account Setup"
echo "========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)

echo "Current project: $CURRENT_PROJECT"
echo ""
echo "Enter your Google Cloud Project ID (or press Enter to use current: $CURRENT_PROJECT):"
read PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$CURRENT_PROJECT
fi

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No project ID specified"
    exit 1
fi

echo ""
echo "Using Project ID: $PROJECT_ID"
echo ""

# Set project
echo "Setting project..."
gcloud config set project $PROJECT_ID

# Verify project exists
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo "Error: Project $PROJECT_ID not found or you don't have access to it"
    echo ""
    echo "Available projects:"
    gcloud projects list
    exit 1
fi

echo "✓ Project verified"
echo ""

# Service account details
SA_NAME="github-actions"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Service Account Email: $SA_EMAIL"
echo ""

# Check if service account already exists
echo "Checking if service account exists..."
if gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    echo "⚠️  Service account already exists"
    echo ""
    read -p "Do you want to use the existing service account? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please use a different service account name or delete the existing one:"
        echo "  gcloud iam service-accounts delete $SA_EMAIL"
        exit 1
    fi
else
    echo "Creating service account..."
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Actions CI/CD" \
        --description="Service account for GitHub Actions deployments" \
        --project=$PROJECT_ID

    echo "✓ Service account created"
fi

echo ""
echo "Granting IAM roles..."

# Required roles for GitHub Actions
ROLES=(
    "roles/run.admin"
    "roles/storage.admin"
    "roles/cloudsql.client"
    "roles/iam.serviceAccountUser"
)

for ROLE in "${ROLES[@]}"; do
    echo "  Granting $ROLE..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$ROLE" \
        --condition=None \
        --quiet >/dev/null 2>&1 || echo "    (already granted or failed)"
done

echo "✓ IAM roles granted"
echo ""

# Create service account key
KEY_FILE="github-actions-key.json"

echo "Creating service account key..."
if [ -f "$KEY_FILE" ]; then
    echo "⚠️  Key file already exists: $KEY_FILE"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key file"
    else
        rm "$KEY_FILE"
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account=$SA_EMAIL
        echo "✓ New key created"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
    echo "✓ Key created"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Go to your GitHub repository:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Add these secrets:"
echo ""
echo "   Secret Name: GCP_PROJECT_ID"
echo "   Value: $PROJECT_ID"
echo ""
echo "   Secret Name: GCP_SA_KEY"
echo "   Value: (contents of $KEY_FILE)"
echo ""
echo "To copy the key contents:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   cat $KEY_FILE | pbcopy"
    echo "   (Key copied to clipboard!)"
    cat $KEY_FILE | pbcopy 2>/dev/null || cat $KEY_FILE
else
    echo "   cat $KEY_FILE"
fi
echo ""
echo "3. If you don't have Cloud SQL yet, create it:"
echo "   ./deploy-gcp.sh"
echo ""
echo "4. After Cloud SQL is created, add this secret:"
echo "   Secret Name: DATABASE_URL"
echo "   Format: postgresql+asyncpg://postgres:PASSWORD@/familytree?host=/cloudsql/CONNECTION_NAME"
echo ""
echo "   To get your CONNECTION_NAME:"
echo "   gcloud sql instances describe familytree-db --format='value(connectionName)'"
echo ""
echo "========================================="
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   - Keep $KEY_FILE secure and delete it after adding to GitHub"
echo "   - Never commit this file to git"
echo "   - The key grants access to your GCP resources"
echo ""
echo "To delete the key file after setup:"
echo "   rm $KEY_FILE"
echo ""
