# Frontend Environment Variables for CapRover

Copy these variables to CapRover → `fantabuild-frontend` → App Configs → Environment Variables

Replace all placeholder values with your actual values.

---

## Frontend Environment Variables

```env
# Backend API URL
# This is the URL where your backend API is hosted
# For CapRover: https://api.yourdomain.com
# For local development: http://localhost:3001
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## Complete Frontend .env File

```env
# ============================================
# API CONFIGURATION
# ============================================
# Backend API base URL
# Replace 'yourdomain.com' with your actual domain
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## How to Add in CapRover

1. Go to CapRover Dashboard
2. Select your frontend app: `fantabuild-frontend`
3. Go to **"App Configs"** → **"Environment Variables"**
4. Click **"Add New Variable"**
5. Variable name: `VITE_API_BASE_URL`
6. Variable value: `https://api.yourdomain.com` (replace with your actual backend domain)
7. Click **"Save & Update"**
8. **Important:** Rebuild the app after adding this variable (CapRover will do this automatically)

---

## Important Notes

- **Only one variable needed** for frontend: `VITE_API_BASE_URL`
- Replace `yourdomain.com` with your actual domain
- Use `https://` for production (not `http://`)
- The frontend must be rebuilt after adding this variable
- In CapRover, the app will automatically rebuild when you save environment variables

---

## Example Values

**Production:**
```env
VITE_API_BASE_URL=https://api.fantabuild.com
```

**Staging:**
```env
VITE_API_BASE_URL=https://api-staging.fantabuild.com
```

**Local Development:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## Verification

After setting the environment variable and rebuilding:

1. Open your frontend in browser: `https://yourdomain.com`
2. Open browser console (F12)
3. Check Network tab - API calls should go to `https://api.yourdomain.com`
4. No CORS errors should appear

---

## Troubleshooting

### Frontend Can't Connect to Backend

- Verify `VITE_API_BASE_URL` is correct
- Check backend is accessible: `curl https://api.yourdomain.com/health`
- Verify CORS is configured in backend (should allow frontend domain)
- Check browser console for errors

### Environment Variable Not Working

- Make sure variable name starts with `VITE_`
- Rebuild the frontend app after adding the variable
- Check CapRover build logs for errors
- Verify the variable is set in CapRover dashboard

---

## Why Only One Variable?

The frontend only needs to know where the backend API is located. All other configuration (API keys, database, etc.) is handled by the backend for security reasons.
