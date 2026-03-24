import pool from '../../database/pool.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? AND is_deleted = 0',
    [email]
  );
  return rows[0] || null;
}

export async function freeDeletedUserEmail(email) {
  // Rename deleted user's email so the UNIQUE constraint is freed for a new row
  await pool.query(
    `UPDATE users SET email = CONCAT('deleted_', id, '_', email)
     WHERE email = ? AND is_deleted = 1`,
    [email]
  );
}

export async function findUserByGoogleId(googleId) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE google_id = ? AND is_deleted = 0',
    [googleId]
  );
  return rows[0] || null;
}

export async function createEmailUser(firstName, phone, email, hashedPassword, role) {
  const [result] = await pool.query(
    `INSERT INTO users (first_name, phone, email, password, role, auth_type)
     VALUES (?, ?, ?, ?, ?, 'email')`,
    [firstName, phone || null, email, hashedPassword, role]
  );
  return result.insertId;
}

export async function createGoogleUser(firstName, email, googleId, role) {
  const [result] = await pool.query(
    `INSERT INTO users (first_name, email, google_id, role, auth_type)
     VALUES (?, ?, ?, ?, 'google')`,
    [firstName, email, googleId, role]
  );
  return result.insertId;
}

export async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, first_name, email, role, auth_type
     FROM users WHERE id = ? AND is_deleted = 0`,
    [id]
  );
  return rows[0] || null;
}

export async function linkGoogleToUser(userId, googleId) {
  await pool.query(
    `UPDATE users SET google_id = ?, auth_type = 'both' WHERE id = ?`,
    [googleId, userId]
  );
}

export async function setUserPassword(userId, hashedPassword) {
  await pool.query(
    `UPDATE users SET password = ?, auth_type = 'both' WHERE id = ?`,
    [hashedPassword, userId]
  );
}

export async function savePasswordResetToken(userId, token, expires) {
  await pool.query(
    `UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?`,
    [token, expires, userId]
  );
}

export async function findUserByResetToken(token) {
  const [rows] = await pool.query(
    `SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW() AND is_deleted = 0`,
    [token]
  );
  return rows[0] || null;
}

export async function clearResetToken(userId) {
  await pool.query(
    `UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?`,
    [userId]
  );
}

export async function createFarmerRecord(userId) {
  const [result] = await pool.query(
    `INSERT INTO farmers (user_id, status) VALUES (?, 'pending')`,
    [userId]
  );
  return result.insertId;
}
