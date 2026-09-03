require('dotenv').config();
const { pool } = require('./src/config/db');
const fs = require('fs');
async function run() {
  let sql = fs.readFileSync('schema.sql', 'utf8');
  
  const [sa] = await pool.execute('SELECT * FROM super_admins');
  for (const row of sa) {
    const keys = Object.keys(row).map(k => '' + k + '').join(', ');
    const values = Object.values(row).map(v => typeof v === 'string' ? '' : v).join(', ');
    sql += INSERT INTO super_admins () VALUES ();\n;
  }
  
  fs.writeFileSync('schema.sql', sql);
  console.log('Appended super_admins data');
  process.exit(0);
}
run();
