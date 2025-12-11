#!/bin/bash

echo "🚀 Deploying Fanta Build to CapRover..."
echo ""

# Deploy Backend
echo "📦 Deploying Backend API..."
echo "   Preparing backend package with database schema files..."

# Create a temporary directory for backend deployment
TEMP_DIR=$(mktemp -d)

# Copy server files
cp -r server/* "$TEMP_DIR/"

# Copy database directory (needed for migrations)
mkdir -p "$TEMP_DIR/database"
cp -r database/* "$TEMP_DIR/database/"

# Create tar file
cd "$TEMP_DIR"
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  .

# Move tar file to project root and cleanup
mv ../server-deploy.tar.gz "$OLDPWD/"
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

# Deploy backend
caprover deploy --appName fantabuild-api --tarFile server-deploy.tar.gz
rm server-deploy.tar.gz

echo ""
echo "📦 Deploying Frontend..."
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
caprover deploy --appName frontend --tarFile frontend-deploy.tar.gz
rm frontend-deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "🔧 Backend Configuration:"
echo "   1. Set environment variables in CapRover dashboard (fantabuild-api app):"
echo "      • Database: DATABASE_URL (recommended) OR DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
echo "      • Other variables from your .env file (JWT_SECRET, ADMIN_EMAIL, etc.)"
echo "   2. Database migrations run automatically on server startup"
echo "   3. Check server logs to verify migration completed successfully"
echo ""
echo "🎨 Frontend Configuration:"
echo "   1. Set VITE_API_BASE_URL in CapRover dashboard (fantabuild-frontend app)"
echo "      Example: VITE_API_BASE_URL=https://api.yourdomain.com"
echo ""
echo "💳 Additional Setup:"
echo "   • Configure Stripe webhook endpoint"
echo "   • Verify admin account is accessible"
