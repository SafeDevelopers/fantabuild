# Troubleshooting "Failed to fetch" Login Error

## Quick Checks

### 1. **Verify Frontend API URL**
Check your browser console (F12) and look for:
- What URL is being called? Should be: `https://api-staging.addispos.com/api/auth/signin`
- Any CORS errors in the console?

### 2. **Backend CORS Configuration**
Your backend needs `FRONTEND_URL` set in CapRover environment variables:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

**Important:** This should be your **frontend domain**, not the API domain.

### 3. **Test API Connectivity**
Open your browser and try to access:
```
https://api-staging.addispos.com/health
```

If this doesn't work, the backend is not accessible.

### 4. **Check Backend Logs**
In CapRover, check your backend app logs for:
- CORS warnings
- Connection errors
- Database connection issues

## Common Issues & Fixes

### Issue 1: CORS Error
**Symptom:** Browser console shows "CORS policy" error

**Fix:**
1. Go to CapRover → Your Backend App → App Configs → Environment Variables
2. Add/Update: `FRONTEND_URL=https://your-frontend-domain.com`
3. Redeploy backend

### Issue 2: API Not Accessible
**Symptom:** Network error, can't reach API

**Fix:**
1. Verify backend is running in CapRover
2. Check domain DNS is pointing correctly
3. Verify SSL certificate is valid

### Issue 3: Wrong API URL
**Symptom:** 404 or connection refused

**Fix:**
1. Verify frontend `.env` has: `VITE_API_BASE_URL=https://api-staging.addispos.com`
2. Rebuild frontend after changing `.env`
3. Clear browser cache

### Issue 4: SSL Certificate Issues
**Symptom:** Mixed content or certificate errors

**Fix:**
1. Ensure both frontend and backend use HTTPS
2. Check SSL certificates in CapRover
3. Verify domain DNS records

## Debug Steps

1. **Open Browser Console (F12)**
   - Look for the exact error message
   - Check Network tab to see the failed request

2. **Check Request Details:**
   - URL being called
   - Response status
   - CORS headers

3. **Test with curl:**
   ```bash
   curl -X POST https://api-staging.addispos.com/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@fantabuild.com","password":"Adimin1971@"}'
   ```

4. **Verify Environment Variables:**
   - Frontend: `VITE_API_BASE_URL`
   - Backend: `FRONTEND_URL`

## Quick Fix Checklist

- [ ] Backend is running in CapRover
- [ ] `FRONTEND_URL` is set in backend `.env` (your frontend domain)
- [ ] `VITE_API_BASE_URL` is set in frontend `.env` (your API domain)
- [ ] Both domains have valid SSL certificates
- [ ] DNS records are correct
- [ ] Backend logs show no errors
- [ ] Browser console shows detailed error (check Network tab)
