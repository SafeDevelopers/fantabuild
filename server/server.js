/**
 * Fanta Build Backend Server
 * Handles payments, webhooks, and Gemini API calls
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import expressSession from 'express-session';
import RedisStore from 'connect-redis';
import { createClient as createRedisClient } from 'redis';

import pool from './db.js';
import * as auth from './auth.js';
import * as creationsDb from './creations-db.js';
import * as adminDb from './admin.js';
import { PAYMENT_GATEWAYS, createPaymentSession, verifyPaymentCallback, getAvailableGateways } from './payment-gateways.js';
import * as credits from './credits.js';
import * as migrations from './migrations.js';

// Load environment variables from server directory
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

/**
 * -------------------------
 * CORS (single source of truth)
 * -------------------------
 */
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://fantabuild.addispos.com').trim();
const allowedOrigins = [
  FRONTEND_URL,
  'https://fantabuild.addispos.com',
].filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

function isAllowedOrigin(origin) {
  if (!origin) return true; // allow non-browser requests (curl/healthchecks)
  return uniqueOrigins.includes(origin) || (
    process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')
  );
}

console.log('🔒 CORS allowed origins:', uniqueOrigins);

// CORS configuration - must match frontend credentials mode
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('⚠️  CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  // Frontend uses credentials: 'include', so we must set this to true
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Ensure preflight always responds with the same CORS config
app.options('*', cors(corsOptions));

/**
 * -------------------------
 * Body parsers
 * IMPORTANT: do NOT use express.raw globally (breaks JSON routes)
 * -------------------------
 */
app.use(express.json({ limit: '10mb' }));

/**
 * -------------------------
 * Redis + Session (optional)
 * -------------------------
 */
let redisClient = null;
let redisStore = null;

const hasRedis = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
if (hasRedis) {
  try {
    // Prefer REDIS_URL if provided
    if (process.env.REDIS_URL) {
      redisClient = createRedisClient({ url: process.env.REDIS_URL });
    } else {
      // Otherwise use socket config
      redisClient = createRedisClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT || 6379),
        },
      });
    }

    redisClient.on('error', (e) => console.warn('⚠️ Redis error:', e?.message || e));
    await redisClient.connect();

    redisStore = new RedisStore({ client: redisClient });
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️  Redis connection failed:', error?.message || error);
    redisClient = null;
    redisStore = null;
  }
} else {
  console.warn('⚠️  Redis not configured. Sessions will use memory store.');
}

// If you are using only Bearer tokens, you can remove sessions entirely.
// Keeping it here, but cookie options are safe defaults.
app.use(expressSession({
  store: redisStore || undefined,
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // If you ever need cross-site cookies, set:
    // sameSite: 'none',
  },
}));

/**
 * -------------------------
 * Stripe + Gemini init
 * -------------------------
 */
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Payment features disabled.');
}

const GEMINI_MODEL = 'gemini-3-pro-preview';
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('⚠️  GEMINI_API_KEY not set. Generation features disabled.');
}

/**
 * -------------------------
 * Auth middleware
 * -------------------------
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = auth.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    const user = await auth.getUserById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { ...decoded, role: user.role };
    next();
  } catch (e) {
    console.error('Auth middleware error:', e);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

/**
 * -------------------------
 * Health check
 * -------------------------
 */
