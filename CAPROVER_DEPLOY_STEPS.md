# CapRover Deployment Steps - Complete Guide

Follow these steps to deploy Fanta Build to CapRover using Git deployment.

---

## Prerequisites Checklist

Before starting, make sure you have:
- [x] CapRover installed and accessible
- [x] PostgreSQL one-click app installed (optional, or external database)
- [x] Redis one-click app installed (optional)
- [x] All environment variables ready (from BACKEND_ENV_EXAMPLE.md and FRONTEND_ENV_EXAMPLE.md)
- [x] Database schemas ready to run
- [x] Domain DNS configured (api.addispos.com and addispos.com)

---

## Step 1: Deploy Backend API

### 1.1 Create Backend App

1. **Open CapRover Dashboard**
   - Go to `http://captain.yourdomain.com:3000` or `http://YOUR_SERVER_IP:3000`
   - Log in with your admin password

2. **Create New App**
   - Click **"Apps"** in the left sidebar
   - Click **"One-Click Apps/Databases"** tab
   - Click **"Create New App"** button
   - Enter app name: `fantabuild-api`
   - Click **"Create New App"**

### 1.2 Configure Deployment

1. **Go to Deployment Tab**
   - Click on your `fantabuild-api` app
   - Click **"Deployment"** tab

2. **Set Up Git Deployment**
   - Select **"Git Repository"** as deployment method
   - Repository URL: `https://github.com/SafeDevelopers/fantabuild.git`
   - Branch: `main`
   - **Dockerfile Path:** `server/Dockerfile`
   - Click **"Save & Update"**

   **Note:** CapRover will start building automatically. This may take a few minutes.

### 1.3 Configure HTTP Settings

1. **Go to HTTP Settings Tab**
   - Click **"HTTP Settings"** tab
   - Under **"Custom Domain"**, click **"Add Domain"**
   - Enter: `api.addispos.com`
   - Enable **"Force HTTPS by redirecting all HTTP traffic to HTTPS"**
   - Click **"Save & Update"**

### 1.4 Add Environment Variables

1. **Go to App Configs**
   - Click **"App Configs"** tab
   - Click **"Environment Variables"**

2. **Add All Backend Variables**
   - Click **"Add New Variable"** for each variable
   - Copy from `BACKEND_ENV_EXAMPLE.md`:
   
   **Server Configuration:**
   ```
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://addispos.com
   ```
   
   **Database:**
   ```
   DB_HOST=postgres.captain.local
   DB_PORT=5432
   DB_NAME=fantabuild
   DB_USER=postgres
   DB_PASSWORD=your_database_password
   DB_SSL=false
   ```
   
   **Redis:**
   ```
   REDIS_URL=redis://redis.captain.local:6379
   ```
   
   **Security:**
   ```
   SESSION_SECRET=your_generated_session_secret
   JWT_SECRET=OfeElCB37XqXjtIqjx6X/VJNOdGrX9tUrKgCPVg9XaU=
   JWT_EXPIRES_IN=7d
   ```
   
   **API Keys:**
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **Stripe:**
   ```
   STRIPE_SECRET_KEY=sk_live_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```
   
   **Admin:**
   ```
   ADMIN_EMAIL=admin@fantabuild.com
   ADMIN_PASSWORD=Adimin1971@
   ```

3. **Save Environment Variables**
   - After adding all variables, click **"Save & Update"**
   - The app will rebuild with new environment variables

### 1.5 Verify Backend Deployment

1. **Check Build Status**
   - Go to **"Deployment"** tab
   - Check build logs - should show successful build
   - Wait for "Deployment successful" message

2. **Check App Logs**
   - Go to **"App Logs"** tab
   - Look for: `✅ Connected to PostgreSQL database`
   - Look for: `🚀 Fanta Build server running on port 3001`

3. **Test Health Endpoint**
   ```bash
   curl https://api.addispos.com/health
   ```
   Should return: `{"status":"ok","database":"connected","redis":"connected"}`

---

## Step 2: Deploy Frontend

### 2.1 Create Frontend App

1. **Create New App**
   - Click **"Apps"** → **"One-Click Apps/Databases"**
   - Click **"Create New App"**
   - Enter app name: `fantabuild-frontend`
   - Click **"Create New App"**

### 2.2 Configure Deployment

1. **Go to Deployment Tab**
   - Click on `fantabuild-frontend` app
   - Click **"Deployment"** tab

2. **Set Up Git Deployment**
   - Select **"Git Repository"** as deployment method
   - Repository URL: `https://github.com/SafeDevelopers/fantabuild.git`
   - Branch: `main`
   - **Dockerfile Path:** `./Dockerfile` (root directory)
   - Click **"Save & Update"**

   **Note:** This will build the React app and serve it with nginx.

### 2.3 Configure HTTP Settings

1. **Go to HTTP Settings Tab**
   - Click **"HTTP Settings"** tab
   - Under **"Custom Domain"**, click **"Add Domain"**
   - Enter: `addispos.com` (or your frontend domain)
   - Enable **"Force HTTPS by redirecting all HTTP traffic to HTTPS"**
   - Click **"Save & Update"**

### 2.4 Add Environment Variables

1. **Go to App Configs**
   - Click **"App Configs"** tab
   - Click **"Environment Variables"**

2. **Add Frontend Variable**
   - Click **"Add New Variable"**
   - Variable name: `VITE_API_BASE_URL`
   - Variable value: `https://api.addispos.com`
   - Click **"Save & Update"**

   **Important:** The app will automatically rebuild after adding this variable.

