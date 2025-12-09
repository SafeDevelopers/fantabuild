# Quick Test Guide - Admin Dashboard

## Option 1: Direct Access (Quick Test)

You can access the admin dashboard directly, but it will show an error if you're not an admin:

1. **Start the frontend:**
   ```bash
   pnpm dev
   ```

2. **Open in browser:**
   - Go to: `http://localhost:3000/admin`
   - You'll see "Access Denied" if you're not an admin

## Option 2: Set Up Admin Account (Full Test)

### Step 1: Make Sure Database Has Role Column

If you haven't run the updated schema, run this migration:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U postgres -d fantabuild

# Or if using different credentials
psql -h your-db-host -U your-db-user -d fantabuild
```

Then run:
```sql
-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
```

Or use the migration file:
```bash
psql -h localhost -U postgres -d fantabuild -f database/add-role-column.sql
```

### Step 2: Create a Test User (if you don't have one)

1. **Start the frontend:**
   ```bash
   pnpm dev
   ```

2. **Sign up:**
   - Go to `http://localhost:3000`
   - Click "Sign In" → "Don't have an account? Sign up"
   - Create an account (e.g., `admin@test.com` / `password123`)

### Step 3: Make Your Account Admin

**Option A: Via SQL (Recommended)**
```bash
psql -h localhost -U postgres -d fantabuild
```

```sql
-- Check your user
SELECT id, email, role FROM users;

-- Make yourself admin (replace with your email)
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- Verify
SELECT email, role FROM users WHERE email = 'admin@test.com';
```

**Option B: Via Backend Script (Quick)**

Create a temporary script to make yourself admin:

```bash
cd server
node -e "
import('./db.js').then(async ({ default: pool }) => {
  const result = await pool.query(\"UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com' RETURNING email, role\");
  console.log('Updated:', result.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"
```

### Step 4: Sign In and Access Admin

1. **Sign out** (if already signed in) and **sign in again** to refresh your token
2. You should now see an **"Admin"** button in the top right corner
3. Click **"Admin"** or go to `http://localhost:3000/admin`
4. You'll see the admin dashboard!

## Quick Test Without Database

If you want to test the UI without setting up the database:

1. **Start frontend:**
   ```bash
   pnpm dev
   ```

2. **Go directly to:**
   ```
   http://localhost:3000/admin
   ```

3. You'll see the dashboard UI, but it will show "Access Denied" since you're not authenticated as admin

## Troubleshooting

### "Access Denied" Error
- Your account doesn't have `role = 'admin'`
- Sign out and sign in again after updating your role
- Check database: `SELECT role FROM users WHERE email = 'your-email';`

### No "Admin" Button
- Your user role is not set to 'admin'
- Refresh the page after updating role
- Check browser console (F12) for errors

### Can't Connect to Database
- Make sure PostgreSQL is running
- Check your `server/.env` has correct DB credentials
- Test connection: `psql -h localhost -U postgres -d fantabuild`

### Frontend Not Starting
```bash
# Make sure you're in the root directory
cd /Users/deldil/Desktop/fanta-build
pnpm dev
```

## Testing Checklist

- [ ] Frontend running (`pnpm dev`)
- [ ] Backend running (`cd server && pnpm dev`)
- [ ] Database has `role` column
- [ ] User account created
- [ ] User role set to 'admin' in database
- [ ] Signed in to the app
- [ ] See "Admin" button in top right
- [ ] Can access `/admin` route
- [ ] Dashboard loads without errors

