#!/bin/bash
set -e

echo "================================================"
echo "Family Tree App - Minikube Deployment Script"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Step 1: Starting minikube...${NC}"
minikube start

echo -e "\n${YELLOW}Step 2: Setting up Docker environment for minikube...${NC}"
eval $(minikube docker-env)

echo -e "\n${YELLOW}Step 3: Building Docker image in minikube...${NC}"
docker build -t family-tree-app:latest .

echo -e "\n${YELLOW}Step 4: Deploying to Kubernetes...${NC}"

# Create namespace
echo "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-secrets.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n family-tree --timeout=120s

# Deploy Application
echo "Deploying Family Tree Application..."
kubectl apply -f k8s/app-configmap.yaml
kubectl apply -f k8s/app-pvc.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml

echo "Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=family-tree-web -n family-tree --timeout=120s

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}To access the application:${NC}"
echo "Run this command in a separate terminal:"
echo "  kubectl port-forward -n family-tree svc/family-tree-web 8080:80"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:8080"
echo ""

echo -e "${YELLOW}Useful commands:${NC}"
echo "  View pods:    kubectl get pods -n family-tree"
echo "  View logs:    kubectl logs -f -l app=family-tree-web -n family-tree"
echo "  Stop minikube: minikube stop"
echo "  Delete all:   kubectl delete namespace family-tree"
echo ""
