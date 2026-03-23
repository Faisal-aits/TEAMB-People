const mysql = require('mysql2/promise');

async function test() {
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
        console.log('Testing Resignation Insert...');
        const tenant_id = 1;
        const employee_id = 3; 
        const requested_last_day = '2026-04-20';
        const reason = 'Test Reason';
        const ref_number = 'RES-2026-0001';

        await pool.execute(
            `INSERT INTO resignation_requests 
            (tenant_id, employee_id, requested_last_day, reason, status, ref_number) 
            VALUES (?, ?, ?, ?, 'pending', ?)`,
            [tenant_id, employee_id, requested_last_day, reason, ref_number]
        );
        console.log('Resignation Insert Successful');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

test();
