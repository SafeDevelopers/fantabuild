# How to Run the Credits Migration

This guide shows you how to run the `credits-schema.sql` migration to add the credits and pricing system to your database.

## Method 1: Using psql Command Line (Recommended)

If you have PostgreSQL installed locally and have `psql` in your PATH:

```bash
# From the project root directory
cd database

# Run the migration (replace with your actual credentials)
psql -h localhost -U deldil -d fantabuild -f credits-schema.sql

# If you have a password, you'll be prompted for it
# Or set PGPASSWORD environment variable:
PGPASSWORD=your_password psql -h localhost -U deldil -d fantabuild -f credits-schema.sql
```

**For CapRover/Production:**
```bash
# Connect to your CapRover database
psql -h your-db-host -U your-db-user -d fantabuild -f credits-schema.sql
```

## Method 2: Using Node.js Script (Easiest)

I've created a script that reads your `.env` file and runs the migration automatically:

```bash
# From the project root directory
cd database
node run-migration.js
```

This script will:
- Read database credentials from `../server/.env`
- Connect to your database
- Run the migration
- Show success/error messages

## Method 3: Using Database GUI Tools

### pgAdmin
1. Open pgAdmin
2. Connect to your database server
3. Right-click on your database (`fantabuild`)
4. Select "Query Tool"
5. Open `credits-schema.sql` file
6. Click "Execute" (F5) or press the play button

### DBeaver
1. Open DBeaver
2. Connect to your database
3. Right-click on your database → "SQL Editor" → "New SQL Script"
4. Copy and paste the contents of `credits-schema.sql`
5. Click "Execute SQL Script" (Ctrl+Alt+X)

### TablePlus / Postico
1. Connect to your database
2. Open a new query window
3. Copy and paste the contents of `credits-schema.sql`
4. Execute the query

## Method 4: Using Docker (if your DB is in Docker)

```bash
# Copy the migration file into the container
docker cp database/credits-schema.sql container_name:/tmp/

# Execute it
docker exec -i container_name psql -U deldil -d fantabuild < /tmp/credits-schema.sql
```

## Method 5: Direct SQL Execution

If you have direct database access, you can copy the SQL from `credits-schema.sql` and run it directly in your database console.

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan', 'credits', 'pro_since', 'pro_until');

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('credit_transactions', 'payments');

-- Check existing users have credits
SELECT id, email, plan, credits FROM users LIMIT 5;
```

## Troubleshooting

### Error: "relation 'users' does not exist"
- Make sure you've run the base schema first: `database/postgres-schema.sql`

### Error: "permission denied"
- Make sure your database user has CREATE TABLE and ALTER TABLE permissions

### Error: "column already exists"
- The migration uses `IF NOT EXISTS`, so this shouldn't happen, but if it does, the migration is safe to run multiple times

### Error: "function update_updated_at_column() does not exist"
- Make sure you've run `database/postgres-schema.sql` first, which creates this function

## What the Migration Does

1. ✅ Adds `plan`, `credits`, `pro_since`, `pro_until` columns to `users` table
2. ✅ Creates `credit_transactions` table for tracking credit changes
3. ✅ Creates `payments` table for payment records
4. ✅ Creates indexes for better performance
5. ✅ Sets up triggers to auto-initialize new users with 3 free credits
6. ✅ Updates existing users to have FREE plan and 3 credits

## After Migration

1. Restart your server to ensure it picks up the new schema
2. Test by creating a new user account - they should get 3 free credits
3. Check the `/api/credits/balance` endpoint to verify credits are working
