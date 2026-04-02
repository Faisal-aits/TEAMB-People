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
        const [rows] = await pool.execute('SELECT * FROM resignation_requests LIMIT 1');
        const r = rows[0];
        if (!r) {
            console.log('No records found');
            process.exit(0);
        }
        // console.log(`id: ${r.id}, employee_id: ${r.employee_id}, status: ${r.status}, tenant_id: ${r.tenant_id}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
