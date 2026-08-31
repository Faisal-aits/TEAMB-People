// src/config/db.js
// Set default process timezone to Indian Standard Time
process.env.TZ = 'Asia/Kolkata';

const mysql = require('mysql2/promise');

// Single shared pool for the entire application lifecycle.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  timezone: '+05:30',
  dateStrings: [
    'DATE'
  ],
  waitForConnections: true,
  connectionLimit: 10,  
  queueLimit: 0,
});

// Ensure every database connection explicitly runs in Indian Standard Time (+05:30)
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+05:30'");
});

const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    error.message = `Database query failed: ${error.message}`;
    throw error;
  }
};

module.exports = {
  pool,
  query,
};
