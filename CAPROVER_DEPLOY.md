# CapRover Deployment Guide for Contabo VPS

This guide will help you deploy Fanta Build to CapRover on your Contabo VPS with PostgreSQL and Redis.

## Prerequisites

1. Contabo VPS with CapRover installed
2. PostgreSQL database (can be on same VPS or separate)
3. Redis instance (can be on same VPS or separate)
4. Domain name pointing to your VPS

## Step 1: Set Up PostgreSQL Database

### Option A: PostgreSQL on Same VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install PostgreSQL
apt update
apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE DATABASE fantabuild;
CREATE USER fantabuild_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE fantabuild TO fantabuild_user;
\q
```

### Option B: Use Managed PostgreSQL (Recommended)

Use a managed service like:
- Supabase (free tier available)
- Railway
- DigitalOcean Managed Databases
- AWS RDS

## Step 2: Set Up Redis

### Option A: Redis on Same VPS

```bash
# Install Redis
apt install redis-server -y

# Start Redis
systemctl start redis-server
systemctl enable redis-server
```

### Option B: Use Managed Redis

Use a managed service like:
- Redis Cloud (free tier)
- Upstash
- AWS ElastiCache

## Step 3: Run Database Schema

Connect to your PostgreSQL database and run the schema:

```bash
psql -h your-db-host -U fantabuild_user -d fantabuild -f database/postgres-schema.sql
```

Or via CapRover's one-click apps:
1. Go to CapRover dashboard
2. Apps > One-Click Apps/Databases
3. Install PostgreSQL
4. Use the built-in SQL editor to run the schema

## Step 4: Configure CapRover

1. **Access CapRover Dashboard**
   - Go to `http://your-vps-ip:3000` (or your domain)
   - Set up admin password

2. **Create App**
   - Click "Apps" > "One-Click Apps/Databases"
   - Install PostgreSQL (if using on VPS)
   - Install Redis (if using on VPS)

3. **Set Environment Variables**
   - Go to your app settings
   - Click "App Configs" > "Environment Variables"
   - Copy all variables from `server/.env.example` and fill in your values:
     - Database credentials (from PostgreSQL setup)
     - Redis connection (from Redis setup)
     - Generate secrets: `openssl rand -base64 32` (run twice for SESSION_SECRET and JWT_SECRET)
     - Add your Gemini API key
     - Add your Stripe keys
   - See `server/.env.example` for complete list with descriptions

## Step 5: Deploy Backend

### Method 1: Git Deployment (Recommended)

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-git-repo-url
   git push -u origin main
   ```

2. **Connect to CapRover**
   - In CapRover dashboard, go to your app
   - Enable "Enable HTTP Basic Auth" if needed
   - Go to "Deployment" tab
   - Select "Git Repository"
   - Enter your repo URL
   - Set branch to `main` or `master`
   - Set Dockerfile path: `server/Dockerfile`
   - Click "Save & Update"

### Method 2: Dockerfile Deployment

1. **Build and Push to Registry**
   ```bash
   cd server
   docker build -t your-registry/fantabuild-backend .
   docker push your-registry/fantabuild-backend
   ```

2. **Deploy in CapRover**
   - Go to your app
   - Deployment tab
   - Select "Docker Image"
   - Enter image name
   - Click "Save & Update"

## Step 6: Deploy Frontend

### Option A: Static Site (Recommended)

1. **Build Frontend**
   ```bash
   cd /path/to/fanta-build
   pnpm install
   pnpm build
   ```

2. **Deploy to CapRover**
   - Create new app in CapRover
   - Enable "Has Persistent Data"
   - Go to "HTTP Settings"
   - Enable "Serve Static Files"
   - Set "Static Files Directory" to `/dist`
   - Deploy using one of:
     - **Method 1**: Upload `dist` folder via File Manager
     - **Method 2**: Use nginx one-click app
     - **Method 3**: Build in Dockerfile

### Option B: Dockerfile for Frontend

Create `Dockerfile` in root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Step 7: Configure Domain & SSL

1. **Add Domain in CapRover**
   - Go to your app
   - HTTP Settings
   - Add your domain: `api.yourdomain.com` (for backend)
   - Enable "Force HTTPS by redirecting all HTTP traffic to HTTPS"
   - Click "Save & Update"

2. **Update Frontend Environment**
   - Update `VITE_API_BASE_URL` to `https://api.yourdomain.com`
   - Rebuild frontend

## Step 8: Set Up Stripe Webhook

1. **Get Webhook URL**
   - Your webhook URL: `https://api.yourdomain.com/api/webhook`

2. **Configure in Stripe Dashboard**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://api.yourdomain.com/api/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy the webhook signing secret
   - Add to CapRover environment: `STRIPE_WEBHOOK_SECRET`

## Step 9: Test Deployment

1. **Health Check**
   ```bash
   curl https://api.yourdomain.com/health
   ```
   Should return: `{"status":"ok","database":"connected","redis":"connected"}`

2. **Test Sign Up**
   - Go to your frontend URL
   - Try signing up
   - Check backend logs in CapRover

3. **Test Generation**
   - Sign in
   - Try generating a creation
   - Check database for new records

## Troubleshooting

### Database Connection Issues
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Verify PostgreSQL is accessible from CapRover
- Check firewall rules

### Redis Connection Issues
- Check `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- Verify Redis is running
- Check authentication if required

### Frontend Can't Connect to Backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Verify domain is properly configured

### Build Failures
- Check Dockerfile paths
- Verify all dependencies in package.json
- Check build logs in CapRover

## Production Checklist

- [ ] PostgreSQL database created and schema run
- [ ] Redis instance running
- [ ] Environment variables configured
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Domain configured with SSL
- [ ] Stripe webhook configured
- [ ] Health check passing
- [ ] Can sign up/sign in
- [ ] Can generate creations
- [ ] Payments working

## Monitoring

- Use CapRover's built-in logs
- Set up monitoring for:
  - Database connections
  - Redis connections
  - API response times
  - Error rates

## Backup Strategy

1. **Database Backups**
   ```bash
   # Daily backup script
   pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d).sql
   ```

2. **CapRover Backups**
   - Use CapRover's backup feature
   - Or set up automated backups via cron

