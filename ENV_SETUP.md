# Environment Variables Setup Guide

This guide explains all environment variables needed for Fanta Build.

## Frontend (.env)

Located in the root directory. Only one variable needed:

```env
VITE_API_BASE_URL=http://localhost:3001
```

**For Production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Backend (server/.env)

Located in the `server` directory. See `server/.env.example` for the complete template.

### Required Variables

#### Server Configuration
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (production/development)
- `FRONTEND_URL` - Your frontend URL for CORS

#### PostgreSQL Database
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - Use SSL connection (true/false)

#### Redis
Choose one option:

**Option 1: Redis URL (Recommended)**
- `REDIS_URL` - Full Redis connection string

**Option 2: Individual Settings**
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if required)

#### Authentication & Security
- `SESSION_SECRET` - Random secret for sessions (generate with: `openssl rand -base64 32`)
- `JWT_SECRET` - Random secret for JWT tokens (generate with: `openssl rand -base64 32`)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

#### API Keys
- `GEMINI_API_KEY` - Google Gemini API key (required for all AI generation)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)

#### PayPal (Optional)
- `PAYPAL_CLIENT_ID` - PayPal Client ID from PayPal Developer Dashboard
- `PAYPAL_CLIENT_SECRET` - PayPal Client Secret from PayPal Developer Dashboard
- `PAYPAL_MODE` - PayPal mode: `sandbox` (for testing) or `live` (for production). Default: `sandbox`

#### Permanent Admin Account
- `ADMIN_EMAIL` - Permanent admin email (default: `admin@fantabuild.com`)
- `ADMIN_PASSWORD` - Permanent admin password (default: `Adimin1971@`)

**Note:** The permanent admin account is automatically created/updated on server start. You can change these values in `.env` if needed.

## Generating Secrets

To generate secure random secrets:

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

Or use an online generator: https://randomkeygen.com/

## CapRover Setup

1. Copy `server/.env.example` to reference
2. In CapRover dashboard, go to your app
3. Click "App Configs" > "Environment Variables"
4. Add each variable from the example file
5. Fill in your actual values (passwords, keys, etc.)
6. Click "Save & Update"

## Security Notes

- ⚠️ **Never commit `.env` files to git**
- ⚠️ **Use different secrets for production**
- ⚠️ **Keep database passwords secure**
- ⚠️ **Use strong, random secrets**
- ⚠️ **Enable SSL for production databases**

## Testing Locally

1. Copy `.env.example` to `.env` in root directory
2. Copy `server/.env.example` to `server/.env`
3. Fill in your local values
4. Start servers:
   ```bash
   # Terminal 1: Backend
   cd server
   pnpm dev
   
   # Terminal 2: Frontend
   pnpm dev
   ```

## Production Checklist

- [ ] All environment variables set in CapRover
- [ ] Secrets are random and secure
- [ ] Database credentials are correct
- [ ] Redis connection is working
- [ ] API keys are valid
- [ ] Frontend URL matches your domain
- [ ] SSL enabled for database (if external)

