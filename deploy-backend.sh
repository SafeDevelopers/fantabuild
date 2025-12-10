#!/bin/bash

echo "🚀 Deploying Backend API to CapRover..."

cd server

# Create tar file (exclude node_modules and .env files)
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  .

# Deploy to CapRover
caprover deploy --appName fantabuild-api --tarFile ../server-deploy.tar.gz

# Cleanup
rm ../server-deploy.tar.gz

echo "✅ Backend deployment complete!"
echo "💡 Don't forget to set environment variables in CapRover dashboard!"
