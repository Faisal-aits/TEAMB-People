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
        // console.log('Fixing experience_letters column type...');
        // Drop foreign key if it exists (the error message said it exists)
        try {
            await pool.execute('ALTER TABLE experience_letters DROP FOREIGN KEY fk_el_employee');
            // console.log('Dropped fk_el_employee');
        } catch (e) { console.log('fk_el_employee not found or already dropped'); }

        await pool.execute('ALTER TABLE experience_letters MODIFY employee_id VARCHAR(50) NOT NULL');
        // console.log('Modified experience_letters.employee_id to VARCHAR(50)');

        // Re-add foreign key correctly
        await pool.execute('ALTER TABLE experience_letters ADD CONSTRAINT fk_el_employee FOREIGN KEY (employee_id) REFERENCES employee_details(id) ON DELETE CASCADE');
        // console.log('Re-added fk_el_employee pointing to employee_details(id)');

        // console.log('\nFixing increment_letters column type...');
        try {
            await pool.execute('ALTER TABLE increment_letters DROP FOREIGN KEY fk_il_employee');
            // console.log('Dropped fk_il_employee');
        } catch (e) { console.log('fk_il_employee not found'); }

        await pool.execute('ALTER TABLE increment_letters MODIFY employee_id VARCHAR(50) NOT NULL');
        // console.log('Modified increment_letters.employee_id to VARCHAR(50)');

        // Re-add foreign key for increment_letters too
        try {
            await pool.execute('ALTER TABLE increment_letters ADD CONSTRAINT fk_il_employee FOREIGN KEY (employee_id) REFERENCES employee_details(id) ON DELETE CASCADE');
            //  console.log('Added fk_il_employee pointing to employee_details(id)');
        } catch (e) { console.error('Failed to add fk_il_employee:', e.message); }

        process.exit(0);
    } catch (err) {
        console.error('ERROR during fix:', err.message);
        process.exit(1);
    }
}

fix();
