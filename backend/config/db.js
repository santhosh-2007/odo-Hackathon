const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brightloop_sms',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  timezone: '+00:00'
});

// Helper for single query execution
async function query(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
}

// Helper for multi-statement / script execution if needed
async function rawQuery(sql, params = []) {
  const [rows, fields] = await pool.query(sql, params);
  return rows;
}

// Transaction execution wrapper
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Health check test
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    return rows[0].solution === 2;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  rawQuery,
  transaction,
  testConnection
};
