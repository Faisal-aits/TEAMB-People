// backend/src/jobs/incrementChecker.js
const { pool } = require('../config/db');
const { calculatePayroll } = require('../features/employee/employeePayroll');

const checkIncrements = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Find increments that are effective today
    const [increments] = await pool.execute(
      "SELECT * FROM increment_letters WHERE DATE(effective_date) = ?",
      [today]
    );

    for (const inc of increments) {
      const { employee_id, tenant_id, revised_ctc } = inc;
      
      const [empRows] = await pool.execute(
        "SELECT salary, salary_basic, salary_hra, salary_medical_allowance, salary_travel_allowance, salary_other_allowance FROM employee_details WHERE id = ? AND tenant_id = ?",
        [employee_id, tenant_id]
      );
      
      if (empRows.length > 0) {
        const emp = empRows[0];
        const oldSalary = Number(emp.salary) || 1;
        const newSalary = Number(revised_ctc);
        
        if (oldSalary === newSalary) continue;

        const ratio = newSalary / oldSalary;
        
        let newBasic = newSalary;
        let newHra = 0;
        let newMedical = 0;
        let newTravel = 0;
        let newOther = 0;

        const payroll = calculatePayroll({
            salary_basic: newBasic,
            salary_hra: newHra,
            salary_medical_allowance: newMedical,
            salary_travel_allowance: newTravel,
            salary_other_allowance: newOther
        });

        await pool.execute(
            "UPDATE employee_details SET salary = ?, salary_after_probation = ?, salary_basic = ?, salary_hra = ?, salary_medical_allowance = ?, salary_travel_allowance = ?, salary_other_allowance = ?, salary_gross = ?, salary_pf = ?, salary_esic = ?, salary_professional_tax = ?, salary_lwf = ?, salary_total_deduction = ?, salary_net = ?, employer_pf = ?, employer_esic = ? WHERE id = ? AND tenant_id = ?",
            [
                newSalary, newSalary, newBasic, newHra, newMedical, newTravel, newOther,
                payroll.salary_gross, payroll.salary_pf, payroll.salary_esic, payroll.salary_professional_tax, payroll.salary_lwf, payroll.salary_total_deduction, payroll.salary_net, payroll.employer_pf, payroll.employer_esic,
                employee_id, tenant_id
            ]
        );
      }
    }
  } catch (error) {
    console.error('Increment Checker Job Error:', error);
  }
};

const startIncrementChecker = () => {
  checkIncrements();
  setInterval(checkIncrements, 86400000);
};

module.exports = { startIncrementChecker, checkIncrements };
