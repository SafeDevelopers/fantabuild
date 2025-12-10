# Backend Environment Variables for CapRover

Copy these variables to CapRover → `fantabuild-api` → App Configs → Environment Variables

Replace all placeholder values with your actual values.

---

## Server Configuration

```env
# Server port (default: 3001)
PORT=3001

# Environment: production or development
NODE_ENV=production

# Frontend URL (for CORS and payment redirects)
# Replace with your actual frontend domain (e.g., https://addispos.com)
FRONTEND_URL=https://addispos.com
```

---

## Database Configuration (PostgreSQL)

```env
# Database host
# For CapRover one-click PostgreSQL: postgres.captain.local
# For external database: your-db-host.com
DB_HOST=postgres.captain.local

# Database port (default: 5432)
DB_PORT=5432

# Database name
DB_NAME=fantabuild

# Database user
DB_USER=fantabuild_user

# Database password
DB_PASSWORD=your_secure_database_password_here

# Use SSL connection (true/false)
# Set to true for external databases, false for local/CapRover
DB_SSL=false
```

---

## Redis Configuration (Optional but Recommended)

**Option 1: Using Redis URL (Recommended)**
```env
# Full Redis connection URL
# For CapRover one-click Redis: redis://redis.captain.local:6379
REDIS_URL=redis://redis.captain.local:6379
```

**Option 2: Using Individual Settings**
```env
# Redis host
# For CapRover one-click Redis: redis.captain.local
REDIS_HOST=redis.captain.local

# Redis port (default: 6379)
REDIS_PORT=6379

# Redis password (if required, leave empty if not)
REDIS_PASSWORD=
```

**Note:** If you don't set Redis, sessions will use memory store (not recommended for production).

---

## Authentication & Security

```env
# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_session_secret_here_generate_with_openssl_rand_base64_32

# JWT secret for token signing
JWT_SECRET=OfeElCB37XqXjtIqjx6X/VJNOdGrX9tUrKgCPVg9XaU=

# JWT token expiration (default: 7d)
# Options: 1h, 24h, 7d, 30d, etc.
JWT_EXPIRES_IN=7d
```

---

## API Keys

```env
# Google Gemini API Key (REQUIRED for AI generation)
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Stripe Payment Configuration

```env
# Stripe Secret Key
# Test: sk_test_...
# Live: sk_live_...
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here

# Stripe Webhook Signing Secret
# Get from: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

---

## PayPal Payment Configuration (Optional)

```env
# PayPal Client ID
# Get from: https://developer.paypal.com/
PAYPAL_CLIENT_ID=your_paypal_client_id_here

# PayPal Client Secret
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# PayPal Mode: sandbox (testing) or live (production)
PAYPAL_MODE=sandbox
```

---

## Ethiopian Payment Gateways (Optional)

### TeleBirr Configuration

```env
# TeleBirr App ID
TELEBIRR_APP_ID=your_telebirr_app_id_here

# TeleBirr App Key
TELEBIRR_APP_KEY=your_telebirr_app_key_here

# TeleBirr Short Code
TELEBIRR_SHORT_CODE=your_telebirr_short_code_here

# TeleBirr API URL (default: https://api.telebirr.et)
TELEBIRR_API_URL=https://api.telebirr.et

# TeleBirr Public Key (for verification)
TELEBIRR_PUBLIC_KEY=your_telebirr_public_key_here
```

### CBE (Commercial Bank of Ethiopia) Configuration

```env
# CBE Merchant ID
CBE_MERCHANT_ID=your_cbe_merchant_id_here

# CBE Merchant Key
CBE_MERCHANT_KEY=your_cbe_merchant_key_here

# CBE API URL (default: https://payment.cbe.com.et/api)
CBE_API_URL=https://payment.cbe.com.et/api
```

---

## Permanent Admin Account

```env
# Admin email (default: admin@fantabuild.com)
ADMIN_EMAIL=admin@fantabuild.com

# Admin password (default: Adimin1971@)
ADMIN_PASSWORD=Adimin1971@
```

---

## Complete Backend .env File (Copy All Below)

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://addispos.com

# ============================================
# DATABASE CONFIGURATION (PostgreSQL)
# ============================================
DB_HOST=postgres.captain.local
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=fantabuild_user
DB_PASSWORD=your_secure_database_password_here
DB_SSL=false

# ============================================
# REDIS CONFIGURATION (Optional)
# ============================================
REDIS_URL=redis://redis.captain.local:6379
# OR use individual settings:
# REDIS_HOST=redis.captain.local
# REDIS_PORT=6379
# REDIS_PASSWORD=

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
# PAYPAL PAYMENT (Optional)
# ============================================
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox

# ============================================
# TELEBIRR PAYMENT (Optional)
# ============================================
TELEBIRR_APP_ID=your_telebirr_app_id_here
TELEBIRR_APP_KEY=your_telebirr_app_key_here
TELEBIRR_SHORT_CODE=your_telebirr_short_code_here
TELEBIRR_API_URL=https://api.telebirr.et
TELEBIRR_PUBLIC_KEY=your_telebirr_public_key_here

# ============================================
# CBE PAYMENT (Optional)
# ============================================
CBE_MERCHANT_ID=your_cbe_merchant_id_here
CBE_MERCHANT_KEY=your_cbe_merchant_key_here
CBE_API_URL=https://payment.cbe.com.et/api

# ============================================
# PERMANENT ADMIN ACCOUNT
# ============================================
ADMIN_EMAIL=admin@fantabuild.com
ADMIN_PASSWORD=Adimin1971@
```

---

## How to Add in CapRover

1. Go to CapRover Dashboard
2. Select your backend app: `fantabuild-api`
3. Go to **"App Configs"** → **"Environment Variables"**
4. Click **"Add New Variable"** for each variable
5. Copy the variable name and value from above
6. Click **"Save & Update"** after adding all variables

---

## Important Notes

- Replace `addispos.com` with your actual frontend domain if different
- Replace all `your_*_here` placeholders with actual values
- Generate `SESSION_SECRET` with: `openssl rand -base64 32`
- For CapRover one-click apps, use `postgres.captain.local` and `redis.captain.local`
- For external databases, use the actual hostname/IP
- Set `DB_SSL=true` for external databases with SSL
- Set `PAYPAL_MODE=live` for production PayPal
- Keep `JWT_SECRET` secure and don't change it after users are registered

---

## Required vs Optional Variables

**Required:**
- `PORT`, `NODE_ENV`, `FRONTEND_URL`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `SESSION_SECRET`, `JWT_SECRET`
- `GEMINI_API_KEY`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

**Optional (but recommended):**
- `REDIS_URL` or `REDIS_HOST` (for session storage)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (for payments)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (for PayPal payments)
- `TELEBIRR_*` variables (for TeleBirr payments)
- `CBE_*` variables (for CBE payments)
