const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Rider@1234',
        database: 'aits',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('--- resignation_requests structure ---');
        const [rows] = await pool.execute('DESCRIBE resignation_requests');
        rows.forEach(r => console.log(`${r.Field}: ${r.Type} ${r.Key}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
