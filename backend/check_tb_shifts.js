require('dotenv').config();
const { pool } = require('./src/config/db');
async function run() {
  const [rows] = await pool.execute('SELECT * FROM tb_shifts');
  console.log('tb_shifts:', rows);
  process.exit(0);
}
run();
