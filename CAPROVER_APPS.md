# CapRover Apps to Create

## Summary

You need to create **2 main apps** in CapRover:

1. **Backend App** (API Server) - Node.js/Express
2. **Frontend App** (React Static Site) - Built HTML/CSS/JS

Plus optional one-click apps for databases:

3. **PostgreSQL** (optional - if using CapRover's PostgreSQL)
4. **Redis** (optional - if using CapRover's Redis)

---

## App 1: Backend API Server

### App Name
`fantabuild-api` or `fantabuild-backend`

### Configuration

**Deployment Method:**
- **Git Repository** (Recommended)
  - Repository URL: Your Git repo
  - Branch: `main` or `master`
  - Dockerfile Path: `server/Dockerfile`
  - Captain Definition Path: `server/captain-definition`

**OR**

- **Docker Image**
  - Image name: `your-registry/fantabuild-backend`

### Environment Variables

Copy from `server/.env.example`:

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Database (use service name if using CapRover PostgreSQL)
DB_HOST=postgres.captain.local
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=fantabuild_user
DB_PASSWORD=your_secure_password
DB_SSL=false

# Redis (use service name if using CapRover Redis)
REDIS_URL=redis://redis.captain.local:6379

# Auth (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-here
JWT_SECRET=your-random-secret-here
JWT_EXPIRES_IN=7d

# API Keys
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### HTTP Settings

- **Domain**: `api.yourdomain.com` (or `backend.yourdomain.com`)
- **Force HTTPS**: ✅ Enable
- **Port**: 3001 (internal)

### Health Check

After deployment, test:
```bash
curl https://api.yourdomain.com/health
```

Should return: `{"status":"ok","database":"connected","redis":"connected"}`

---

## App 2: Frontend Static Site

### App Name
`fantabuild-frontend` or `fantabuild-web`

### Configuration

**Option A: Static Files (Recommended)**

1. **Build locally first:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **In CapRover:**
   - Create new app
   - Enable "Has Persistent Data"
   - HTTP Settings:
     - Enable "Serve Static Files"
     - Static Files Directory: `/dist`
   - Upload `dist` folder via File Manager

**Option B: Dockerfile (Better for CI/CD)**

Create `Dockerfile` in root directory:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Then deploy with:
- Dockerfile Path: `./Dockerfile`

### Environment Variables

**Build-time variable** (set before building):
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Note:** For static sites, environment variables are baked into the build. You need to rebuild if you change `VITE_API_BASE_URL`.

### HTTP Settings

- **Domain**: `yourdomain.com` (or `www.yourdomain.com`)
- **Force HTTPS**: ✅ Enable
- **Port**: 80 (nginx default)

---

## Optional: One-Click Apps

### PostgreSQL (if using CapRover's PostgreSQL)

1. Go to **Apps** > **One-Click Apps/Databases**
2. Install **PostgreSQL**
3. Set password
4. Note the service name: `postgres.captain.local`
5. Use in backend environment: `DB_HOST=postgres.captain.local`

**After installation:**
- Run schema: Use built-in SQL editor or connect via psql
- Create database: `CREATE DATABASE fantabuild;`
- Create user: `CREATE USER fantabuild_user WITH PASSWORD 'password';`
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE fantabuild TO fantabuild_user;`

### Redis (if using CapRover's Redis)

1. Go to **Apps** > **One-Click Apps/Databases**
2. Install **Redis**
3. Note the service name: `redis.captain.local`
4. Use in backend environment: `REDIS_URL=redis://redis.captain.local:6379`

---

## Deployment Order

1. **First**: Install PostgreSQL & Redis (if using CapRover's)
2. **Second**: Deploy Backend API
3. **Third**: Deploy Frontend

---

## Quick Checklist

### Backend App
- [ ] App created: `fantabuild-api`
- [ ] Git repo connected OR Docker image set
- [ ] Dockerfile path: `server/Dockerfile`
- [ ] Environment variables configured
- [ ] Domain set: `api.yourdomain.com`
- [ ] HTTPS enabled
- [ ] Health check passing

### Frontend App
- [ ] App created: `fantabuild-frontend`
- [ ] Built locally OR Dockerfile configured
- [ ] `VITE_API_BASE_URL` set to backend URL
- [ ] Static files uploaded OR Docker image deployed
- [ ] Domain set: `yourdomain.com`
- [ ] HTTPS enabled
- [ ] Can access frontend

### Database (if using CapRover)
- [ ] PostgreSQL installed
- [ ] Database `fantabuild` created
- [ ] User `fantabuild_user` created
- [ ] Schema run (`database/postgres-schema.sql`)
- [ ] Redis installed (optional)

---

## Service Names in CapRover

When apps are in the same CapRover instance, they can communicate using service names:

- **PostgreSQL**: `postgres.captain.local:5432`
- **Redis**: `redis.captain.local:6379`
- **Backend API**: `fantabuild-api.captain.local:3001` (internal)
- **Frontend**: `fantabuild-frontend.captain.local:80` (internal)

Use these in environment variables for inter-service communication.

---

## Example Domain Setup

```
yourdomain.com          → Frontend (App 2)
api.yourdomain.com      → Backend API (App 1)
```

Or:

```
www.yourdomain.com      → Frontend
api.yourdomain.com      → Backend API
```

---

## Testing After Deployment

1. **Backend Health:**
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Frontend:**
   - Visit `https://yourdomain.com`
   - Should load the app

3. **Integration:**
   - Sign up in frontend
   - Should connect to backend API
   - Check backend logs in CapRover

---

## Troubleshooting

### Backend can't connect to database
- Check `DB_HOST` is correct (use `postgres.captain.local` if using CapRover PostgreSQL)
- Verify database exists and user has permissions
- Check firewall/network settings

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Verify backend domain is accessible

### Build fails
- Check Dockerfile paths are correct
- Verify all dependencies in package.json
- Check build logs in CapRover

