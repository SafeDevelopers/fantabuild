# CapRover CLI Deployment Guide

Deploy Fanta Build using CapRover CLI (`caprover deploy`) from your local machine.

---

## Step 1: Install CapRover CLI

### On Mac/Linux:

```bash
npm install -g caprover
```

### On Windows:

```bash
npm install -g caprover
```

### Verify Installation:

```bash
caprover --version
```

---

## Step 2: Login to CapRover

```bash
caprover login
```

You'll be prompted for:
- **CapRover server URL:** `https://captain.yourdomain.com` or `http://YOUR_SERVER_IP:3000`
- **Password:** Your CapRover admin password

---

## Step 3: Deploy Backend API

### 3.1 Navigate to Project Directory

```bash
cd /Users/deldil/Desktop/fanta-build
```

### 3.2 Create CapRover Config File

Create `captain-definition` in the `server/` directory (if not exists):

```bash
cd server
cat > captain-definition << EOF
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
EOF
```

### 3.3 Deploy Backend

```bash
cd server
caprover deploy --appName fantabuild-api
```

**Or with explicit tar file:**

```bash
cd server
tar -czf ../server-deploy.tar.gz .
caprover deploy --appName fantabuild-api --tarFile ../server-deploy.tar.gz
```

---

## Step 4: Deploy Frontend

### 4.1 Navigate to Root Directory

```bash
cd /Users/deldil/Desktop/fanta-build
```

### 4.2 Deploy Frontend

```bash
caprover deploy --appName fantabuild-frontend
```

**Or with explicit tar file:**

```bash
tar -czf frontend-deploy.tar.gz --exclude='node_modules' --exclude='.git' --exclude='server' .
caprover deploy --appName fantabuild-frontend --tarFile frontend-deploy.tar.gz
```

---

## Alternative: Using Dockerfile Directly

### Backend Deployment

```bash
cd /Users/deldil/Desktop/fanta-build/server

# Build and deploy
caprover deploy --appName fantabuild-api --tarFile - < <(tar -czf - .)
```

### Frontend Deployment

```bash
cd /Users/deldil/Desktop/fanta-build

# Exclude server directory and node_modules
tar -czf - --exclude='node_modules' --exclude='.git' --exclude='server' . | \
caprover deploy --appName fantabuild-frontend --tarFile -
```

---

## Complete Deployment Script

Create a deployment script for easy deployment:

### Create `deploy-backend.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Backend API..."

cd server

# Create tar file
tar -czf ../server-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  .

# Deploy to CapRover
caprover deploy --appName fantabuild-api --tarFile ../server-deploy.tar.gz

# Cleanup
rm ../server-deploy.tar.gz

echo "✅ Backend deployment complete!"
```

### Create `deploy-frontend.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Frontend..."

# Create tar file (exclude server and node_modules)
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='server' \
  --exclude='.env' \
  --exclude='.env.*' \
  .

# Deploy to CapRover
caprover deploy --appName fantabuild-frontend --tarFile frontend-deploy.tar.gz

# Cleanup
rm frontend-deploy.tar.gz

echo "✅ Frontend deployment complete!"
```

### Make Scripts Executable:

```bash
chmod +x deploy-backend.sh
chmod +x deploy-frontend.sh
```

### Run Deployments:

```bash
# Deploy backend
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh
```

---

## One-Command Deployment

### Deploy Both Apps:

```bash
#!/bin/bash

echo "🚀 Deploying Fanta Build..."

# Deploy Backend
echo "Deploying backend..."
cd server
tar -czf ../server-deploy.tar.gz --exclude='node_modules' --exclude='.env' .
caprover deploy --appName fantabuild-api --tarFile ../server-deploy.tar.gz
rm ../server-deploy.tar.gz
cd ..

# Deploy Frontend
echo "Deploying frontend..."
tar -czf frontend-deploy.tar.gz --exclude='node_modules' --exclude='.git' --exclude='server' .
caprover deploy --appName fantabuild-frontend --tarFile frontend-deploy.tar.gz
rm frontend-deploy.tar.gz

echo "✅ Deployment complete!"
```

Save as `deploy.sh`, make executable, and run:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Important Notes

### Environment Variables

**Important:** The `caprover deploy` command deploys code only. Environment variables must be set in CapRover dashboard:

1. Go to CapRover → App → App Configs → Environment Variables
2. Add all variables from `BACKEND_ENV_EXAMPLE.md` and `FRONTEND_ENV_EXAMPLE.md`
3. Click "Save & Update"

### Dockerfile Paths

- **Backend:** Uses `server/Dockerfile`
- **Frontend:** Uses root `./Dockerfile`

Make sure these files exist before deploying.

### What Gets Deployed

The CLI creates a tar file of your code and uploads it to CapRover. CapRover then:
1. Extracts the tar file
2. Builds the Docker image using the Dockerfile
3. Deploys the container

---

## Troubleshooting

### "App not found" Error

Make sure the app exists in CapRover:
1. Go to CapRover dashboard
2. Create the app if it doesn't exist
3. Then run deploy command

### "Authentication failed" Error

Re-login to CapRover:
```bash
caprover login
```

### Build Fails

Check:
1. Dockerfile exists in correct location
2. All required files are included in tar
3. Check CapRover build logs

### Environment Variables Not Working

Remember: CLI deployment only deploys code. Environment variables must be set in CapRover dashboard separately.

---

## Quick Reference Commands

```bash
# Login
caprover login

# Deploy backend
cd server && caprover deploy --appName fantabuild-api

# Deploy frontend
cd .. && caprover deploy --appName fantabuild-frontend

# Check app status
caprover list

# View app logs
caprover logs --appName fantabuild-api
```

---

## After Deployment

1. ✅ Set environment variables in CapRover dashboard
2. ✅ Run database migrations
3. ✅ Configure Stripe webhook
4. ✅ Test the deployment

See `CAPROVER_DEPLOY_STEPS.md` for post-deployment steps.
