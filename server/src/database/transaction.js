import pool from './pool.js';

/**
 * Execute a callback inside a database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 *
 * @param {Function} callback - async (connection) => result
 * @returns {Promise<*>} - result from callback
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
