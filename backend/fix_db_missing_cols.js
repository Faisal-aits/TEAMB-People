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
        console.log('--- Fixing resignation_requests ---');
        const [rCols] = await pool.execute('DESCRIBE resignation_requests');
        const rFields = rCols.map(c => c.Field);
        
        if (!rFields.includes('ref_number')) {
            await pool.execute('ALTER TABLE resignation_requests ADD COLUMN ref_number VARCHAR(100) AFTER letter_generated_at');
            console.log('Added ref_number to resignation_requests');
        }
        if (!rFields.includes('reviewed_by')) {
            // Already present?
        }
        
        console.log('--- Fixing experience_letters ---');
        const [eCols] = await pool.execute('DESCRIBE experience_letters');
        const eFields = eCols.map(c => c.Field);
        if (!eFields.includes('generated_by')) {
            await pool.execute('ALTER TABLE experience_letters ADD COLUMN generated_by INT AFTER ref_number');
            console.log('Added generated_by to experience_letters');
        }

        console.log('--- Fixing increment_letters ---');
        const [iCols] = await pool.execute('DESCRIBE increment_letters');
        const iFields = iCols.map(c => c.Field);
        if (!iFields.includes('generated_by')) {
            await pool.execute('ALTER TABLE increment_letters ADD COLUMN generated_by INT AFTER ref_number');
            console.log('Added generated_by to increment_letters');
        }

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

fix();
