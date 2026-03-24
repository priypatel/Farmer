import pool from '../../database/pool.js';

// ── Crops ────────────────────────────────────────────────────────────────────

export async function getAllCrops() {
  const [rows] = await pool.query(
    'SELECT id, name FROM crops WHERE deleted_at IS NULL ORDER BY name ASC'
  );
  return rows;
}

export async function getCropById(id) {
  const [rows] = await pool.query(
    'SELECT id, name FROM crops WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

export async function findActiveCropByName(name) {
  const [rows] = await pool.query(
    'SELECT id FROM crops WHERE name = ? AND deleted_at IS NULL',
    [name]
  );
  return rows[0] || null;
}

export async function createCrop(name) {
  const [result] = await pool.query(
    'INSERT INTO crops (name) VALUES (?)',
    [name]
  );
  return result.insertId;
}

export async function updateCrop(id, name) {
  const [result] = await pool.query(
    'UPDATE crops SET name = ? WHERE id = ? AND deleted_at IS NULL',
    [name, id]
  );
  return result.affectedRows;
}

export async function softDeleteCrop(id) {
  const [result] = await pool.query(
    'UPDATE crops SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows;
}

// ── Locations ────────────────────────────────────────────────────────────────

export async function getAllLocations() {
  const [rows] = await pool.query(
    'SELECT id, name FROM locations WHERE deleted_at IS NULL ORDER BY name ASC'
  );
  return rows;
}

export async function getLocationById(id) {
  const [rows] = await pool.query(
    'SELECT id, name FROM locations WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

export async function findActiveLocationByName(name) {
  const [rows] = await pool.query(
    'SELECT id FROM locations WHERE name = ? AND deleted_at IS NULL',
    [name]
  );
  return rows[0] || null;
}

export async function createLocation(name) {
  const [result] = await pool.query(
    'INSERT INTO locations (name) VALUES (?)',
    [name]
  );
  return result.insertId;
}

export async function updateLocation(id, name) {
  const [result] = await pool.query(
    'UPDATE locations SET name = ? WHERE id = ? AND deleted_at IS NULL',
    [name, id]
  );
  return result.affectedRows;
}

export async function softDeleteLocation(id) {
  const [result] = await pool.query(
    'UPDATE locations SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows;
}

// ── Branches ─────────────────────────────────────────────────────────────────

export async function getAllBranches() {
  const [rows] = await pool.query(
    'SELECT id, name FROM branches WHERE deleted_at IS NULL ORDER BY name ASC'
  );
  return rows;
}

export async function getBranchById(id) {
  const [rows] = await pool.query(
    'SELECT id, name FROM branches WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

export async function findActiveBranchByName(name) {
  const [rows] = await pool.query(
    'SELECT id FROM branches WHERE name = ? AND deleted_at IS NULL',
    [name]
  );
  return rows[0] || null;
}

export async function createBranch(name) {
  const [result] = await pool.query(
    'INSERT INTO branches (name) VALUES (?)',
    [name]
  );
  return result.insertId;
}

export async function updateBranch(id, name) {
  const [result] = await pool.query(
    'UPDATE branches SET name = ? WHERE id = ? AND deleted_at IS NULL',
    [name, id]
  );
  return result.affectedRows;
}

export async function softDeleteBranch(id) {
  const [result] = await pool.query(
    'UPDATE branches SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows;
}
