/**
 * Fanta Build Backend Server
 * Handles Stripe payments, webhooks, and Gemini API calls
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient as createRedisClient } from 'redis';
import pool from './db.js';
import * as auth from './auth.js';
import * as creationsDb from './creations-db.js';
import * as adminDb from './admin.js';
import { PAYMENT_GATEWAYS, createPaymentSession, verifyPaymentCallback, getAvailableGateways } from './payment-gateways.js';
import * as credits from './credits.js';
import * as migrations from './migrations.js';

// Load environment variables - ensure we load from the server directory
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server directory (where this file is located)
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
// Parse PORT correctly (ensure it's a number, not a string like "PORT:3001")
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize Redis
let redisClient = null;
let redisStore = null;
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    redisClient = createRedisClient({
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });
    redisClient.connect().catch(console.error);
    redisStore = new RedisStore({ client: redisClient });
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️  Redis connection failed:', error.message);
  }
} else {
  console.warn('⚠️  Redis not configured. Sessions will use memory store.');
}

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia',
  });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Payment features will be disabled.');
}

// Initialize Gemini AI
const GEMINI_MODEL = 'gemini-3-pro-preview';
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('⚠️  GEMINI_API_KEY not set. Generation features will be disabled.');
}

// Generation mode prompts (same as frontend)
const MODE_PROMPTS = {
  web: `
    **MODE: WEB APPLICATION**
    - Build a modern, responsive full-screen web application.
    - If the input is a sketch, turn it into a working UI.
    - If the input is an object, gamify it or build a utility dashboard.
    - Use modern CSS (Flexbox/Grid), shadows, and gradients.
  `,
  mobile: `
    **MODE: MOBILE PROTOTYPE (iOS/Android)**
    - **CRITICAL**: The output HTML must render a centered container with a max-width of 375px and height of 812px (iPhone X dimensions) to simulate a phone screen. Background of the body should be dark.
    - Create a multi-screen flow (e.g., Login -> Home -> Details).
    - Use JavaScript to hide/show 'screens' (divs) to simulate navigation.
    - Style it like a native app (bottom tab bars, rounded corners, safe areas).
  `,
  social: `
    **MODE: SOCIAL MEDIA (TikTok / Reels / Story)**
    - **CRITICAL**: The output must be a vertical (9:16 aspect ratio) container centered on screen.
    - **ANIMATION IS KEY**: This is not a static page. It is a "Video" built with HTML/CSS.
    - Use CSS @keyframes to animate text flying in, images pulsing, and slide transitions.
    - Create a 15-30 second looped "ad" or "content piece".
    - If selling a product, make it dynamic and flashy.
  `,
  logo: `
    **MODE: LOGO & BRAND IDENTITY**
    - Create a professional Brand Presentation.
    - **Main Focus**: Generate high-quality **Inline SVGs** for logos.
    - Provide 3 Variations:
      1. Minimal/Icon
      2. Wordmark
      3. Abstract/Creative
    - Display them on a "Brand Sheet" with color palette swatches (hex codes) and typography pairing.
    - Make the logos hoverable or animated (CSS) to show polish.
  `,
  video: `
    **MODE: AI VIDEO (Animated HTML/CSS)**
    - **CRITICAL**: Create an animated video-like experience using HTML, CSS, and JavaScript.
    - **ANIMATION IS KEY**: This is a "Video" built with HTML/CSS animations, not a static page.
    - The output must be a container with proper aspect ratio (16:9 for landscape, 9:16 for vertical).
    - Use CSS @keyframes extensively to create smooth, cinematic animations.
    - Create dynamic scenes with:
      * Text animations (fade in, slide, typewriter effects)
      * Image/object animations (zoom, pan, rotate, pulse)
      * Scene transitions (fade, slide, dissolve)
      * Particle effects using CSS (if possible)
    - Make it feel like a real video with continuous motion and transitions.
    - Duration should feel like 15-30 seconds of content when looped.
    - Use JavaScript to control timing and create complex animation sequences.
    - If the input is an image, animate it creatively (zoom, pan, add effects).
    - Make it visually stunning and engaging like a professional video.
  `
};

const BASE_SYSTEM_INSTRUCTION = `You are "Fanta Build", an expert AI Engineer and Product Designer.
Your goal is to take a user request and instantly generate a fully functional, interactive, single-page HTML/JS/CSS artifact.

CORE DIRECTIVES:
1. **NO EXTERNAL IMAGES**: Do NOT use <img src="..."> with external URLs. Use CSS shapes, inline SVGs, Emojis, or CSS gradients.
2. **Self-Contained**: The output must be a single HTML file with embedded CSS (<style>) and JavaScript (<script>).
3. **Robust**: Never return an error. Build *something* fun and functional.
4. **Response Format**: Return ONLY the raw HTML code. Start immediately with <!DOCTYPE html>.
`;

// Middleware
// CORS configuration - allow requests from frontend
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  frontendUrl,
  'https://fantabuild.addispos.com',
  'https://addispos.com',
  // Support both http and https versions
  frontendUrl.replace('http://', 'https://'),
  frontendUrl.replace('https://', 'http://'),
].filter(Boolean);

console.log('🔒 CORS configured for origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    console.warn('⚠️  CORS blocked request from origin:', origin);
    console.warn('   Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For webhook signature verification

// Session middleware
app.use(session({
  store: redisStore || undefined, // Use memory store if Redis not available
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Auth middleware
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.token;
    if (!token) {
      console.error('Auth middleware: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = auth.verifyToken(token);
    if (!decoded) {
      console.error('Auth middleware: Token verification failed', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20),
      });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get full user data including role
    const user = await auth.getUserById(decoded.userId);
    if (!user) {
      console.error('Auth middleware: User not found', { userId: decoded.userId });
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(401).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    await requireAuth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok',
      database: 'connected',
      redis: redisClient?.isOpen ? 'connected' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Example proxy endpoint (to avoid CORS issues when loading examples from external sources)
app.get('/api/examples/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Validate URL is from allowed domains (security)
    const allowedDomains = [
      'storage.googleapis.com',
      'sideprojects-asronline',
    ];
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
    
    if (!isAllowed) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // Fetch the resource
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch resource' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Example proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy example' });
  }
});

/**
 * Authentication endpoints
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await auth.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create user
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
    // Return more specific error message
    const errorMessage = error.message || 'Failed to create account';
    const isDatabaseError = error.code === '42703' || error.code === '42P01' || error.message?.includes('column') || error.message?.includes('relation');
    
    if (isDatabaseError) {
      return res.status(500).json({ 
        error: 'Database schema error. Please run the credits migration: database/credits-schema.sql',
        details: errorMessage 
      });
    }
    
    res.status(500).json({ error: errorMessage || 'Failed to create account' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if this is the permanent admin account
    if (auth.isPermanentAdmin(email, password)) {
      // Ensure admin account exists in database
      const admin = await auth.ensurePermanentAdmin();
      if (!admin) {
        return res.status(500).json({ error: 'Failed to initialize admin account' });
      }
      
      const token = auth.generateToken(admin.id, admin.email);
      
      return res.json({
        user: {
          id: admin.id,
          email: admin.email,
          subscription_status: admin.subscription_status || 'pro',
          role: 'admin',
        },
        token,
      });
    }
    
    // Regular user authentication
    const user = await auth.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await auth.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
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
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await auth.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      role: user.role || 'user',
      daily_usage_count: user.daily_usage_count,
      // Include plan and credits if they exist (from credits schema)
      plan: user.plan || 'FREE',
      credits: user.credits !== undefined ? user.credits : null,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * Creations endpoints
 */
