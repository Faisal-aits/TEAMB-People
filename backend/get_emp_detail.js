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
        const [emps] = await pool.execute('SELECT id, user_id FROM employee_details LIMIT 5');
        // console.log('Employees:', JSON.stringify(emps));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
