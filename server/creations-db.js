/**
 * Creations database operations
 */
import pool from './db.js';

/**
 * Get all creations for a user
 */
export async function getUserCreations(userId) {
  const result = await pool.query(
    `SELECT id, user_id, name, html, original_image, mode, purchased, created_at
     FROM creations 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Create a new creation
 */
export async function createCreation(userId, name, html, originalImage, mode) {
  const result = await pool.query(
    `INSERT INTO creations (user_id, name, html, original_image, mode, purchased)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, name, html, original_image, mode, purchased, created_at`,
    [userId, name, html, originalImage || null, mode, false]
  );
  return result.rows[0];
}

/**
 * Update creation
 */
export async function updateCreation(creationId, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.purchased !== undefined) {
    fields.push(`purchased = $${paramCount}`);
    values.push(updates.purchased);
    paramCount++;
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount}`);
    values.push(updates.name);
    paramCount++;
  }

  if (fields.length === 0) return;

  values.push(creationId);
  const query = `UPDATE creations SET ${fields.join(', ')} WHERE id = $${paramCount}`;
  
  await pool.query(query, values);
}

/**
 * Delete creation
 */
export async function deleteCreation(creationId) {
  await pool.query(`DELETE FROM creations WHERE id = $1`, [creationId]);
}

/**
 * Mark creation as purchased
 */
export async function markCreationAsPurchased(creationId) {
  await updateCreation(creationId, { purchased: true });
}