### 2.5 Verify Frontend Deployment

1. **Check Build Status**
   - Go to **"Deployment"** tab
   - Check build logs - should show successful build
   - Wait for "Deployment successful" message

2. **Test Frontend**
   - Open browser: `https://addispos.com`
   - Should see Fanta Build homepage
   - Open browser console (F12)
   - Check Network tab - API calls should go to `https://api.addispos.com`

---

## Step 3: Run Database Migrations

### 3.1 Connect to PostgreSQL

**Option A: Via CapRover Terminal**

1. In CapRover, go to your PostgreSQL app
2. Click **"Terminal"** tab
3. Run:
   ```bash
   psql -U postgres -d fantabuild
   ```

**Option B: Via SSH**

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Connect to PostgreSQL container
docker exec -it srv-captain--postgres psql -U postgres -d fantabuild
```

### 3.2 Run Base Schema

```sql
-- Copy and paste the contents of database/postgres-schema.sql
-- Or run:
\i /path/to/postgres-schema.sql
```

### 3.3 Run Credits Schema

```sql
-- Copy and paste the contents of database/credits-schema.sql
-- Or run:
\i /path/to/credits-schema.sql
```

**Or use the migration script:**

```bash
# On your server, clone the repo or upload the files
cd /tmp
git clone https://github.com/SafeDevelopers/fantabuild.git
cd fantabuild/database

# Run migrations
docker exec -i srv-captain--postgres psql -U postgres -d fantabuild < postgres-schema.sql
docker exec -i srv-captain--postgres psql -U postgres -d fantabuild < credits-schema.sql
```

---

## Step 4: Configure Stripe Webhook

### 4.1 Get Webhook URL

Your webhook URL is: `https://api.addispos.com/api/webhook`

### 4.2 Configure in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **"Developers"** → **"Webhooks"**
3. Click **"Add endpoint"**
4. Endpoint URL: `https://api.addispos.com/api/webhook`
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
6. Click **"Add endpoint"**
7. Copy the **"Signing secret"** (starts with `whsec_`)

### 4.3 Add Webhook Secret to Backend

1. Go to CapRover → `fantabuild-api` → App Configs → Environment Variables
2. Update `STRIPE_WEBHOOK_SECRET` with the signing secret from Stripe
3. Click **"Save & Update"**

---

## Step 5: Final Verification

### 5.1 Backend Health Check

```bash
curl https://api.addispos.com/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### 5.2 Frontend Loads

- Visit: `https://addispos.com`
- Should see Fanta Build homepage
- No console errors

### 5.3 Test Sign Up

1. Go to `https://addispos.com`
2. Click **"Sign In"**
3. Click **"Don't have an account? Sign up"**
4. Enter email and password
5. Click **"Sign Up"**
6. Should successfully create account

### 5.4 Test Generation

1. Sign in to your account
2. Enter a prompt (e.g., "Create a landing page for a coffee shop")
3. Select a mode (Web, Mobile, etc.)
4. Click **"Generate"**
5. Should generate content successfully

### 5.5 Check Logs

**Backend Logs:**
- CapRover → `fantabuild-api` → App Logs
- Should see successful requests
- No errors

**Frontend Logs:**
- CapRover → `fantabuild-frontend` → App Logs
- Should see nginx access logs

---

## Troubleshooting

### Backend Won't Start

1. **Check Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

2. **Check Database Connection**
   - Verify `DB_HOST=postgres.captain.local` (if using one-click app)
   - Check database credentials
   - Test connection: `docker exec -it srv-captain--postgres psql -U postgres -d fantabuild`

3. **Check Logs**
   - CapRover → `fantabuild-api` → App Logs
   - Look for error messages

### Frontend Can't Connect to Backend

1. **Verify Environment Variable**
   - Check `VITE_API_BASE_URL=https://api.addispos.com` is set
   - Rebuild the app after adding variable

2. **Check CORS**
   - Backend should allow `https://addispos.com`
   - Verify `FRONTEND_URL=https://addispos.com` in backend

3. **Check Browser Console**
   - Open browser console (F12)
   - Look for CORS errors or connection errors

### Build Failures

1. **Check Dockerfile Path**
   - Backend: `server/Dockerfile`
   - Frontend: `./Dockerfile`

2. **Check Build Logs**
   - CapRover → App → Deployment → View Build Logs
   - Look for specific error messages

3. **Verify Git Repository**
   - Make sure repository is accessible
   - Check branch name is `main`

---

## Quick Reference

**Backend App:**
- Name: `fantabuild-api`
- Domain: `api.addispos.com`
- Dockerfile: `server/Dockerfile`
- Repository: `https://github.com/SafeDevelopers/fantabuild.git`

**Frontend App:**
- Name: `fantabuild-frontend`
- Domain: `addispos.com`
- Dockerfile: `./Dockerfile`
- Repository: `https://github.com/SafeDevelopers/fantabuild.git`

**Environment Variables:**
- Backend: See `BACKEND_ENV_EXAMPLE.md`
- Frontend: `VITE_API_BASE_URL=https://api.addispos.com`

---

## Next Steps After Deployment

1. ✅ Test all features (sign up, sign in, generation, payments)
2. ✅ Monitor logs for errors
3. ✅ Set up monitoring/alerting (optional)
4. ✅ Configure backups for database
5. ✅ Test payment flows (Stripe, PayPal, etc.)
6. ✅ Verify admin dashboard works

---

## Support

If you encounter issues:
1. Check CapRover logs
2. Check browser console
3. Verify all environment variables are set
4. Test database connection
5. Verify DNS is configured correctly
