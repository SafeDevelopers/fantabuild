/**
 * Authentication utilities
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Permanent admin account from .env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fantabuild.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Adimin1971@';

/**
 * Hash a password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(email, password, role = 'user') {
  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, subscription_status, role, daily_usage_count, last_reset_date, created_at`,
    [email, passwordHash, role]
  );
  return result.rows[0];
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, email, password_hash, subscription_status, role, daily_usage_count, last_reset_date, created_at
     FROM users 
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Check if credentials match permanent admin account
 */
export function isPermanentAdmin(email, password) {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

/**
 * Ensure permanent admin account exists in database
 */
export async function ensurePermanentAdmin() {
  try {
    // Check if admin exists
    let admin = await getUserByEmail(ADMIN_EMAIL);
    
    if (!admin) {
      // Create admin account if it doesn't exist
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, role, subscription_status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, subscription_status, role, daily_usage_count, last_reset_date, created_at`,
        [ADMIN_EMAIL, passwordHash, 'admin', 'pro']
      );
      admin = result.rows[0];
      console.log('✅ Permanent admin account created:', ADMIN_EMAIL);
    } else {
      // Ensure admin always has admin role and pro subscription
      if (admin.role !== 'admin' || admin.subscription_status !== 'pro') {
        await pool.query(
          `UPDATE users SET role = 'admin', subscription_status = 'pro' WHERE email = $1`,
          [ADMIN_EMAIL]
        );
        console.log('✅ Permanent admin account updated:', ADMIN_EMAIL);
        // Re-fetch to get updated data
        admin = await getUserByEmail(ADMIN_EMAIL);
      }
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Error ensuring permanent admin:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const result = await pool.query(
    `SELECT id, email, subscription_status, role, daily_usage_count, last_reset_date, created_at
     FROM users 
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(userId, status) {
  await pool.query(
    `UPDATE users 
     SET subscription_status = $1 
     WHERE id = $2`,
    [status, userId]
  );
}

/**
 * Reset daily usage if needed
 */
export async function resetDailyUsageIfNeeded(userId) {
  const today = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT last_reset_date FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows[0] && result.rows[0].last_reset_date.toISOString().split('T')[0] !== today) {
    await pool.query(
      `UPDATE users 
       SET daily_usage_count = 0, last_reset_date = $1 
       WHERE id = $2`,
      [today, userId]
    );
  }
}

/**
 * Increment daily usage
 */
export async function incrementDailyUsage(userId) {
  await resetDailyUsageIfNeeded(userId);
  await pool.query(
    `UPDATE users 
     SET daily_usage_count = daily_usage_count + 1 
     WHERE id = $1`,
    [userId]
  );
}