app.get('/api/creations', requireAuth, async (req, res) => {
  try {
    const creations = await creationsDb.getUserCreations(req.user.userId);
    res.json({ creations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch creations' });
  }
});

app.post('/api/creations', requireAuth, async (req, res) => {
  try {
    const { name, html, original_image, mode } = req.body;
    const creation = await creationsDb.createCreation(
      req.user.userId,
      name,
      html,
      original_image,
      mode || 'web'
    );
    res.json(creation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create creation' });
  }
});

app.delete('/api/creations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Verify ownership
    const result = await pool.query(
      'SELECT user_id FROM creations WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creation not found' });
    }
    if (result.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await creationsDb.deleteCreation(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete creation' });
  }
});

app.post('/api/creations/:id/purchase', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Verify ownership
    const result = await pool.query(
      'SELECT user_id FROM creations WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creation not found' });
    }
    if (result.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await creationsDb.markCreationAsPurchased(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as purchased' });
  }
});

app.put('/api/users/subscription', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['free', 'pro'].includes(status)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }
    await auth.updateUserSubscription(req.user.userId, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * Generate content using Gemini AI
 * Checks user credits before generating
 */
app.post('/api/generate', requireAuth, async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured. Please set GEMINI_API_KEY in .env' });
    }

    const { prompt, fileBase64, mimeType, mode } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!prompt && !fileBase64) {
      return res.status(400).json({ error: 'Missing prompt or file' });
    }

    // Verify user exists and check credits
    const user = await auth.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily usage if needed
    await auth.resetDailyUsageIfNeeded(userId);
    
    // Get updated user data
    const updatedUser = await auth.getUserById(userId);

    // Note: Users can always generate - no limit on generation itself
    // Payment is only required for downloads after free trials
    // We still track usage for analytics, but don't block generation

    // Prepare Gemini request
    const parts = [];
    let userInstruction = prompt || '';

    const modeInstruction = MODE_PROMPTS[mode] || MODE_PROMPTS.web;
    let specificPrompt = `${BASE_SYSTEM_INSTRUCTION}\n\n${modeInstruction}\n\n`;

    if (fileBase64) {
      specificPrompt += `USER INPUT CONTEXT: The user has provided an image/file. Analyze it deeply.
      - If it's a sketch, follow its layout for the ${mode}.
      - If it's a photo, extract the vibe/colors/objects for the ${mode}.`;
      
      if (userInstruction && userInstruction.trim().length > 0) {
        specificPrompt += `\nUSER EXTRA INSTRUCTIONS: ${userInstruction}`;
      }
    } else {
      if (!userInstruction || userInstruction.trim().length === 0) {
        userInstruction = `Create a high-quality ${mode} example that shows off your capabilities.`;
      }
      specificPrompt += `\nUSER REQUEST: ${userInstruction}`;
    }

    parts.push({ text: specificPrompt });

    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      });
    }

    // Call Gemini API
    let response;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: parts,
        },
        config: {
          temperature: 0.5,
        },
      });
    } catch (geminiError) {
      // Handle Gemini API quota/rate limit errors
      // Check various error properties that might indicate quota/rate limit
      const isQuotaError = 
        geminiError?.status === 429 || 
        geminiError?.code === 429 ||
        geminiError?.statusCode === 429 ||
        (geminiError?.error?.code === 429) ||
        (geminiError?.message && (
          geminiError.message.includes('quota') || 
          geminiError.message.includes('429') ||
          geminiError.message.includes('RESOURCE_EXHAUSTED') ||
          geminiError.message.includes('exceeded')
        ));
      
      if (isQuotaError) {
        console.error('Gemini API quota exceeded:', {
          status: geminiError?.status || geminiError?.statusCode,
          code: geminiError?.code || geminiError?.error?.code,
          message: geminiError?.message || geminiError?.error?.message,
        });
        return res.status(503).json({
          error: 'API quota exceeded',
          message: 'The Gemini API quota has been exceeded. Please check your Google Cloud billing and quota limits.',
          details: 'This is a temporary issue with the AI service provider. Please try again later or upgrade your Google Cloud plan.',
          type: 'quota_exceeded',
          helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
        });
      }
      
      // Handle other Gemini API errors
      console.error('Gemini API error:', {
        error: geminiError,
        message: geminiError?.message,
        code: geminiError?.code,
        status: geminiError?.status,
      });
      return res.status(500).json({
        error: 'AI service error',
        message: geminiError?.message || geminiError?.error?.message || 'Failed to generate content. The AI service encountered an error.',
        details: 'Please try again in a few moments.',
        type: 'api_error',
      });
    }

    let text = response.text;

    // Safety Fallback: If model refuses or returns nothing
    if (!text || text.trim().length === 0) {
      text = `<!DOCTYPE html>
      <html>
      <body style="background:#111; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center;">
          <div>
              <h1 style="color:#ef4444;">Generation Empty</h1>
              <p>The AI model returned no content. This might be due to safety filters or a service interruption.</p>
              <p style="color:#666; font-size:12px; margin-top:20px;">Try a different prompt or image.</p>
          </div>
      </body>
      </html>`;
    } else {
      // Parse HTML from response
      // 1. Try to find markdown code blocks
      const markdownRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
      const match = text.match(markdownRegex);
      
      if (match && match[1]) {
        text = match[1];
      } else {
        // 2. Try to find <!DOCTYPE html>
        const docTypeIndex = text.indexOf('<!DOCTYPE html>');
        if (docTypeIndex !== -1) {
          text = text.substring(docTypeIndex);
        } else {
          // 3. Try to find <html> tag
          const htmlIndex = text.toLowerCase().indexOf('<html>');
          if (htmlIndex !== -1) {
            text = text.substring(htmlIndex);
          } else {
            // 4. Fallback: Wrap the raw text
            text = `<!DOCTYPE html>
            <html>
            <head>
                <style>body { background: #000; color: #0f0; font-family: monospace; white-space: pre-wrap; padding: 20px; }</style>
            </head>
            <body>
                <h1>Raw Output Received</h1>
                <div>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </body>
            </html>`;
          }
        }
      }
    }

    // Increment usage count
    await auth.incrementDailyUsage(userId);
    const finalUser = await auth.getUserById(userId);

    // Calculate limit for response (for UI display purposes)
    const FREE_DAILY_LIMIT = 3;
    const PRO_DAILY_LIMIT = 20;
    const userLimit = finalUser.subscription_status === 'pro' ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Return generated HTML
    res.json({
      html: text,
      usage: finalUser.daily_usage_count,
      limit: userLimit,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    
    // Check if it's a Gemini API quota error
    if (error?.status === 429 || error?.code === 429 || 
        (error?.message && (error.message.includes('quota') || error.message.includes('429')))) {
      return res.status(503).json({
        error: 'API quota exceeded',
        message: 'The Gemini API quota has been exceeded. Please check your Google Cloud billing and quota limits.',
        details: 'This is a temporary issue with the AI service provider. Please try again later or upgrade your Google Cloud plan.',
        type: 'quota_exceeded',
        helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: error.message || 'Failed to generate content',
      type: 'generation_error',
    });
  }
});

