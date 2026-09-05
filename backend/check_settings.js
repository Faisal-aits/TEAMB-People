require('dotenv').config();
const { pool } = require('./src/config/db');
async function run() {
  const [rows] = await pool.execute('SELECT * FROM company_settings');
  console.log('company_settings:', rows);
  process.exit(0);
}
run();
