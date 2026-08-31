// backend/src/jobs/probationChecker.js
const { pool } = require('../config/db');
const Employee = require('../features/employee/employeeModel');
const Document = require('../features/documents/documentModel');
const Notification = require('../features/notifications/notificationModel');


// For now we simulate PDF generation and update the DB
const checkProbations = async () => {
  try {
    const completedEmployees = await Employee.checkProbationCompletion();
    
    for (const emp of completedEmployees) {
      // 1. Update salary and probation status
      await pool.execute(
        `UPDATE employee_details 
         SET is_on_probation = 0, salary = salary_after_probation
         WHERE id = ? AND tenant_id = ?`,
        [emp.id, emp.tenant_id]
      );
      
      // Update basic salary etc.? The payroll calculator needs to be run.
      // For now, updating 'salary' field is the primary step. The next salary generation will use the new base salary.
      
      const docId = await Document.save(
        emp.tenant_id,
        emp.id, // employee_details.id
        'increment_letter',
        'Probation Completion Increment',
        null, // dynamically generated on frontend
        {
          probation_end_date: emp.probation_end_date,
          salary_during_probation: emp.salary_during_probation,
          salary_after_probation: emp.salary_after_probation
        },
        0 // is_sent = 0 (Admin must send)
      );
      
      // We don't notify the employee yet, because the admin needs to send it.
      // We can notify the HR/Admin about it. (Optional)
    }
  } catch (error) {
    console.error('Probation Checker Job Error:', error);
  }
};

const startProbationChecker = () => {
  // Run on startup
  checkProbations();
  
  // Run every 24 hours (86400000 ms)
  setInterval(checkProbations, 86400000);
};

module.exports = { startProbationChecker, checkProbations };
