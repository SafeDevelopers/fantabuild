/**
 * Database Schema Bootstrap and Migrations
 * Ensures required tables exist before the application starts
 */
import pool from './db.js';

/**
 * Enable required PostgreSQL extensions
 */
async function ensureExtensions() {
  try {
    // Try pgcrypto first (preferred, more modern)
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ PostgreSQL extension pgcrypto enabled');
  } catch (error) {
    // Fallback to uuid-ossp if pgcrypto fails
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ PostgreSQL extension uuid-ossp enabled');
    } catch (fallbackError) {
      console.warn('⚠️  Could not enable UUID extensions:', fallbackError.message);
      // Continue anyway - some databases might have UUID support built-in
    }
  }
}

/**
 * Get UUID function name (pgcrypto or uuid-ossp)
 */
async function getUuidFunction() {
  try {
    await pool.query('SELECT gen_random_uuid()');
    return 'gen_random_uuid()';
  } catch (error) {
    return 'uuid_generate_v4()';
  }
}

/**
 * Create users table if it doesn't exist
 */
async function createUsersTable() {
  const uuidFunc = await getUuidFunction();
  
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT ${uuidFunc},
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro')),
      plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PAY_PER_USE', 'PRO')),
      credits INTEGER NOT NULL DEFAULT 0,
      pro_since TIMESTAMPTZ,
      pro_until TIMESTAMPTZ,
      daily_usage_count INTEGER NOT NULL DEFAULT 0,
      last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  await pool.query(query);
  console.log('✅ Users table ensured');
}

/**
 * Create creations table if it doesn't exist
 */
async function createCreationsTable() {
  const uuidFunc = await getUuidFunction();
  
  const query = `
    CREATE TABLE IF NOT EXISTS creations (
      id UUID PRIMARY KEY DEFAULT ${uuidFunc},
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      html TEXT NOT NULL,
      original_image TEXT,
      mode TEXT NOT NULL DEFAULT 'web' CHECK (mode IN ('web', 'mobile', 'social', 'logo', 'video')),
      purchased BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  await pool.query(query);
  console.log('✅ Creations table ensured');
}

/**
 * Create credit_transactions table if it doesn't exist
 */
async function createCreditTransactionsTable() {
  const uuidFunc = await getUuidFunction();
  
  const query = `
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id UUID PRIMARY KEY DEFAULT ${uuidFunc},
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      change INTEGER NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN ('INITIAL_FREE', 'DOWNLOAD', 'ONE_OFF_PURCHASE', 'SUBSCRIPTION_MONTHLY')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  await pool.query(query);
  console.log('✅ Credit transactions table ensured');
}

/**
 * Create payments table if it doesn't exist
 */
async function createPaymentsTable() {
  const uuidFunc = await getUuidFunction();
  
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT ${uuidFunc},
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('ONE_OFF', 'SUBSCRIPTION')),
      amount DECIMAL(10, 2) NOT NULL,
      provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'paypal', 'telebirr', 'cbe')),
      provider_session_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  await pool.query(query);
  console.log('✅ Payments table ensured');
}

/**
 * Create payment_sessions table if it doesn't exist
 */
async function createPaymentSessionsTable() {
  const uuidFunc = await getUuidFunction();
  
  const query = `
    CREATE TABLE IF NOT EXISTS payment_sessions (
      id UUID PRIMARY KEY DEFAULT ${uuidFunc},
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creation_id UUID REFERENCES creations(id) ON DELETE SET NULL,
      order_id TEXT NOT NULL UNIQUE,
      gateway TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      type TEXT NOT NULL CHECK (type IN ('onetime', 'subscription')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      transaction_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  `;
  
  await pool.query(query);
  console.log('✅ Payment sessions table ensured');
}

/**
 * Ensure users table has plan and credits columns (migration for existing tables)
 */
async function ensureUsersTableColumns() {
  try {
    // Check if plan column exists
    const planCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'plan'
    `);
    
    if (planCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PAY_PER_USE', 'PRO'))
      `);
      console.log('✅ Added plan column to users table');
    }
    
    // Check if credits column exists
    const creditsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'credits'
    `);
    
    if (creditsCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN credits INTEGER NOT NULL DEFAULT 0
      `);
      console.log('✅ Added credits column to users table');
    }
  } catch (error) {
    console.warn(`⚠️  Could not ensure users table columns: ${error.message}`);
  }
}

/**
 * Create indexes if they don't exist
 */
async function createIndexes() {
  // First ensure columns exist before creating indexes
  await ensureUsersTableColumns();
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_provider_session_id ON payments(provider_session_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
  ];
  
  // Only create indexes on plan and credits if columns exist
  try {
    const planCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'plan'
    `);
    if (planCheck.rows.length > 0) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan)');
    }
  } catch (error) {
    console.warn(`⚠️  Could not check plan column: ${error.message}`);
  }
  
  try {
    const creditsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'credits'
    `);
    if (creditsCheck.rows.length > 0) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits)');
    }
  } catch (error) {
    console.warn(`⚠️  Could not check credits column: ${error.message}`);
  }
  
  for (const indexQuery of indexes) {
    try {
      await pool.query(indexQuery);
    } catch (error) {
      console.warn(`⚠️  Could not create index: ${error.message}`);
    }
  }
  console.log('✅ Indexes ensured');
}

/**
 * Create triggers and functions
 */
async function createTriggers() {
  // Function to update updated_at timestamp
  const updateFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  await pool.query(updateFunction);
  
  // Trigger for users table
  const usersTrigger = `
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
  
  await pool.query(usersTrigger);
  
  // Trigger for creations table
  const creationsTrigger = `
    DROP TRIGGER IF EXISTS update_creations_updated_at ON creations;
    CREATE TRIGGER update_creations_updated_at
      BEFORE UPDATE ON creations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
  
  await pool.query(creationsTrigger);
  
  // Trigger for payments table
  const paymentsTrigger = `
    DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
  
  await pool.query(paymentsTrigger);
  
  console.log('✅ Triggers and functions ensured');
}

/**
 * Initialize schema - creates all required tables
 * This runs before the application starts to ensure tables exist
 */
export async function ensureSchema() {
  try {
    console.log('🔄 Ensuring database schema...');
    
    // Test database connection first
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');
    
    // Enable extensions
    await ensureExtensions();
    
    // Create tables in order (respecting foreign key dependencies)
    await createUsersTable();
    await createCreationsTable();
    await createCreditTransactionsTable();
    await createPaymentsTable();
    await createPaymentSessionsTable();
    
    // Create indexes
    await createIndexes();
    
    // Create triggers
    await createTriggers();
    
    console.log('✅ Database schema ensured successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure database schema:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    throw error;
  }
}

/**
 * Check if users table exists
 */
export async function checkUsersTableExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}
