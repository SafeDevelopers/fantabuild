# Troubleshooting 502 Bad Gateway Error

## What 502 Bad Gateway Means

A 502 error means CapRover can't reach your backend server. This usually means:
- The server crashed during startup
- The server is not running
- There's a configuration issue

## Step 1: Check CapRover Backend Logs

1. Go to CapRover Dashboard
2. Open your backend app (`fantabuild-api`)
3. Click on **"App Logs"** tab
4. Look for error messages

### Common Errors to Look For:

#### Database Connection Error
```
Error: connect ECONNREFUSED
Error: getaddrinfo ENOTFOUND postgres.captain.local
```
**Fix:** Check your `DATABASE_URL` or database environment variables in CapRover

#### Missing Environment Variable
```
ReferenceError: process.env.XXX is not defined
```
**Fix:** Add the missing environment variable in CapRover

#### Port Already in Use
```
Error: Port 3001 is already in use
```
**Fix:** Check if another instance is running, or change PORT in CapRover

#### Database Schema Error
```
error: relation "users" does not exist (Postgres code 42P01)
```
**Fix:** The server should auto-create tables, but check database connection

## Step 2: Verify Environment Variables

In CapRover → Backend App → App Configs → Environment Variables, ensure you have:

### Required Variables:
```env
# Database (choose one method)
DATABASE_URL=postgresql://user:password@host:port/database
# OR
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Frontend URL (for CORS)
FRONTEND_URL=https://fantabuild.addispos.com

# API Keys
GEMINI_API_KEY=your-gemini-api-key

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Server Port (usually set automatically by CapRover)
PORT=3001
```

## Step 3: Check Server Startup

The server should log these messages on successful startup:
```
🚀 Fanta Build server running on 0.0.0.0:3001
🔒 CORS allowed origins: [ 'https://fantabuild.addispos.com' ]
🔄 Ensuring database schema...
✅ Schema ensured
🔄 Ensuring permanent admin account...
✅ Permanent admin account ready
```

If you don't see these, the server crashed before completing startup.

## Step 4: Test Database Connection

If using CapRover's postgres app, verify the connection:

```bash
# SSH into your CapRover server
docker exec -it srv-captain--postgres psql -U your-user -d your-database
```

Or test from within the backend container:
```bash
# In CapRover, go to backend app → Terminal
# Then test connection
psql $DATABASE_URL -c "SELECT 1;"
```

## Step 5: Check CapRover App Configuration

1. **HTTP Settings:**
   - Verify domain `api-staging.addispos.com` is configured
   - Check SSL certificate is valid
   - Ensure port mapping is correct

2. **App Settings:**
   - Verify the app is set to "Running"
   - Check if there are any deployment errors
   - Look at "Deployment" tab for build errors

## Step 6: Redeploy Backend

If all else fails, try redeploying:

```bash
./deploy-backend.sh
```

Or manually:
1. Go to CapRover → Backend App
2. Click "Deploy" or trigger a new deployment
3. Watch the logs for errors

## Step 7: Common Fixes

### Fix 1: Database Connection String
If using `DATABASE_URL`, ensure it's in the correct format:
```
postgresql://username:password@host:port/database
```

### Fix 2: Redis Connection (Optional)
If you see Redis errors, they're usually non-fatal. The server will use memory store instead.

### Fix 3: Missing Dependencies
Check if `package.json` has all required dependencies and they're installed during Docker build.

### Fix 4: Port Configuration
CapRover usually sets `PORT` automatically. Don't override it unless necessary.

## Quick Diagnostic Commands

### Check if server is responding (from CapRover server):
```bash
curl http://localhost:3001/health
```

### Check backend container status:
```bash
docker ps | grep fantabuild-api
```

### View recent logs:
```bash
docker logs srv-captain--fantabuild-api --tail 100
```

## Still Not Working?

1. **Share the backend logs** from CapRover (last 50-100 lines)
2. **Check the deployment logs** in CapRover
3. **Verify all environment variables** are set correctly
4. **Test database connectivity** separately

The logs will tell you exactly what's wrong!
