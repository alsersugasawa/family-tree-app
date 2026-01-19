#!/bin/bash

# Google Cloud Project Setup Script
# This script helps you create and configure a GCP project for the Family Tree app

set -e

echo "========================================="
echo "Google Cloud Project Setup"
echo "========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    echo ""
    echo "Please install it:"
    echo "  macOS: brew install --cask google-cloud-sdk"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Login to Google Cloud
echo "Step 1: Authenticate with Google Cloud"
echo "----------------------------------------"
echo ""
read -p "Have you already logged in with 'gcloud auth login'? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Logging in..."
    gcloud auth login
fi

echo ""
echo "Step 2: Choose Project ID"
echo "----------------------------------------"
echo ""
echo "Your project ID must be:"
echo "  - 6-30 characters"
echo "  - Lowercase letters, numbers, hyphens only"
echo "  - Globally unique across all of Google Cloud"
echo ""
echo "Suggestions:"
echo "  - alser-familytree"
echo "  - familytree-$(date +%Y)"
echo "  - your-name-familytree"
echo ""
read -p "Enter your desired Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Project ID cannot be empty"
    exit 1
fi

echo ""
read -p "Project Name (display name, can have spaces) [Family Tree App]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-"Family Tree App"}

echo ""
echo "Creating project..."
echo "  Project ID: $PROJECT_ID"
echo "  Project Name: $PROJECT_NAME"
echo ""

# Create project
if gcloud projects create $PROJECT_ID --name="$PROJECT_NAME" 2>&1; then
    echo "✓ Project created successfully!"
else
    echo ""
    echo "Failed to create project. Common reasons:"
    echo "  1. Project ID already exists (must be globally unique)"
    echo "  2. Invalid project ID format"
    echo "  3. You've reached the project quota"
    echo ""
    read -p "Try a different project ID? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        exec "$0"
    fi
    exit 1
fi

# Set as default project
gcloud config set project $PROJECT_ID
echo "✓ Project set as default"

echo ""
echo "Step 3: Enable Billing"
echo "----------------------------------------"
echo ""
echo "⚠️  IMPORTANT: You must enable billing for this project"
echo ""
echo "Billing is required to use:"
echo "  - Cloud Run (serverless hosting)"
echo "  - Cloud SQL (database)"
echo "  - Container Registry (Docker images)"
echo ""
echo "Google Cloud offers:"
echo "  - $300 free credit for new accounts"
echo "  - Always-free tier for many services"
echo "  - Pay-as-you-go pricing"
echo ""
echo "Estimated monthly cost for this app: $7-15"
echo ""
echo "Opening billing page in your browser..."
echo "URL: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
echo ""

# Try to open in browser
if command -v open &> /dev/null; then
    open "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
fi

read -p "Press Enter after you've enabled billing..."

echo ""
echo "Step 4: Enable Required APIs"
echo "----------------------------------------"
echo ""
echo "Enabling APIs (this may take a minute)..."

APIS=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "containerregistry.googleapis.com"
    "compute.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo "  Enabling $API..."
    gcloud services enable $API --project=$PROJECT_ID --quiet 2>/dev/null || true
done

echo "✓ APIs enabled"

echo ""
echo "========================================="
echo "Project Setup Complete!"
echo "========================================="
echo ""
echo "Project Details:"
echo "  Project ID: $PROJECT_ID"
echo "  Project Name: $PROJECT_NAME"
echo ""
echo "Project URL:"
echo "  https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
echo ""
echo "Next Steps:"
echo ""
echo "1. Deploy the application:"
echo "   ./deploy-gcp.sh"
echo ""
echo "2. Or set up GitHub Actions:"
echo "   ./setup-github-actions.sh"
echo ""
echo "Your project is ready! 🎉"
echo ""

# Save project ID for later use
echo "export PROJECT_ID=$PROJECT_ID" > .gcp-project-id
echo ""
echo "💡 Tip: Your project ID has been saved to .gcp-project-id"
echo "   You can load it with: source .gcp-project-id"
echo ""
