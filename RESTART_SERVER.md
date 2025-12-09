# How to Restart Server with New Database Config

## The Problem
Your server is still using old environment variables (trying to connect as "postgres" user). The `.env` file is correct, but the server needs to be restarted to load the new values.

## Solution: Restart the Server

### Step 1: Find and Stop the Running Server

**Option A: If server is running in a terminal:**
- Go to the terminal where the server is running
- Press `Ctrl+C` to stop it

**Option B: If you don't know which terminal:**
```bash
# Find the process
ps aux | grep "node.*server.js"

# Kill it (replace PID with the number you see)
kill -9 <PID>
```

**Option C: Kill by port:**
```bash
# Find process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Step 2: Verify .env File is Correct

```bash
cd server
cat .env | grep DB_USER
```

Should show: `DB_USER=deldil`

### Step 3: Restart the Server

```bash
cd server
pnpm dev
```

You should see:
```
✅ Connected to PostgreSQL database
🚀 Fanta Build server running on port 3001
```

### Step 4: Test the Connection

In a new terminal:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","database":"connected","redis":"not configured"}
```

## If Still Not Working

1. **Check .env file location:**
   ```bash
   cd server
   ls -la .env
   ```
   Should exist in `server/.env`

2. **Verify database user:**
   ```bash
   psql -d fantabuild -c "SELECT current_user;"
   ```
   Should show: `deldil`

3. **Test database connection manually:**
   ```bash
   psql -h localhost -U deldil -d fantabuild -c "SELECT 1;"
   ```
   Should work without password

4. **Check server logs:**
   Look for "Connected to PostgreSQL database" message when server starts

## Quick Restart Command

```bash
# Kill old server
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start new server
cd server && pnpm dev
```

