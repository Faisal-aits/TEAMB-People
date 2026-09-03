require('dotenv').config();
const { pool } = require('./src/config/db');
const fs = require('fs');
async function run() {
  const [rows] = await pool.execute('SHOW TABLES');
  const tables = rows.map(r => Object.values(r)[0]);
  let sql = 'SET FOREIGN_KEY_CHECKS=0;\n\n';
  for (const table of tables) {
    const [createRes] = await pool.execute('SHOW CREATE TABLE ' + table + '');
    sql += createRes[0]['Create Table'] + ';\n\n';
  }
  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  fs.writeFileSync('schema.sql', sql);
  console.log('Exported to schema.sql');
  process.exit(0);
}
run();
