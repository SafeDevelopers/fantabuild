# CapRover Apps Setup Guide

This guide explains exactly which apps you need to create in CapRover for Fanta Build.

## Apps You Need to Create

You need to create **2 main apps** in CapRover:

### 1. Backend API App
- **App Name**: `fantabuild-api` (or `fantabuild-backend`)
- **Type**: Node.js/Express API Server
- **Port**: 3001 (internal)
- **Domain**: `api.yourdomain.com` (or `backend.yourdomain.com`)

### 2. Frontend App
- **App Name**: `fantabuild-frontend` (or `fantabuild-web`)
- **Type**: Static Site (React/Vite build)
- **Port**: 80 (nginx)
- **Domain**: `yourdomain.com` (or `www.yourdomain.com`)

### Optional: Database Apps (One-Click Apps)

If you want to use CapRover's one-click apps for databases:

3. **PostgreSQL** (optional)
   - App Name: `postgres` or `fantabuild-db`
   - One-Click App: PostgreSQL

4. **Redis** (optional)
   - App Name: `redis` or `fantabuild-redis`
   - One-Click App: Redis

---

## Step-by-Step Setup

### Step 1: Create Backend API App

1. **In CapRover Dashboard:**
   - Go to "Apps" → "One-Click Apps/Databases" → "Create New App"
   - App Name: `fantabuild-api`
   - Click "Create New App"

2. **Configure Deployment:**
   - Go to "Deployment" tab
   - Select "Git Repository"
   - Repository URL: `https://github.com/SafeDevelopers/fantabuild.git`
   - Branch: `main`
   - **Dockerfile Path**: `server/Dockerfile`
   - Click "Save & Update"

3. **Configure HTTP Settings:**
   - Go to "HTTP Settings" tab
   - Add Domain: `api.yourdomain.com` (replace with your domain)
   - Enable "Force HTTPS by redirecting all HTTP traffic to HTTPS"
   - Click "Save & Update"

4. **Set Environment Variables:**
   - Go to "App Configs" → "Environment Variables"
   - Add all variables from the list below (see "Backend Environment Variables" section)
   - Click "Save & Update"

5. **Verify Deployment:**
   - Wait for build to complete
   - Check logs for "✅ Connected to PostgreSQL database"
   - Test: `curl https://api.yourdomain.com/health`

---

### Step 2: Create Frontend App

1. **Build Frontend Locally (or use Dockerfile):**
   ```bash
   cd /path/to/fanta-build
   pnpm install
   pnpm build
   ```
   This creates a `dist` folder with static files.

2. **In CapRover Dashboard:**
   - Go to "Apps" → "One-Click Apps/Databases" → "Create New App"
   - App Name: `fantabuild-frontend`
   - Click "Create New App"

3. **Option A: Deploy Static Files (Recommended)**
   - Go to "HTTP Settings" tab
   - Enable "Has Persistent Data"
   - Enable "Serve Static Files"
   - Set "Static Files Directory" to `/dist`
   - Add Domain: `yourdomain.com`
   - Enable "Force HTTPS"
   - Go to "Deployment" tab
   - Select "Dockerfile"
   - Use the Dockerfile below (create it in root directory)
   - Click "Save & Update"

4. **Option B: Use Nginx One-Click App**
   - Install "Nginx" one-click app
   - Upload `dist` folder contents to persistent directory
   - Configure nginx to serve from that directory

---

### Step 3: Frontend Dockerfile (Create in Root Directory)

Create `Dockerfile` in the root of your project:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Build the app
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

And create `captain-definition` in root:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

---

## Environment Variables

### Backend App (`fantabuild-api`) Environment Variables

Copy these to CapRover → `fantabuild-api` → App Configs → Environment Variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database (PostgreSQL)
DB_HOST=postgres.captain.local
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=fantabuild_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false

# Redis (if using CapRover one-click app)
REDIS_URL=redis://redis.captain.local:6379
# OR individual settings:
# REDIS_HOST=redis.captain.local
# REDIS_PORT=6379
# REDIS_PASSWORD=

