# CapRover Deployment Checklist

## ✅ Pre-Deployment Checks

### Backend Configuration
- [x] `server/Dockerfile` exists and is correct
- [x] `server/captain-definition` exists
- [x] `server/package.json` has correct start script
- [x] Environment variables documented

### Frontend Configuration
- [x] Root `Dockerfile` exists for frontend
- [x] Root `captain-definition` exists for frontend
- [x] `package.json` has build script
- [x] `vite.config.ts` configured correctly

### Database
- [x] `database/postgres-schema.sql` ready
- [x] `database/credits-schema.sql` ready
- [x] Migration script available

---

## 📋 Apps to Create in CapRover

### 1. Backend API App

**App Name:** `fantabuild-api`

**Configuration:**
- **Deployment Method:** Git Repository
- **Repository:** `https://github.com/SafeDevelopers/fantabuild.git`
- **Branch:** `main`
- **Dockerfile Path:** `server/Dockerfile`
- **Port:** 3001 (internal)
- **Domain:** `api.yourdomain.com`

**Environment Variables Required:**
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DB_HOST=postgres.captain.local
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=fantabuild_user
DB_PASSWORD=your_password
DB_SSL=false
REDIS_URL=redis://redis.captain.local:6379
SESSION_SECRET=<generate_with_openssl_rand_base64_32>
JWT_SECRET=OfeElCB37XqXjtIqjx6X/VJNOdGrX9tUrKgCPVg9XaU=
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_key_here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAIL=admin@fantabuild.com
ADMIN_PASSWORD=Adimin1971@
```

---

### 2. Frontend App

**App Name:** `fantabuild-frontend`

**Configuration:**
- **Deployment Method:** Git Repository
- **Repository:** `https://github.com/SafeDevelopers/fantabuild.git`
- **Branch:** `main`
- **Dockerfile Path:** `./Dockerfile` (root)
- **Port:** 80 (nginx)
- **Domain:** `yourdomain.com`

**Environment Variables Required:**
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

### 3. PostgreSQL (Optional - One-Click App)

**App Name:** `postgres` or `fantabuild-db`

**Configuration:**
- Install from "One-Click Apps/Databases"
- Use default settings or customize
- Note the internal service name for `DB_HOST`

**After Installation:**
1. Run `database/postgres-schema.sql`
2. Run `database/credits-schema.sql`

---

### 4. Redis (Optional - One-Click App)

**App Name:** `redis` or `fantabuild-redis`

**Configuration:**
- Install from "One-Click Apps/Databases"
- Use default settings
- Note the internal service name for `REDIS_URL`

---

## 🔧 Deployment Steps

### Step 1: Create Backend App

1. CapRover Dashboard → Apps → Create New App
2. Name: `fantabuild-api`
3. Deployment Tab:
   - Method: Git Repository
   - URL: `https://github.com/SafeDevelopers/fantabuild.git`
   - Branch: `main`
   - Dockerfile Path: `server/Dockerfile`
4. HTTP Settings Tab:
   - Domain: `api.yourdomain.com`
   - Force HTTPS: Enabled
5. App Configs → Environment Variables:
   - Add all backend environment variables
6. Save & Update

### Step 2: Create Frontend App

1. CapRover Dashboard → Apps → Create New App
2. Name: `fantabuild-frontend`
3. Deployment Tab:
   - Method: Git Repository
   - URL: `https://github.com/SafeDevelopers/fantabuild.git`
   - Branch: `main`
   - Dockerfile Path: `./Dockerfile`
4. HTTP Settings Tab:
   - Domain: `yourdomain.com`
   - Force HTTPS: Enabled
5. App Configs → Environment Variables:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
6. Save & Update

### Step 3: Install Databases (If Using One-Click Apps)

1. Apps → One-Click Apps/Databases
2. Install PostgreSQL
3. Install Redis
4. Note service names for environment variables

### Step 4: Run Database Migrations

```bash
# Connect to PostgreSQL
psql -h postgres.captain.local -U fantabuild_user -d fantabuild

# Run schemas
\i database/postgres-schema.sql
\i database/credits-schema.sql
```

### Step 5: Configure Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy webhook secret
5. Add to backend environment: `STRIPE_WEBHOOK_SECRET`

---

## ✅ Verification

After deployment, test:

1. **Backend Health:**
   ```bash
   curl https://api.yourdomain.com/health
   ```
   Should return: `{"status":"ok","database":"connected","redis":"connected"}`

2. **Frontend Loads:**
   - Visit `https://yourdomain.com`
   - Should see the app

3. **API Connection:**
   - Open browser console
   - Check for API connection errors
   - Try signing up

4. **Database:**
   - Check backend logs for database connection
   - Verify users table exists

5. **Generation:**
   - Sign in
   - Try generating content
   - Check backend logs

---

## 🐛 Common Issues

### Backend Build Fails
- Check Dockerfile path is `server/Dockerfile`
- Verify `server/package.json` exists
- Check build logs in CapRover

### Frontend Can't Connect to Backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS in backend (should allow frontend domain)
- Verify backend domain is accessible

### Database Connection Failed
- Check `DB_HOST` (use `postgres.captain.local` for one-click app)
- Verify credentials
- Check database is running

### Environment Variables Not Loading
- Restart app after adding variables
- Check variable names match exactly
- Verify no typos

---

## 📝 Notes

- Backend Dockerfile builds from `server/` directory
- Frontend Dockerfile builds from root directory
- Both use the same git repository
- Environment variables are set per app in CapRover
- SSL certificates are auto-configured by CapRover
