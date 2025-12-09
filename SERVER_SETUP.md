# Server Setup - Quick Fix

## Issue: Database Not Connected

Your server is running but can't connect to the database. You need to create a `server/.env` file with your database credentials.

## Quick Setup

### Step 1: Create `.env` file in `server/` directory

```bash
cd server
cp .env.example .env
```

### Step 2: Edit `server/.env` with your database credentials

**For Local PostgreSQL:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Redis (optional for now)
# REDIS_URL=redis://localhost:6379

# Auth (generate with: openssl rand -base64 32)
SESSION_SECRET=change-this-to-random-secret
JWT_SECRET=change-this-to-random-secret
JWT_EXPIRES_IN=7d

# API Keys (optional for now, but needed for full functionality)
# GEMINI_API_KEY=your_key_here
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Set Up PostgreSQL Database

**If you don't have PostgreSQL installed:**

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Or use Docker:**
```bash
docker run --name fantabuild-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=fantabuild \
  -p 5432:5432 \
  -d postgres:14
```

**Create database and user:**
```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL:
CREATE DATABASE fantabuild;
CREATE USER fantabuild_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fantabuild TO fantabuild_user;
\q
```

**Run the schema:**
```bash
psql -U postgres -d fantabuild -f database/postgres-schema.sql
```

### Step 4: Restart Server

After creating `.env` file:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd server
pnpm dev
```

### Step 5: Verify

Check health endpoint:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","database":"connected","redis":"not configured"}
```

## Quick Test Without Database

If you just want to test the admin UI without database:

1. The server will still run (with warnings)
2. You can access `http://localhost:3000/admin`
3. It will show "Access Denied" but you can see the UI

## Troubleshooting

### "Database disconnected"
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Verify credentials in `server/.env`
- Check database exists: `psql -U postgres -l | grep fantabuild`

### "Port already in use"
- Find process: `lsof -ti:3001`
- Kill it: `kill -9 $(lsof -ti:3001)`
- Or change PORT in `.env`

### "Cannot connect to database"
- Check DB_HOST is correct (localhost or IP)
- Check DB_PORT is 5432
- Check firewall isn't blocking
- Try: `psql -h localhost -U postgres -d fantabuild`