# Authentication & Security
SESSION_SECRET=generate_with_openssl_rand_base64_32
JWT_SECRET=OfeElCB37XqXjtIqjx6X/VJNOdGrX9tUrKgCPVg9XaU=
JWT_EXPIRES_IN=7d

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_SECRET_KEY=sk_live_..._or_sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (Optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Permanent Admin Account
ADMIN_EMAIL=admin@fantabuild.com
ADMIN_PASSWORD=Adimin1971@
```

**Important Notes:**
- Replace `yourdomain.com` with your actual domain
- Generate `SESSION_SECRET` with: `openssl rand -base64 32`
- Use your actual database credentials
- Use your actual API keys

### Frontend App Environment Variables

The frontend needs to know where the backend API is. You have two options:

**Option 1: Build-time Environment Variable (Recommended)**
- Add to CapRover environment variables:
  ```env
  VITE_API_BASE_URL=https://api.yourdomain.com
  ```
- Rebuild the app after adding this variable

**Option 2: Runtime Configuration**
- Create a `config.js` file that gets loaded at runtime
- Update `index.html` to load it before the app

---

## Database Setup

### If Using CapRover One-Click PostgreSQL:

1. Install PostgreSQL one-click app
2. Note the internal service name (usually `postgres`)
3. Use `postgres.captain.local` as `DB_HOST` in backend env vars
4. Run the schema:
   ```bash
   # Connect via CapRover terminal or SSH
   psql -h postgres.captain.local -U fantabuild_user -d fantabuild -f database/postgres-schema.sql
   psql -h postgres.captain.local -U fantabuild_user -d fantabuild -f database/credits-schema.sql
   ```

### If Using External PostgreSQL:

1. Use your external database host in `DB_HOST`
2. Set `DB_SSL=true` if using SSL
3. Run schemas on your external database

---

## Domain Configuration

### Backend Domain
- Domain: `api.yourdomain.com`
- Points to: `fantabuild-api` app
- SSL: Auto-configured by CapRover

### Frontend Domain
- Domain: `yourdomain.com` (or `www.yourdomain.com`)
- Points to: `fantabuild-frontend` app
- SSL: Auto-configured by CapRover

### DNS Records

Add these DNS A records pointing to your VPS IP:
```
api.yourdomain.com    →    YOUR_VPS_IP
yourdomain.com        →    YOUR_VPS_IP
www.yourdomain.com    →    YOUR_VPS_IP (optional)
```

---

## Verification Checklist

After deployment, verify:

- [ ] Backend health check: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Frontend can connect to backend (check browser console)
- [ ] Can sign up / sign in
- [ ] Can generate content
- [ ] Database connection working (check backend logs)
- [ ] Redis connection working (if using Redis)
- [ ] SSL certificates active (green lock in browser)

---

## Troubleshooting

### Backend Won't Start
- Check environment variables are set correctly
- Check database connection (verify DB_HOST, credentials)
- Check logs: CapRover → App → Logs

### Frontend Can't Connect to Backend
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings in backend
- Verify backend domain is accessible
- Check browser console for errors

### Database Connection Failed
- Verify `DB_HOST` is correct (use `postgres.captain.local` for one-click app)
- Check database credentials
- Verify database is running
- Check firewall rules

### Build Failures
- Check Dockerfile paths are correct
- Verify all dependencies in package.json
- Check build logs in CapRover

---

## Quick Reference

**Backend App:**
- Name: `fantabuild-api`
- Dockerfile: `server/Dockerfile`
- Port: 3001
- Domain: `api.yourdomain.com`

**Frontend App:**
- Name: `fantabuild-frontend`
- Dockerfile: `./Dockerfile` (root)
- Port: 80 (nginx)
- Domain: `yourdomain.com`

**Database:**
- Use CapRover one-click PostgreSQL or external database
- Run `postgres-schema.sql` and `credits-schema.sql`

**Redis:**
- Use CapRover one-click Redis or external Redis
- Optional (sessions work without it, but recommended for production)
