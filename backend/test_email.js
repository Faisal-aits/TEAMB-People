require('dotenv').config();
const { sendEmployeeCredentials } = require('./utils/emailService');

async function runTest() {
    console.log('Testing Email Service using exactly the configuration in .env...');
    console.log(`SMTP_USER configured as: ${process.env.SMTP_USER}`);
    
    // We send it to SMTP_USER just to test if the SMTP transport is authenticating and working. 
    // In production, `adminEmail` is dynamically passed.
    const adminEmail = process.env.SMTP_USER; 
    
    if (!adminEmail || !process.env.SMTP_PASS) {
        console.error('Error: SMTP_USER or SMTP_PASS is missing in .env');
        process.exit(1);
    }
    
    const success = await sendEmployeeCredentials(
        adminEmail, 
        'test-org-slug', 
        'mock.employee@example.com', 
        'MockPass123!', 
        'Mock Employee'
    );
    
    if (success) {
        console.log('✅ Success! The test email was sent perfectly. Your Gmail App Passwords configuration is working.');
    } else {
        console.log('❌ Failed! Nodemailer encountered an error. Check credentials.');
    }
    
    process.exit(0);
}

runTest();
