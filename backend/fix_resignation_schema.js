const mysql = require('mysql2/promise');

async function fix() {
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
        console.log('Fixing resignation_requests.employee_id column type...');
        
        try {
            await pool.execute('ALTER TABLE resignation_requests DROP FOREIGN KEY fk_resignation_employee');
            console.log('Dropped fk_resignation_employee');
        } catch (e) { console.log('fk_resignation_employee not found'); }

        await pool.execute('ALTER TABLE resignation_requests MODIFY employee_id VARCHAR(50) NOT NULL');
        console.log('Modified resignation_requests.employee_id to VARCHAR(50)');

        // Re-add foreign key correctly pointing to employee_details(id)
        await pool.execute('ALTER TABLE resignation_requests ADD CONSTRAINT fk_resignation_employee FOREIGN KEY (employee_id) REFERENCES employee_details(id) ON DELETE CASCADE');
        console.log('Re-added fk_resignation_employee pointing to employee_details(id)');

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

fix();
