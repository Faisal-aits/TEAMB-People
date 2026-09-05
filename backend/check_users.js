require('dotenv').config();
const { pool } = require('./src/config/db');
async function run() {
  const [rows] = await pool.execute('DESCRIBE users');
  console.log(rows);
  process.exit(0);
}
run();
