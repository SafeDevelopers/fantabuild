#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying Backend API to CapRover..."

# Verify we're in the project root
if [ ! -d "server" ]; then
  echo "❌ Error: server directory not found. Please run this script from the project root."
  exit 1
fi

# Verify server.js exists
if [ ! -f "server/server.js" ]; then
  echo "❌ Error: server/server.js not found."
  exit 1
fi

# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
echo "📦 Preparing deployment package..."

# Copy server files
echo "   Copying server files..."
if [ ! -d "server" ]; then
  echo "❌ Error: server directory not found"
  exit 1
fi
cp -r server/* "$TEMP_DIR/"

# Copy database directory if it exists (needed for migrations)
if [ -d "database" ]; then
  echo "   Copying database schema files..."
  mkdir -p "$TEMP_DIR/database"
  cp -r database/* "$TEMP_DIR/database/" 2>/dev/null || true
fi

# Create tar file (exclude node_modules and .env files)
cd "$TEMP_DIR"
echo "   Creating deployment archive..."
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='.git' \
  .

# Move tar file to project root
mv ../server-deploy.tar.gz "$OLDPWD/"

# Cleanup temp directory
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

# Verify tar file was created
if [ ! -f "server-deploy.tar.gz" ]; then
  echo "❌ Error: Failed to create deployment archive"
  exit 1
fi

# Deploy to CapRover
echo "🚀 Deploying to CapRover (app: fantabuild-api)..."
if ! caprover deploy --appName fantabuild-api --tarFile server-deploy.tar.gz; then
  echo "❌ Deployment failed!"
  rm -f server-deploy.tar.gz
  exit 1
fi

# Cleanup
rm -f server-deploy.tar.gz

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📋 Important notes:"
echo "   • Database migrations run automatically on server startup"
echo "   • Make sure to set these environment variables in CapRover:"
echo "     - DATABASE_URL (recommended) OR"
echo "     - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
echo "     - FRONTEND_URL=https://fantabuild.addispos.com"
echo "     - GEMINI_API_KEY (your Gemini API key)"
echo "     - JWT_SECRET (your JWT secret)"
echo "     - SESSION_SECRET (your session secret)"
echo "   • The server will create required tables if they don't exist"
echo "   • Check server logs in CapRover to verify startup and CORS configuration"
echo "   • CORS is configured for: https://fantabuild.addispos.com"
