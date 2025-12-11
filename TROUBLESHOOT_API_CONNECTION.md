# Troubleshooting "Cannot connect to API" Error

## Quick Diagnosis Steps

### 1. **Test Backend Health Endpoint**
Open in your browser:
```
https://api-staging.addispos.com/health
```

**Expected:** JSON response like:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "not configured"
}
```

**If this fails:**
- Backend is not running or not accessible
- DNS/SSL issue
- Check CapRover backend app status

### 2. **Test API Endpoint Directly**
Try in browser or curl:
```bash
curl https://api-staging.addispos.com/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Expected:** JSON response (success or error)

### 3. **Check Browser Console**
1. Open DevTools (F12)
2. Go to Network tab
3. Try to create account
4. Look for the failed request
5. Check:
   - Request URL
   - Response status
   - Error message
   - CORS headers (if any)

### 4. **Check CapRover Backend Logs**
1. Go to CapRover Dashboard
2. Open your backend app
3. Check "App Logs"
4. Look for:
   - Server startup messages
   - CORS warnings
   - Database connection errors
   - Any error messages

## Common Issues & Fixes

### Issue 1: Backend Not Running
**Symptom:** Health endpoint returns connection refused or timeout

**Fix:**
1. Check CapRover → Backend App → Is it running?
2. Check deployment status
3. Check server logs for startup errors
4. Redeploy if needed: `./deploy-backend.sh`

### Issue 2: Wrong API URL
**Symptom:** 404 Not Found or wrong domain

**Fix:**
1. Verify frontend env var: `VITE_API_URL=https://api-staging.addispos.com`
2. Check CapRover → Frontend App → Environment Variables
3. Rebuild frontend after changing env var

### Issue 3: SSL Certificate Issue
**Symptom:** `ERR_CERT_AUTHORITY_INVALID` or certificate errors

**Fix:**
1. Check CapRover → Backend App → HTTP Settings
2. Verify SSL certificate is valid
3. Check domain DNS records
4. Ensure domain is properly configured in CapRover

### Issue 4: CORS Blocking
**Symptom:** CORS policy error in console

**Fix:**
1. Check backend env var: `FRONTEND_URL=https://fantabuild.addispos.com`
2. Verify in backend logs: Should see "🔒 CORS configured for origins: ..."
3. Redeploy backend after setting FRONTEND_URL

### Issue 5: Network/Firewall Issue
**Symptom:** Connection timeout or refused

**Fix:**
1. Check if backend port is exposed
2. Check CapRover HTTP Settings
3. Verify domain DNS points to CapRover
4. Check server firewall rules

## Verification Checklist

- [ ] Backend app is running in CapRover
- [ ] `/health` endpoint returns 200 OK
- [ ] `FRONTEND_URL=https://fantabuild.addispos.com` is set in backend
- [ ] `VITE_API_URL=https://api-staging.addispos.com` is set in frontend
- [ ] Frontend was rebuilt after setting VITE_API_URL
- [ ] SSL certificates are valid for both domains
- [ ] DNS records are correct
- [ ] No firewall blocking requests
- [ ] Backend logs show no errors
- [ ] Browser console shows the actual error (not just "Cannot connect")

## Test Commands

### Test Health Endpoint
```bash
curl https://api-staging.addispos.com/health
```

### Test Signup Endpoint
```bash
curl -X POST https://api-staging.addispos.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test from Frontend Domain (Check CORS)
```bash
curl -X POST https://api-staging.addispos.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "Origin: https://fantabuild.addispos.com" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

Look for `Access-Control-Allow-Origin` header in response.
