// migrations/add_medical_document_to_leave_requests.js
// Run: node migrations/add_medical_document_to_leave_requests.js
const pool = require('../config/database');

async function addMedicalDocumentColumn() {
    try {
        // Check if column already exists
        const [columns] = await pool.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'leave_requests' 
               AND COLUMN_NAME = 'medical_document'`
        );

        if (columns.length === 0) {
            await pool.execute(
                `ALTER TABLE leave_requests 
                 ADD COLUMN medical_document VARCHAR(500) DEFAULT NULL 
                 AFTER end_date`
            );
            console.log('✅ medical_document column added to leave_requests table');
        } else {
            console.log('ℹ️  medical_document column already exists — skipping');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding medical_document column:', error.message);
        process.exit(1);
    }
}

addMedicalDocumentColumn();
