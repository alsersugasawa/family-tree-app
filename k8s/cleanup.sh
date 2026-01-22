#!/bin/bash

# Family Tree App - Kubernetes Cleanup Script
# This script removes all Family Tree Application resources from Kubernetes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NAMESPACE="family-tree"

echo -e "${RED}========================================${NC}"
echo -e "${RED}WARNING: This will delete all resources${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo "Namespace: ${NAMESPACE}"
echo ""
echo "This will delete:"
echo "  - All deployments, pods, and services"
echo "  - All persistent volume claims (DATA WILL BE LOST)"
echo "  - All secrets and config maps"
echo "  - The namespace itself"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${YELLOW}Deleting resources...${NC}"

# Delete in reverse order of creation
kubectl delete -f hpa.yaml --ignore-not-found=true
kubectl delete -f ingress.yaml --ignore-not-found=true
kubectl delete -f app-service.yaml --ignore-not-found=true
kubectl delete -f app-deployment.yaml --ignore-not-found=true
kubectl delete -f app-pvc.yaml --ignore-not-found=true
kubectl delete -f app-configmap.yaml --ignore-not-found=true
kubectl delete -f postgres-service.yaml --ignore-not-found=true
kubectl delete -f postgres-deployment.yaml --ignore-not-found=true
kubectl delete -f postgres-pvc.yaml --ignore-not-found=true
kubectl delete -f postgres-secrets.yaml --ignore-not-found=true

# Wait for pods to terminate
echo "Waiting for pods to terminate..."
kubectl wait --for=delete pod -l app=family-tree-web -n ${NAMESPACE} --timeout=60s || true
kubectl wait --for=delete pod -l app=postgres -n ${NAMESPACE} --timeout=60s || true

# Delete namespace
echo "Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true

echo -e "${GREEN}✓ Cleanup completed${NC}"
