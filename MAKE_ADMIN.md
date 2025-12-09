# How to Make Yourself Admin

## Step 1: Create a User Account (if you haven't)

1. **Start the frontend** (if not running):
   ```bash
   pnpm dev
   ```

2. **Go to** `http://localhost:3000`

3. **Sign Up**:
   - Click "Sign In" button (top right)
   - Click "Don't have an account? Sign up"
   - Enter your email and password
   - Click "Sign Up"

## Step 2: Make Your Account Admin

**Option A: Using the Script (Easiest)**

```bash
# Replace with your actual email
node test-admin.js your-email@example.com
```

You should see:
```
✅ Successfully updated user to admin:
   Email: your-email@example.com
   Role: admin
```

**Option B: Using SQL Directly**

```bash
psql -d fantabuild
```

Then in PostgreSQL:
```sql
-- Check your email first
SELECT email, role FROM users;

-- Make yourself admin (replace with your email)
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Verify
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

## Step 3: Sign Out and Sign In Again

**Important:** You must sign out and sign in again for the admin role to take effect!

1. **Sign out** from the app
2. **Sign in again** with your email
3. You should now see a purple **"Admin"** button in the top right

## Step 4: Access Admin Dashboard

1. Click the **"Admin"** button, OR
2. Go directly to: `http://localhost:3000/admin`

You should see the admin dashboard with:
- Overview tab (statistics)
- Users tab (manage users)
- Creations tab (manage creations)

## Troubleshooting

### "User not found" error
- Make sure you've created an account first
- Check your email is correct: `psql -d fantabuild -c "SELECT email FROM users;"`

### Admin button not showing
- Sign out and sign in again (this refreshes your token)
- Check your role: `psql -d fantabuild -c "SELECT email, role FROM users WHERE email = 'your-email';"`
- Should show `role = 'admin'`

### Still can't access admin
- Clear browser cache/localStorage
- Check browser console (F12) for errors
- Verify backend is running: `curl http://localhost:3001/health`

## Quick Command Reference

```bash
# List all users
psql -d fantabuild -c "SELECT email, role FROM users;"

# Make user admin
node test-admin.js your-email@example.com

# Check if admin
psql -d fantabuild -c "SELECT email, role FROM users WHERE email = 'your-email@example.com';"
```

