/**
 * Credit Management Service
 * Handles all credit-related operations
 */
import pool from './db.js';

/**
 * Get current credit balance for a user
 */
export async function getCreditBalance(userId) {
  // Check if credits column exists
  try {
    const checkResult = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'credits'`
    );
    
    if (checkResult.rows.length === 0) {
      // Credits schema not migrated yet, return 0 as default
      console.warn('Credits column does not exist. Please run database/credits-schema.sql migration.');
      return 0;
    }
  } catch (error) {
    console.warn('Could not check for credits column:', error.message);
    return 0;
  }
  
  const result = await pool.query(
    `SELECT credits FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0].credits || 0;
}

/**
 * Add credits to a user's account
 */
export async function addCredits(userId, amount, reason) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  const validReasons = ['INITIAL_FREE', 'ONE_OFF_PURCHASE', 'SUBSCRIPTION_MONTHLY'];
  if (!validReasons.includes(reason)) {
    throw new Error(`Invalid reason: ${reason}`);
  }

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update user credits
    await client.query(
      `UPDATE users SET credits = credits + $1 WHERE id = $2`,
      [amount, userId]
    );

    // Create credit transaction record
    await client.query(
      `INSERT INTO credit_transactions (user_id, change, reason)
       VALUES ($1, $2, $3)`,
      [userId, amount, reason]
    );

    await client.query('COMMIT');

    // Return new balance
    const balanceResult = await client.query(
      `SELECT credits FROM users WHERE id = $1`,
      [userId]
    );
    
    return balanceResult.rows[0].credits;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Consume a credit from user's account
 */
export async function consumeCredit(userId, reason = 'DOWNLOAD') {
  const validReasons = ['DOWNLOAD'];
  if (!validReasons.includes(reason)) {
    throw new Error(`Invalid reason: ${reason}`);
  }

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check current balance
    const balanceResult = await client.query(
      `SELECT credits FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = balanceResult.rows[0].credits || 0;

    if (currentBalance <= 0) {
      await client.query('ROLLBACK');
      const error = new Error('Insufficient credits');
      error.code = 'INSUFFICIENT_CREDITS';
      throw error;
    }

    // Deduct credit
    await client.query(
      `UPDATE users SET credits = credits - 1 WHERE id = $1`,
      [userId]
    );

    // Create credit transaction record
    await client.query(
      `INSERT INTO credit_transactions (user_id, change, reason)
       VALUES ($1, $2, $3)`,
      [userId, -1, reason]
    );

    await client.query('COMMIT');

    // Return new balance
    const newBalanceResult = await client.query(
      `SELECT credits FROM users WHERE id = $1`,
      [userId]
    );
    
    return newBalanceResult.rows[0].credits;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(userId, limit = 50) {
  const result = await pool.query(
    `SELECT id, change, reason, created_at
     FROM credit_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  
  return result.rows;
}

/**
 * Update user plan
 */
export async function updateUserPlan(userId, plan, proUntil = null) {
  const validPlans = ['FREE', 'PAY_PER_USE', 'PRO'];
  if (!validPlans.includes(plan)) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const updates = {
    plan,
    pro_since: plan === 'PRO' ? new Date() : null,
    pro_until: proUntil || (plan === 'PRO' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null), // 30 days from now
  };

  await pool.query(
    `UPDATE users 
     SET plan = $1, pro_since = $2, pro_until = $3
     WHERE id = $4`,
    [updates.plan, updates.pro_since, updates.pro_until, userId]
  );
}
