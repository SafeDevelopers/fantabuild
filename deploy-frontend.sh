#!/bin/bash

echo "🚀 Deploying Frontend to CapRover..."

# Create tar file (exclude server, database, node_modules, .git, .env files)
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='server' \
  --exclude='database' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='dist' \
  --exclude='.cursor' \
  .

# Deploy to CapRover
echo "📦 Deploying frontend to CapRover app: frontend"
caprover deploy --appName frontend --tarFile frontend-deploy.tar.gz

# Cleanup
rm frontend-deploy.tar.gz

echo ""
echo "✅ Frontend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   • Set VITE_API_URL in CapRover dashboard (frontend app)"
echo "   • Example: VITE_API_URL=https://api-staging.addispos.com"
