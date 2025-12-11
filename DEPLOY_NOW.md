# Quick Deploy Instructions

## The Issue
Your frontend is still using old code that tries to fetch from GCS directly. You need to redeploy both frontend and backend.

## Steps to Fix

### 1. Redeploy Backend
```bash
./deploy-backend.sh
```

This will deploy the new `/api/assets/:name` endpoint.

### 2. Redeploy Frontend
```bash
./deploy-frontend.sh
```

This will deploy the new frontend code that uses `/api/assets/:name` instead of direct GCS URLs.

### 3. Verify Environment Variables

**Backend (in CapRover):**
- `FRONTEND_URL=https://fantabuild.addispos.com`

**Frontend (in CapRover):**
- `VITE_API_URL=https://api-staging.addispos.com`

### 4. Wait for Builds to Complete
- Check CapRover dashboard for build status
- Wait for both builds to finish
- Check logs if there are any errors

### 5. Test
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Reload the page
- Check browser console - should see requests to `/api/assets/chess.json` instead of GCS URLs

## What Changed

**Old Code (causing errors):**
- Frontend fetched: `https://storage.googleapis.com/.../chess.json` ❌
- Used endpoint: `/api/examples/proxy?url=...` ❌

**New Code (fixed):**
- Frontend fetches: `/api/assets/chess.json` ✅
- Backend proxies to GCS server-side ✅
- No CORS issues ✅
