#!/bin/bash

echo "🚀 Deploying Fanta Build to CapRover..."
echo ""

# Deploy Backend
echo "📦 Deploying Backend API..."
cd server
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  .
caprover deploy --appName fantabuild-api --tarFile ../server-deploy.tar.gz
rm ../server-deploy.tar.gz
cd ..

echo ""
echo "📦 Deploying Frontend..."
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='server' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='dist' \
  .
caprover deploy --appName fantabuild-frontend --tarFile frontend-deploy.tar.gz
rm frontend-deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set environment variables in CapRover dashboard"
echo "   2. Backend: Add all variables from BACKEND_ENV_EXAMPLE.md"
echo "   3. Frontend: Add VITE_API_BASE_URL=https://api.addispos.com"
echo "   4. Run database migrations"
echo "   5. Configure Stripe webhook"
