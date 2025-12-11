/**
 * PostgreSQL Database Connection
 * Supports both DATABASE_URL and individual DB_* environment variables
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server directory
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

// Support DATABASE_URL or individual DB_* variables
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if provided (common in production/cloud deployments)
  // Parse SSL mode from URL if present
  const url = new URL(process.env.DATABASE_URL);
  const sslMode = url.searchParams.get('sslmode');
  
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslMode === 'require' || sslMode === 'prefer' 
      ? { rejectUnauthorized: false } 
      : process.env.DB_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Fall back to individual DB_* variables
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'fantabuild',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;

