/**
 * Admin database operations
 */
import pool from './db.js';

/**
 * Get all users with stats
 */
export async function getAllUsers(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT 
      id, email, subscription_status, role, daily_usage_count, 
      last_reset_date, created_at,
      (SELECT COUNT(*) FROM creations WHERE user_id = users.id) as creations_count
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

/**
 * Get total user count
 */
export async function getUserCount() {
  const result = await pool.query('SELECT COUNT(*) as count FROM users');
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get all creations with user info
 */
export async function getAllCreations(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT 
      c.id, c.name, c.mode, c.purchased, c.created_at,
      u.email as user_email, u.id as user_id
     FROM creations c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

/**
 * Get total creation count
 */
export async function getCreationCount() {
  const result = await pool.query('SELECT COUNT(*) as count FROM creations');
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get analytics/stats
 */
export async function getAnalytics() {
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE subscription_status = 'pro') as pro_users,
      (SELECT COUNT(*) FROM creations) as total_creations,
      (SELECT COUNT(*) FROM creations WHERE purchased = true) as purchased_creations,
      (SELECT SUM(daily_usage_count) FROM users) as total_generations,
      (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
      (SELECT COUNT(*) FROM creations WHERE created_at > NOW() - INTERVAL '7 days') as new_creations_7d
  `);
  
  return stats.rows[0];
}

/**
 * Update user role
 */
export async function updateUserRole(userId, role) {
  if (!['user', 'admin'].includes(role)) {
    throw new Error('Invalid role');
  }
  await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2',
    [role, userId]
  );
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(userId, status) {
  if (!['free', 'pro'].includes(status)) {
    throw new Error('Invalid subscription status');
  }
  await pool.query(
    'UPDATE users SET subscription_status = $1 WHERE id = $2',
    [status, userId]
  );
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Delete creation
 */
export async function deleteCreation(creationId) {
  await pool.query('DELETE FROM creations WHERE id = $1', [creationId]);
}

