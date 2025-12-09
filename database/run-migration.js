/**
 * Run Credits Migration Script
 * 
 * This script reads database credentials from server/.env and runs the credits-schema.sql migration
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
const envPath = join(__dirname, '..', 'server', '.env');
dotenv.config({ path: envPath });

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fantabuild',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Read the migration SQL file
const migrationPath = join(__dirname, 'credits-schema.sql');
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded:', migrationPath);
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

// Run the migration
async function runMigration() {
  const pool = new Pool(dbConfig);

  try {
    console.log('\n🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to database successfully\n');

    // Run the migration
    console.log('🚀 Running migration...\n');
    await pool.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying migration...\n');

    // Verify the migration
    const checks = [
      {
        name: 'plan column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'plan'`,
      },
      {
        name: 'credits column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'credits'`,
      },
      {
        name: 'credit_transactions table',
        query: `SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'credit_transactions'`,
      },
      {
        name: 'payments table',
        query: `SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'payments'`,
      },
    ];

    for (const check of checks) {
      const result = await pool.query(check.query);
      if (result.rows.length > 0) {
        console.log(`   ✅ ${check.name}: OK`);
      } else {
        console.log(`   ❌ ${check.name}: MISSING`);
      }
    }

    // Check user credits
    const userCheck = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN plan IS NOT NULL THEN 1 END) as with_plan,
              COUNT(CASE WHEN credits > 0 THEN 1 END) as with_credits
       FROM users`
    );
    const stats = userCheck.rows[0];
    console.log(`\n📈 User Statistics:`);
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Users with plan: ${stats.with_plan}`);
    console.log(`   Users with credits: ${stats.with_credits}`);

    console.log('\n✨ Migration verification complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Restart your server');
    console.log('   2. Test by creating a new user account');
    console.log('   3. Check /api/credits/balance endpoint\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   - Make sure database credentials in server/.env are correct');
    console.error('   - Ensure the base schema (postgres-schema.sql) has been run first');
    console.error('   - Check database user has CREATE TABLE and ALTER TABLE permissions\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
