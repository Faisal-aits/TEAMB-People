const pool = require('./config/database');

async function alterUsersTable() {
    try {
        console.log('Adding reset_password_token and reset_password_expires to users table...');
        await pool.execute('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL');
        await pool.execute('ALTER TABLE users ADD COLUMN reset_password_expires DATETIME DEFAULT NULL');
        console.log('Successfully altered users table.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping alteration.');
            process.exit(0);
        } else {
            console.error('Error altering table:', error);
            process.exit(1);
        }
    }
}

alterUsersTable();
