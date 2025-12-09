# Migration Summary: Supabase → PostgreSQL + Redis

## What Changed

### Backend (Server)
- ✅ **Removed**: Supabase client dependency
- ✅ **Added**: PostgreSQL (`pg`) for database
- ✅ **Added**: Redis for sessions
- ✅ **Added**: Custom JWT authentication
- ✅ **Added**: bcryptjs for password hashing
- ✅ **Updated**: All database operations now use PostgreSQL
- ✅ **Updated**: Auth endpoints (`/api/auth/signup`, `/api/auth/signin`, `/api/auth/me`)
- ✅ **Added**: Creations API endpoints (`/api/creations`)
- ✅ **Updated**: Stripe endpoints to use PostgreSQL

### Frontend
- ✅ **Removed**: Supabase client dependency
- ✅ **Created**: `services/auth-api.ts` - New auth API client
- ✅ **Created**: `services/user-api.ts` - User management API
- ✅ **Created**: `services/creations-api.ts` - Creations API
- ✅ **Updated**: `App.tsx` to use new auth system
- ✅ **Updated**: `AuthModal.tsx` to use new auth API
- ✅ **Updated**: All services to use JWT tokens

### Database
- ✅ **Created**: `database/postgres-schema.sql` - PostgreSQL schema (no Supabase dependencies)
- ✅ **Removed**: Row Level Security (RLS) - handled by backend auth middleware
- ✅ **Added**: `password_hash` column to users table

## New Architecture

```
Frontend (React)
    ↓ JWT Token
Backend API (Express)
    ↓
PostgreSQL (Database)
Redis (Sessions)
```

## Files Created

### Backend
- `server/db.js` - PostgreSQL connection pool
- `server/auth.js` - Authentication utilities (JWT, bcrypt)
- `server/creations-db.js` - Creations database operations
- `server/Dockerfile` - Docker configuration for CapRover
- `server/captain-definition` - CapRover deployment config
- `server/.env.example` - Updated environment variables

### Frontend
- `services/auth-api.ts` - Auth API client
- `services/user-api.ts` - User API client
- `services/creations-api.ts` - Creations API client

### Database
- `database/postgres-schema.sql` - PostgreSQL schema

### Documentation
- `CAPROVER_DEPLOY.md` - Complete CapRover deployment guide

## Environment Variables

### Backend (`server/.env`)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fantabuild
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=your-random-secret
SESSION_SECRET=your-random-secret
JWT_EXPIRES_IN=7d

# API
GEMINI_API_KEY=your_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3001
# No Supabase needed!
```

## Next Steps for Deployment

1. **Set up PostgreSQL** on your Contabo VPS
2. **Set up Redis** on your Contabo VPS
3. **Run database schema**: `psql -f database/postgres-schema.sql`
4. **Deploy to CapRover** following `CAPROVER_DEPLOY.md`
5. **Configure environment variables** in CapRover dashboard
6. **Test the deployment**

## Breaking Changes

- ⚠️ **No Supabase**: All Supabase dependencies removed
- ⚠️ **Auth changed**: Now uses JWT tokens instead of Supabase sessions
- ⚠️ **Database changed**: Direct PostgreSQL instead of Supabase
- ⚠️ **Frontend API**: All API calls now go through your backend

## Benefits

- ✅ **Full control**: Own your database and infrastructure
- ✅ **Cost effective**: No Supabase subscription needed
- ✅ **Scalable**: PostgreSQL + Redis can handle high traffic
- ✅ **CapRover ready**: Easy deployment on your VPS
- ✅ **Secure**: JWT tokens, password hashing, server-side validation

## Testing Locally

1. Install dependencies:
   ```bash
   cd server
   pnpm install
   ```

2. Set up PostgreSQL and Redis locally (or use Docker)

3. Create `.env` file in `server/` directory

4. Run database schema:
   ```bash
   psql -U postgres -d fantabuild -f database/postgres-schema.sql
   ```

5. Start backend:
   ```bash
   cd server
   pnpm dev
   ```

6. Start frontend:
   ```bash
   pnpm dev
   ```

7. Test sign up/sign in at http://localhost:3000

