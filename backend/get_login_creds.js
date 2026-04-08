const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'aits',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const [superadmins] = await pool.execute('SELECT email, password_plain FROM super_admin LIMIT 1');
        console.log('Super Admin:', superadmins[0]);
        
        const [users] = await pool.execute('SELECT u.email, u.password_plain, u.role FROM users u WHERE u.role="HR" LIMIT 1');
        console.log('HR User:', users[0]);
        
        const [employees] = await pool.execute('SELECT employee_email, password_plain FROM tb_employee LIMIT 1');
        console.log('Employee:', employees[0]);
        
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        // Maybe password_plain doesn't exist. Let's fallback
        try {
            const [superadmins] = await pool.execute('SELECT email, password FROM super_admin LIMIT 1');
            console.log('Super Admin:', superadmins[0]);
            
            const [users] = await pool.execute('SELECT u.email, u.password, u.role FROM users u LIMIT 1');
            console.log('User:', users[0]);
            
            process.exit(0);
        } catch(e) {
             console.error(e);
             process.exit(1);
        }
    }
}

check();