/**
 * Create Stripe Checkout Session for One-Time Purchase
 */
app.post('/api/create-checkout-session', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in .env' });
    }

    const { creationId } = req.body;
    const userId = req.user.userId;

    if (!creationId) {
      return res.status(400).json({ error: 'Missing creationId' });
    }

    // Verify user exists
    const user = await auth.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get creation details
    const result = await pool.query(
      `SELECT id, name, user_id FROM creations WHERE id = $1 AND user_id = $2`,
      [creationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creation not found' });
    }
    const creation = result.rows[0];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fanta Build: ${creation.name}`,
              description: 'One-time HTML source code download',
            },
            unit_amount: 399, // $3.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&creation_id=${creationId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
      client_reference_id: `${userId}:${creationId}`,
      customer_email: user.email,
      metadata: {
        userId,
        creationId,
        type: 'onetime',
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

/**
 * Get user credit balance
 */
app.get('/api/credits/balance', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const balance = await credits.getCreditBalance(userId);
    
    // Get user plan info
    const user = await auth.getUserById(userId);
    
    res.json({
      credits: balance,
      plan: user.plan || 'FREE',
      proUntil: user.pro_until || null,
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    res.status(500).json({ error: error.message || 'Failed to get credit balance' });
  }
});

/**
 * Get credit transaction history
 */
app.get('/api/credits/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const history = await credits.getCreditHistory(userId, limit);
    res.json({ transactions: history });
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({ error: error.message || 'Failed to get credit history' });
  }
});

/**
 * Create Stripe Checkout Session for One-Off Credit Purchase ($3.99)
 */
app.post('/api/billing/checkout/one-off', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in .env' });
    }

    const userId = req.user.userId;
    const user = await auth.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (user_id, type, amount, provider, status)
       VALUES ($1, 'ONE_OFF', 3.99, 'stripe', 'pending')
       RETURNING id`,
      [userId]
    );
    const paymentId = paymentResult.rows[0].id;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Fanta Build - 1 Credit',
              description: '1 credit for downloading AI-generated content',
            },
            unit_amount: 399, // $3.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?type=one-off&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
      customer_email: user.email,
      metadata: {
        userId,
        paymentId,
        type: 'one-off',
      },
    });

    // Update payment with session ID
    await pool.query(
      `UPDATE payments SET provider_session_id = $1 WHERE id = $2`,
      [session.id, paymentId]
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating one-off checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

/**
 * Create Stripe Checkout Session for Pro Subscription ($29.99/month)
 */
app.post('/api/billing/checkout/subscription', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in .env' });
    }

    const userId = req.user.userId;
    const user = await auth.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (user_id, type, amount, provider, status)
       VALUES ($1, 'SUBSCRIPTION', 29.99, 'stripe', 'pending')
       RETURNING id`,
      [userId]
    );
    const paymentId = paymentResult.rows[0].id;

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Fanta Build Pro',
              description: 'Pro subscription - 40 credits/month, faster generation, no watermark',
            },
            unit_amount: 2999, // $29.99 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?type=subscription&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
      customer_email: user.email,
      metadata: {
        userId,
        paymentId,
        type: 'subscription',
      },
    });

    // Update payment with session ID
    await pool.query(
      `UPDATE payments SET provider_session_id = $1 WHERE id = $2`,
      [session.id, paymentId]
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription session' });
  }
});

/**
 * Create Stripe Checkout Session for Pro Subscription (Legacy endpoint - keep for compatibility)
 */
app.post('/api/create-subscription-session', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in .env' });
    }

    const userId = req.user.userId;

    // Verify user exists
    const user = await auth.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Fanta Build Pro',
              description: 'Pro subscription - 20 daily generations + unlimited downloads',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 2999, // $29.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: user.email,
      metadata: {
        userId,
        type: 'subscription',
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription session:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription session' });
  }
});

/**
 * Download creation (consumes 1 credit)
 */
app.post('/api/download', requireAuth, async (req, res) => {
  try {
    const { creationId } = req.body;
    const userId = req.user.userId;

    if (!creationId) {
      return res.status(400).json({ error: 'Missing creationId' });
    }

    // Check credit balance
    const balance = await credits.getCreditBalance(userId);
    
    if (balance <= 0) {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You have no credits left. Please purchase credits to download.',
        credits: balance,
      });
    }

    // Consume credit first (before checking creation in DB)
    // This ensures credit is consumed even for in-memory creations
    const newBalance = await credits.consumeCredit(userId, 'DOWNLOAD');

    // Try to get creation from database (might not exist for in-memory creations)
    const result = await pool.query(
      `SELECT id, name, html, user_id FROM creations WHERE id = $1 AND user_id = $2`,
      [creationId, userId]
    );

    if (result.rows.length > 0) {
      const creation = result.rows[0];
      
      // Mark as purchased if not already
      await pool.query(
        `UPDATE creations SET purchased = true WHERE id = $1`,
        [creationId]
      );

      res.json({
        success: true,
        creation: {
          id: creation.id,
          name: creation.name,
          html: creation.html,
        },
        creditsRemaining: newBalance,
      });
    } else {
      // Creation is in-memory only (session-based)
      // Credit already consumed, frontend will handle download
      res.json({ 
        success: true, 
        creditsRemaining: newBalance,
        message: 'Credit consumed. Download will proceed.',
      });
    }
  } catch (error) {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      return res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: error.message || 'You have no credits left.',
        credits: 0,
      });
    }
    console.error('Download error:', error);
    res.status(500).json({ error: error.message || 'Failed to process download' });
  }
});

/**
 * Get available payment gateways
 */
app.get('/api/payment/gateways', async (req, res) => {
  try {
    const gateways = getAvailableGateways();
    res.json({ gateways });
  } catch (error) {
    console.error('Error getting payment gateways:', error);
    res.status(500).json({ error: 'Failed to get payment gateways' });
  }
});

/**
 * Create payment session for Ethiopian payment methods (TeleBirr, CBE, etc.)
 */
app.post('/api/payment/create', requireAuth, async (req, res) => {
  try {
    const { gateway, amount, currency, creationId, type } = req.body;
    const userId = req.user.userId;

    if (!gateway || !amount) {
      return res.status(400).json({ error: 'Missing gateway or amount' });
    }

    // Verify user exists
    const user = await auth.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate order ID
    const orderId = `FB-${Date.now()}-${userId.substring(0, 8)}`;

    // Create payment session
    const paymentSession = await createPaymentSession(
      gateway,
      amount,
      currency || 'USD',
      orderId,
      {
        email: user.email,
        phone: req.body.phone || '',
      },
      {
        userId,
        creationId,
        type: type || 'onetime',
      }
    );

    // Store payment session in database for tracking
    await pool.query(
      `INSERT INTO payment_sessions (id, user_id, gateway, amount, currency, order_id, creation_id, type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET status = $9`,
      [orderId, userId, gateway, amount, currency || 'USD', creationId || null, type || 'onetime', 'pending']
    );

    res.json(paymentSession);
  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment session' });
  }
});

/**
 * TeleBirr payment callback
 */
app.post('/api/payment/telebirr/callback', express.json(), async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Verify and process TeleBirr callback
    const verification = await verifyPaymentCallback(PAYMENT_GATEWAYS.TELEBIRR, callbackData);
    
    if (verification.success) {
      // Update payment session
      await pool.query(
        `UPDATE payment_sessions SET status = 'completed', transaction_id = $1, completed_at = NOW() WHERE order_id = $2`,
        [verification.transactionId, verification.orderId]
      );

      // Get payment session details
      const sessionResult = await pool.query(
        `SELECT * FROM payment_sessions WHERE order_id = $1`,
        [verification.orderId]
      );

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        if (session.type === 'subscription') {
          // Update user to Pro
          await auth.updateUserSubscription(session.user_id, 'pro');
          await pool.query(
            `UPDATE creations SET purchased = true WHERE user_id = $1`,
            [session.user_id]
          );
        } else if (session.creation_id) {
          // Mark creation as purchased
          await creationsDb.markCreationAsPurchased(session.creation_id);
        }
      }
    }

    res.json({ received: true, success: verification.success });
  } catch (error) {
    console.error('TeleBirr callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

/**
 * PayPal payment capture (called when user returns from PayPal)
 */
app.post('/api/payment/paypal/capture', requireAuth, async (req, res) => {
  try {
    const { orderId: paypalOrderId } = req.body;
    const userId = req.user.userId;

    if (!paypalOrderId) {
      return res.status(400).json({ error: 'Missing PayPal order ID' });
    }

    // Verify and capture PayPal order
    const verification = await verifyPaymentCallback(PAYMENT_GATEWAYS.PAYPAL, { orderID: paypalOrderId });
    
    if (!verification.success) {
      return res.status(400).json({ error: verification.error || 'Failed to verify PayPal payment' });
    }

    // Find payment session by PayPal order ID or our reference ID
    const sessionResult = await pool.query(
      `SELECT * FROM payment_sessions WHERE order_id = $1 OR id = $1`,
      [verification.orderId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user owns this payment session
    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update payment session
    await pool.query(
      `UPDATE payment_sessions SET status = 'completed', transaction_id = $1, completed_at = NOW() WHERE id = $2`,
      [verification.transactionId, session.id]
    );

    // Process payment based on type
    if (session.type === 'subscription') {
      // Update user to Pro
      await auth.updateUserSubscription(session.user_id, 'pro');
      await pool.query(
        `UPDATE creations SET purchased = true WHERE user_id = $1`,
        [session.user_id]
      );
    } else if (session.creation_id) {
      // Mark creation as purchased
      await creationsDb.markCreationAsPurchased(session.creation_id);
    }

    res.json({ 
      success: true, 
      type: session.type,
      creationId: session.creation_id 
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
  }
});

/**
 * PayPal payment callback (webhook - optional)
 */
app.post('/api/payment/paypal/callback', express.json(), async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Verify and process PayPal callback
    const verification = await verifyPaymentCallback(PAYMENT_GATEWAYS.PAYPAL, callbackData);
    
    if (verification.success) {
      // Update payment session
      await pool.query(
        `UPDATE payment_sessions SET status = 'completed', transaction_id = $1, completed_at = NOW() WHERE order_id = $2 OR id = $2`,
        [verification.transactionId, verification.orderId]
      );

      // Get payment session details
      const sessionResult = await pool.query(
        `SELECT * FROM payment_sessions WHERE order_id = $1 OR id = $1`,
        [verification.orderId]
      );

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        if (session.type === 'subscription') {
          // Update user to Pro
          await auth.updateUserSubscription(session.user_id, 'pro');
          await pool.query(
            `UPDATE creations SET purchased = true WHERE user_id = $1`,
            [session.user_id]
          );
        } else if (session.creation_id) {
          // Mark creation as purchased
          await creationsDb.markCreationAsPurchased(session.creation_id);
        }
      }

      res.status(200).json({ success: true });
    } else {
      console.error('PayPal payment verification failed:', verification.error);
      res.status(400).json({ success: false, error: verification.error });
    }
  } catch (error) {
    console.error('PayPal callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * CBE payment callback
 */
app.post('/api/payment/cbe/callback', express.json(), async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Verify and process CBE callback
    const verification = await verifyPaymentCallback(PAYMENT_GATEWAYS.CBE, callbackData);
    
    if (verification.success) {
      // Update payment session
      await pool.query(
        `UPDATE payment_sessions SET status = 'completed', transaction_id = $1, completed_at = NOW() WHERE order_id = $2`,
        [verification.transactionId, verification.orderId]
      );

      // Get payment session details
      const sessionResult = await pool.query(
        `SELECT * FROM payment_sessions WHERE order_id = $1`,
        [verification.orderId]
      );

      if (sessionResult.rows.length > 0) {
        const session = sessionResult.rows[0];
        
        if (session.type === 'subscription') {
          // Update user to Pro
          await auth.updateUserSubscription(session.user_id, 'pro');
          await pool.query(
            `UPDATE creations SET purchased = true WHERE user_id = $1`,
            [session.user_id]
          );
        } else if (session.creation_id) {
          // Mark creation as purchased
          await creationsDb.markCreationAsPurchased(session.creation_id);
        }
      }
    }

    res.json({ received: true, success: verification.success });
  } catch (error) {
    console.error('CBE callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

/**
 * Verify payment status
 */
app.get('/api/verify-payment', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      paid: session.payment_status === 'paid',
      status: session.payment_status,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * Stripe Webhook Handler
 * Handles payment success events and updates database
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const { userId, creationId, type, paymentId } = session.metadata || {};

        if (type === 'subscription') {
          // Update user to Pro and add 40 credits
          if (userId) {
            await credits.updateUserPlan(userId, 'PRO');
            await credits.addCredits(userId, 40, 'SUBSCRIPTION_MONTHLY');
            
            // Update payment status
            if (paymentId) {
              await pool.query(
                `UPDATE payments SET status = 'completed' WHERE id = $1`,
                [paymentId]
              );
            }
          }
        } else if (type === 'one-off') {
          // Add 1 credit for one-off purchase
          if (userId) {
            await credits.addCredits(userId, 1, 'ONE_OFF_PURCHASE');
            
            // Update user plan to PAY_PER_USE if they're on FREE
            const user = await auth.getUserById(userId);
            if (user && (!user.plan || user.plan === 'FREE')) {
              await credits.updateUserPlan(userId, 'PAY_PER_USE');
            }
            
            // Update payment status
            if (paymentId) {
              await pool.query(
                `UPDATE payments SET status = 'completed' WHERE id = $1`,
                [paymentId]
              );
            }
          }
        } else if (type === 'onetime' && creationId) {
          // Legacy: For backward compatibility, consume credit and mark as purchased
          if (userId) {
            try {
              await credits.consumeCredit(userId, 'DOWNLOAD');
              await creationsDb.markCreationAsPurchased(creationId);
            } catch (error) {
              // If credit consumption fails, just mark as purchased (legacy behavior)
              await creationsDb.markCreationAsPurchased(creationId);
            }
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded':
        // Handle subscription renewal - add 40 credits monthly
        const subscription = event.data.object;
        const subUserId = subscription.metadata?.userId;
        
        if (subUserId && event.type === 'invoice.payment_succeeded') {
          // Check if this is a renewal (not initial payment)
          const invoice = event.data.object;
          if (invoice.billing_reason === 'subscription_cycle') {
            await credits.addCredits(subUserId, 40, 'SUBSCRIPTION_MONTHLY');
          }
        }
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation - downgrade to FREE
        const cancelledSub = event.data.object;
        const cancelledUserId = cancelledSub.metadata?.userId;
        
        if (cancelledUserId) {
          await credits.updateUserPlan(cancelledUserId, 'FREE');
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Admin API endpoints
 */
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const analytics = await adminDb.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const users = await adminDb.getAllUsers(limit, offset);
    const total = await adminDb.getUserCount();
    res.json({ users, total, limit, offset });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/creations', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const creations = await adminDb.getAllCreations(limit, offset);
    const total = await adminDb.getCreationCount();
    res.json({ creations, total, limit, offset });
  } catch (error) {
    console.error('Error fetching creations:', error);
    res.status(500).json({ error: 'Failed to fetch creations' });
  }
});

app.put('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await adminDb.updateUserRole(id, role);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
});

app.put('/api/admin/users/:id/subscription', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await adminDb.updateUserSubscription(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to update subscription' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent deleting yourself
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await adminDb.deleteUser(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.delete('/api/admin/creations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await adminDb.deleteCreation(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting creation:', error);
    res.status(500).json({ error: 'Failed to delete creation' });
  }
});

// Start server
// Parse PORT correctly (ensure it's a number)
const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Fanta Build server running on port ${PORT}`);
  console.log(`📝 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Admin API: http://0.0.0.0:${PORT}/api/admin/*`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT} (accessible from all network interfaces)`);
  console.log('');
  
  try {
    // Step 1: Ensure database schema exists BEFORE any queries
    console.log('🔄 Ensuring database schema...');
    await migrations.ensureSchema();
    console.log('✅ Schema ensured');
    
    // Step 2: Initialize permanent admin account (schema is ready)
    console.log('🔄 Ensuring permanent admin account...');
    const admin = await auth.ensurePermanentAdmin();
    
    if (admin) {
      console.log('✅ Permanent admin account ready');
    } else {
      console.error('⚠️  Could not initialize permanent admin account');
    }
  } catch (err) {
    console.error('❌ Initialization error:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Error detail:', err.detail);
    
    if (err.code === '42P01') {
      console.error('❌ CRITICAL: Database table does not exist. Schema migration failed.');
      console.error('   The server cannot start without required database tables.');
      console.error('   Please check database connection and permissions.');
      process.exit(1);
    } else {
      console.error('⚠️  Server will continue, but some features may not work.');
    }
  }
  
  if (!ai || !stripe) {
    console.log('⚠️  Some services are not configured. Check your .env file.');
    console.log('');
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port or stop the other process.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