// Health check endpoint - must respond quickly for CapRover
// This endpoint is critical - it must always respond so CapRover knows the server is alive
app.get('/health', async (req, res) => {
  // Always set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Quick database check with timeout
    const dbCheck = Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
    ]);
    
    await dbCheck;
    res.json({
      status: 'ok',
      database: 'connected',
      redis: redisClient?.isOpen ? 'connected' : 'not configured',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Still return 200 OK even if database is down - server is running
    // CapRover just needs to know the server process is alive
    res.status(200).json({ 
      status: 'ok', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * -------------------------
 * Asset proxy (server-side fetch to avoid GCS CORS)
 * -------------------------
 */
app.get('/api/assets/:name', async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || !/^[a-zA-Z0-9_-]+\.json$/.test(name)) {
      return res.status(400).json({ error: 'Invalid asset name. Must be a JSON filename.' });
    }

    const gcsUrl = `https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/${name}`;
    console.log(`📦 Fetching asset from GCS: ${name}`);

    const response = await fetch(gcsUrl, { headers: { 'User-Agent': 'FantaBuild-Backend/1.0' } });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch asset',
        details: `GCS returned ${response.status}: ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(data);
  } catch (error) {
    console.error('Asset proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch asset', details: error.message });
  }
});

/**
 * -------------------------
 * Auth endpoints
 * -------------------------
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingUser = await auth.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = await auth.createUser(email, password);
    const token = auth.generateToken(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
        role: user.role || 'user',
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (auth.isPermanentAdmin(email, password)) {
      const admin = await auth.ensurePermanentAdmin();
      if (!admin) return res.status(500).json({ error: 'Failed to initialize admin account' });

      const token = auth.generateToken(admin.id, admin.email);
      return res.json({
        user: { id: admin.id, email: admin.email, subscription_status: admin.subscription_status || 'pro', role: 'admin' },
        token,
      });
    }

    const user = await auth.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await auth.verifyPassword(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = auth.generateToken(user.id, user.email);
    res.json({
      user: { id: user.id, email: user.email, subscription_status: user.subscription_status, role: user.role || 'user' },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await auth.getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      role: user.role || 'user',
      daily_usage_count: user.daily_usage_count,
      plan: user.plan || 'FREE',
      credits: user.credits ?? null,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * -------------------------
 * Billing & Checkout Endpoints
 * -------------------------
 */

// One-off credit purchase ($3.99)
app.post('/api/billing/checkout/one-off', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const amount = 399; // $3.99 in cents
    
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '1 Credit - FantaBuild',
              description: '1 credit for downloading generated content',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/payment-cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        type: 'one-off',
        credits: '1',
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating one-off checkout:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// Pro subscription checkout ($29.99/month)
app.post('/api/billing/checkout/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const amount = 2999; // $29.99 in cents
    
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Subscription - FantaBuild',
              description: 'Pro subscription with 40 credits per month',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://fantabuild.addispos.com'}/payment-cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        type: 'subscription',
        credits: '40',
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription session' });
  }
});

/**
 * -------------------------
 * (Keep your remaining routes as-is)
 * NOTE: Stripe webhook must be RAW for signature verification
 * -------------------------
 */

// Stripe webhook must come BEFORE any JSON parser ONLY for this route.
// We already used express.json globally, so we need raw ONLY on this route:
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).send('Webhook secret not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ... keep your existing webhook processing logic here (unchanged) ...
  return res.json({ received: true });
});

/**
 * -------------------------
 * Start server + initialization
 * -------------------------
 */
// Start server immediately - don't wait for async initialization
// This ensures CapRover can reach the server even if initialization fails
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Fanta Build server running on ${HOST}:${PORT}`);
  console.log(`📝 Health check: /health`);
  console.log(`🔐 Admin API: /api/admin/*`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'DATABASE_URL set' : 'Using DB_* vars'}`);
  console.log(`✅ Server is listening and ready to accept connections`);
  
  // Run initialization asynchronously (don't block server startup)
  (async () => {
    try {
      console.log('🔄 Ensuring database schema...');
      await migrations.ensureSchema();
      console.log('✅ Schema ensured');

      console.log('🔄 Ensuring permanent admin account...');
      const admin = await auth.ensurePermanentAdmin();
      if (admin) console.log('✅ Permanent admin account ready');
      else console.error('⚠️  Could not initialize permanent admin account');
      
      console.log('✅ Server initialization complete');
    } catch (err) {
      console.error('❌ Initialization error:', err?.message || err);
      console.error('❌ Error stack:', err?.stack);
      if (err?.code === '42P01') {
        console.error('❌ Database table missing. Check database connection and schema.');
        // Don't exit - let health endpoint show the error
      }
      // Don't exit on other errors - let the server try to run
      console.error('⚠️  Continuing despite initialization error...');
    }
  })();
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err.message);
  console.error('❌ Error code:', err.code);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Try setting PORT environment variable to a different port.`);
  } else {
    console.error('❌ Full error:', err);
  }
  process.exit(1);
});

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('❌ Stack:', err.stack);
  // Don't exit - let the server try to recover
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  // Don't exit - let the server try to recover
});