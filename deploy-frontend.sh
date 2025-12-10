#!/bin/bash

echo "🚀 Deploying Frontend to CapRover..."

# Create tar file (exclude server, node_modules, .git, .env files)
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='server' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='dist' \
  .

# Deploy to CapRover
caprover deploy --appName fantabuild-frontend --tarFile frontend-deploy.tar.gz

# Cleanup
rm frontend-deploy.tar.gz

echo "✅ Frontend deployment complete!"
echo "💡 Don't forget to set VITE_API_BASE_URL in CapRover dashboard!"
