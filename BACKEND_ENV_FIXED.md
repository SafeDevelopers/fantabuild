# Backend Environment Variables - Fixed for Your PostgreSQL Setup

Based on your PostgreSQL configuration, here are the correct backend environment variables:

## Database Configuration

```env
# Database host (CapRover one-click PostgreSQL)
DB_HOST=postgres.captain.local

# Database port
DB_PORT=5432

# Database name (needs to be created - see below)
DB_NAME=fantabuild

# Database user (matches your POSTGRES_USER)
DB_USER=fantabuild-user

# Database password (matches your POSTGRES_PASSWORD)
DB_PASSWORD=0a4ff46f4ec6b1ab

# SSL (false for CapRover internal network)
DB_SSL=false
```

---

## Important: Create the Database

Your PostgreSQL is set up with:
- User: `fantabuild-user`
- Password: `0a4ff46f4ec6b1ab`
- Default database: `postgres`

**You need to create the `fantabuild` database.** Here's how:

### Option 1: Via CapRover Terminal

1. Go to CapRover → Your PostgreSQL app → Terminal tab
2. Run:
   ```bash
   psql -U fantabuild-user -d postgres
   ```
3. Enter password when prompted: `0a4ff46f4ec6b1ab`
4. Create database:
   ```sql
   CREATE DATABASE fantabuild;
   ```
5. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE fantabuild TO "fantabuild-user";
   ```
6. Exit: `\q`

### Option 2: Via SSH

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Connect to PostgreSQL container
docker exec -it srv-captain--postgres psql -U fantabuild-user -d postgres

# Enter password: 0a4ff46f4ec6b1ab

# Create database
CREATE DATABASE fantabuild;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fantabuild TO "fantabuild-user";

# Exit
\q
```

### Option 3: One-Line Command

```bash
docker exec -i srv-captain--postgres psql -U fantabuild-user -d postgres << EOF
CREATE DATABASE fantabuild;
GRANT ALL PRIVILEGES ON DATABASE fantabuild TO "fantabuild-user";
EOF
```

---

## Complete Backend Environment Variables

After creating the database, use these in CapRover → `fantabuild-api` → Environment Variables:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://addispos.com

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=postgres.captain.local
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=fantabuild-user
DB_PASSWORD=0a4ff46f4ec6b1ab
DB_SSL=false

# ============================================
# REDIS CONFIGURATION (if using)
# ============================================
REDIS_URL=redis://redis.captain.local:6379

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
SESSION_SECRET=your_session_secret_here_generate_with_openssl_rand_base64_32
JWT_SECRET=OfeElCB37XqXjtIqjx6X/VJNOdGrX9tUrKgCPVg9XaU=
JWT_EXPIRES_IN=7d

# ============================================
# API KEYS
# ============================================
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# STRIPE PAYMENT
# ============================================
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here

# ============================================
# PERMANENT ADMIN ACCOUNT
# ============================================
ADMIN_EMAIL=admin@fantabuild.com
ADMIN_PASSWORD=Adimin1971@
```

---

## After Creating Database: Run Migrations

Once the database is created, run the schemas:

```bash
# Connect to the new database
docker exec -i srv-captain--postgres psql -U fantabuild-user -d fantabuild < /path/to/postgres-schema.sql

docker exec -i srv-captain--postgres psql -U fantabuild-user -d fantabuild < /path/to/credits-schema.sql
```

Or via CapRover terminal:
```bash
psql -U fantabuild-user -d fantabuild
```

Then run:
```sql
\i /path/to/postgres-schema.sql
\i /path/to/credits-schema.sql
```

---

## Quick Fix Summary

1. **Create database:**
   ```sql
   CREATE DATABASE fantabuild;
   GRANT ALL PRIVILEGES ON DATABASE fantabuild TO "fantabuild-user";
   ```

2. **Use these backend env vars:**
   ```env
   DB_HOST=postgres.captain.local
   DB_PORT=5432
   DB_NAME=fantabuild
   DB_USER=fantabuild-user
   DB_PASSWORD=0a4ff46f4ec6b1ab
   DB_SSL=false
   ```

3. **Run migrations** on the `fantabuild` database

---

## Verify Database Connection

Test the connection:

```bash
docker exec -it srv-captain--postgres psql -U fantabuild-user -d fantabuild -c "SELECT version();"
```

Should return PostgreSQL version without errors.
