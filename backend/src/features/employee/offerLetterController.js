const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../../config/db');
const Employee = require('./employeeModel');
const Settings = require('../settings/settingsModel');
const { sendEmployeeCredentials, sendOfferLetter } = require('../../services/mailService');

let offerLetterSchemaReady;

const ignoreSchemaError = (error) => {
  if (!['ER_DUP_FIELDNAME', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(error.code)) {
    throw error;
  }
};

const addColumnIfMissing = async (definition) => {
  try {
    await pool.execute(`ALTER TABLE offer_letters ADD COLUMN ${definition}`);
  } catch (error) {
    ignoreSchemaError(error);
  }
};

const ensureOfferLetterSchema = () => {
  if (!offerLetterSchemaReady) {
    offerLetterSchemaReady = (async () => {
      await addColumnIfMissing('tenant_id INT NULL');
      await addColumnIfMissing('candidate_name VARCHAR(255) NULL');
      await addColumnIfMissing('candidate_email VARCHAR(255) NULL');
      await addColumnIfMissing("status VARCHAR(20) NOT NULL DEFAULT 'Pending'");

      try {
        await pool.execute('ALTER TABLE offer_letters MODIFY COLUMN employee_id INT NULL');
      } catch (error) {
        if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      }

      await pool.execute(`
        UPDATE offer_letters ol
        JOIN users u ON ol.employee_id = u.id
        SET ol.tenant_id = u.tenant_id
        WHERE ol.tenant_id IS NULL
      `);
    })();
  }

  return offerLetterSchemaReady;
};

const parseJson = (value) => {
  if (!value || typeof value !== 'string') return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const splitName = (name) => {
  const parts = String(name || 'Candidate').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Candidate',
    lastName: parts.slice(1).join(' ')
  };
};

const generateSecurePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)]
  ];
  const rest = Array.from({ length: 12 }, () => all[crypto.randomInt(all.length)]);
  return [...required, ...rest]
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};

const getMoney = (formData, field, fallback = '') => {
  const direct = formData[field];
  const breakup = formData.salaryBreakup?.[field];
  const value = direct || breakup?.annual || breakup?.monthly || fallback;
  const parsed = Number(String(value || '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const numberToWords = (num) => {
  if (!num) return '';
  const clean = String(num).replace(/,/g, '').trim();
  const val = parseInt(clean, 10);
  if (isNaN(val) || val <= 0) return '';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const nStr = ('000000000' + val).slice(-9);
  const n = nStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

  const trimmed = str.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed + ' Rupees Only' : '';
};

const shapeOffer = (row) => ({
  ...row,
  form_data: parseJson(row.form_data)
});

const offerLetterController = {
  saveOfferLetter: async (req, res) => {
    try {
      await ensureOfferLetterSchema();

      const { employee_id, candidate_name, candidate_email, form_data, issue_date } = req.body;

      if (!form_data || typeof form_data !== 'object') {
        return res.status(400).json({ message: 'Offer letter details are required' });
      }

      const candidateName = String(candidate_name || form_data.fullName || form_data.employeeName || '').trim();
      const candidateEmail = normalizeEmail(candidate_email || form_data.email);

      if (!candidateName) {
        return res.status(400).json({ message: 'Candidate name is required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
        return res.status(400).json({ message: 'Valid candidate email is required' });
      }

      const normalizedFormData = {
        ...form_data,
        fullName: form_data.fullName || form_data.employeeName || candidateName,
        email: candidateEmail,
        ctcInWords: form_data.ctc ? numberToWords(form_data.ctc) : (form_data.ctcInWords || ''),
        monthlySalaryInWords: form_data.monthlySalary ? numberToWords(form_data.monthlySalary) : (form_data.monthlySalaryInWords || ''),
        salaryDuringProbationInWords: form_data.salaryDuringProbation ? numberToWords(form_data.salaryDuringProbation) : (form_data.salaryDuringProbationInWords || ''),
        salaryAfterProbationInWords: form_data.salaryAfterProbation ? numberToWords(form_data.salaryAfterProbation) : (form_data.salaryAfterProbationInWords || '')
      };

      let offerId;
      if (employee_id) {
        const [result] = await pool.execute(
          `INSERT INTO offer_letters (tenant_id, employee_id, candidate_name, candidate_email, form_data, issue_date, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Pending')
           ON DUPLICATE KEY UPDATE
             tenant_id = VALUES(tenant_id),
             candidate_name = VALUES(candidate_name),
             candidate_email = VALUES(candidate_email),
             form_data = VALUES(form_data),
             issue_date = VALUES(issue_date),
             status = 'Pending',
             updated_at = CURRENT_TIMESTAMP`,
          [req.tenantId, employee_id, candidateName, candidateEmail, JSON.stringify(normalizedFormData), issue_date]
        );
        offerId = result.insertId;
      } else {
        const [result] = await pool.execute(
          `INSERT INTO offer_letters (tenant_id, candidate_name, candidate_email, form_data, issue_date, status)
           VALUES (?, ?, ?, ?, ?, 'Pending')`,
          [req.tenantId, candidateName, candidateEmail, JSON.stringify(normalizedFormData), issue_date]
        );
        offerId = result.insertId;
      }

      try {
        await sendOfferLetter(req.tenantId, {
          candidateName,
          candidateEmail,
          formData: normalizedFormData,
          pdfBase64: req.body.pdf_base64
        });

        if (offerId) {
          await pool.execute(
            "UPDATE offer_letters SET status = 'Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?",
            [offerId, req.tenantId]
          );
        } else if (employee_id) {
          await pool.execute(
            "UPDATE offer_letters SET status = 'Sent', updated_at = CURRENT_TIMESTAMP WHERE employee_id = ? AND tenant_id = ?",
            [employee_id, req.tenantId]
          );
        }

        return res.status(200).json({
          success: true,
          message: 'Offer letter saved and emailed successfully'
        });
      } catch (emailError) {
        const isSmtpMissing = emailError.code === 'SMTP_NOT_CONFIGURED' ||
          emailError.message?.includes('SMTP_NOT_CONFIGURED') ||
          emailError.message?.includes('SMTP configuration not found') ||
          emailError.message?.includes('SMTP configuration is incomplete');

        if (isSmtpMissing) {
          return res.status(428).json({
            success: false,
            code: 'SMTP_NOT_CONFIGURED',
            smtp_not_configured: true,
            message: 'Your organization has not configured email (SMTP) settings yet. Please configure SMTP in Settings → SMTP Config to send offer letters.'
          });
        }

        return res.status(502).json({
          success: false,
          message: 'Offer letter was saved, but the email could not be sent: ' + emailError.message
        });
      }
    } catch (error) {
      console.error('Save offer letter database error:', error);
      return res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  getMyOfferLetters: async (req, res) => {
    try {
      await ensureOfferLetterSchema();

      const [letters] = await pool.execute(
        `SELECT id, form_data, issue_date, status, created_at, updated_at
         FROM offer_letters
         WHERE tenant_id = ? AND employee_id = ?
         ORDER BY updated_at DESC`,
        [req.tenantId, req.user.id]
      );

      return res.json({ letters: letters.map(shapeOffer) });
    } catch (error) {
      console.error('Get my offer letters error:', error);
      return res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  getAllOfferLetters: async (req, res) => {
    try {
      await ensureOfferLetterSchema();

      const [rows] = await pool.execute(
        `SELECT
           ol.id,
           ol.employee_id,
           ol.candidate_name,
           ol.candidate_email,
           ol.status,
           ol.form_data,
           ol.issue_date,
           ol.created_at,
           ol.updated_at,
           u.first_name,
           u.last_name,
           u.email,
           ed.id as employee_display_id
         FROM offer_letters ol
         LEFT JOIN users u ON ol.employee_id = u.id AND u.tenant_id = ol.tenant_id
         LEFT JOIN employee_details ed ON u.id = ed.employee_id AND ed.tenant_id = ol.tenant_id
         WHERE ol.tenant_id = ?
         ORDER BY ol.updated_at DESC`,
        [req.tenantId]
      );

      const processedRows = rows.map(shapeOffer);
      return res.json({ success: true, count: processedRows.length, data: processedRows });
    } catch (error) {
      console.error('Get all offer letters error:', error);
      return res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  updateOfferStatus: async (req, res) => {
    try {
      await ensureOfferLetterSchema();

      const { id } = req.params;
      const { status, new_employee_id, department_id, employment_type } = req.body;
      const normalizedStatus = String(status || '').trim();

      if (!['Pending', 'Sent', 'Accepted', 'Rejected'].includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const [offerRows] = await pool.execute(
        'SELECT * FROM offer_letters WHERE id = ? AND tenant_id = ?',
        [id, req.tenantId]
      );

      if (offerRows.length === 0) {
        return res.status(404).json({ message: 'Offer letter not found' });
      }

      const offer = offerRows[0];
      const formData = parseJson(offer.form_data);

      if (normalizedStatus !== 'Accepted') {
        await pool.execute(
          'UPDATE offer_letters SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
          [normalizedStatus, id, req.tenantId]
        );
        return res.json({ success: true, message: 'Offer status updated successfully' });
      }

      if (!new_employee_id || !department_id || !employment_type) {
        return res.status(400).json({ message: 'Employee ID, Department, and Employee Type are required' });
      }

      if (String(new_employee_id).trim().length > 20) {
        return res.status(400).json({ message: 'Employee ID must be 20 characters or less' });
      }

      const email = normalizeEmail(offer.candidate_email || formData.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Offer letter does not have a valid candidate email' });
      }

      const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      const employeeIdExists = await Employee.checkEmployeeIdExists(req.tenantId, new_employee_id);

      const validationErrors = [];
      if (employeeIdExists) {
        validationErrors.push('Employee ID already exists');
      }
      if (existingEmail.length > 0) {
        validationErrors.push('Email already exists');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ message: validationErrors.join(' and ') });
      }

      const candidateName = offer.candidate_name || formData.fullName || formData.employeeName || 'Candidate';
      const { firstName, lastName } = splitName(candidateName);
      const rawPassword = generateSecurePassword();
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const ctc = getMoney(formData, 'ctc');
      const monthlySalary = getMoney(formData, 'monthlySalary');
      const salaryDuringProbation = getMoney(formData, 'salaryDuringProbation');
      const salaryAfterProbation = getMoney(formData, 'salaryAfterProbation');
      const effectiveSalary = ctc || (monthlySalary ? monthlySalary * 12 : (salaryAfterProbation ? salaryAfterProbation * 12 : (salaryDuringProbation ? salaryDuringProbation * 12 : null)));

      const basicSalary = getMoney(formData, 'basicSalary') || (effectiveSalary ? Math.round((effectiveSalary / 12) * 0.5) : 0);
      const hra = getMoney(formData, 'hra') || (effectiveSalary ? Math.round((effectiveSalary / 12) * 0.3) : 0);
      const otherAllowance = getMoney(formData, 'specialAllowance') || (effectiveSalary ? Math.round((effectiveSalary / 12) * 0.2) : 0);

      const employeeData = {
        employee_id: new_employee_id,
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: passwordHash,
        phone: formData.phone || null,
        department_id,
        position: formData.designation || 'employee',
        employment_type,
        salary: effectiveSalary,
        salary_basic: basicSalary,
        salary_hra: hra,
        salary_medical_allowance: getMoney(formData, 'medicalAllowance'),
        salary_travel_allowance: getMoney(formData, 'conveyanceAllowance'),
        salary_other_allowance: otherAllowance,
        joining_date: formData.joiningDate || null,
        address: formData.address || null,
        is_active: true,
        status: 'active'
      };

      if (salaryDuringProbation) {
        employeeData.salary_during_probation = salaryDuringProbation;
        employeeData.salary_after_probation = salaryAfterProbation || employeeData.salary;
        employeeData.is_on_probation = true;

        if (employeeData.joining_date) {
          const probationMonthsStr = await Settings.get(req.tenantId, 'probation_months');
          const probationMonths = parseInt(probationMonthsStr, 10) || 4;
          const joiningDateObj = new Date(employeeData.joining_date);
          joiningDateObj.setMonth(joiningDateObj.getMonth() + probationMonths);
          employeeData.probation_end_date = joiningDateObj.toISOString().split('T')[0];
        }
      }

      const result = await Employee.create(req.tenantId, employeeData);

      try {
        await pool.execute(
          'INSERT INTO employee_departments (employee_id, department_id, tenant_id) VALUES (?, ?, ?)',
          [result.employee_id, department_id, req.tenantId]
        );
      } catch (tableError) {
        if (tableError.code !== 'ER_NO_SUCH_TABLE' && tableError.code !== 'ER_DUP_ENTRY') {
          await Employee.hardDelete(req.tenantId, result.employee_id);
          throw tableError;
        }
      }

      try {
        await sendEmployeeCredentials(req.tenantId, {
          employeeName: `${firstName} ${lastName}`.trim(),
          email,
          password: rawPassword
        });
      } catch (emailError) {
        await Employee.hardDelete(req.tenantId, result.employee_id);
        return res.status(502).json({
          success: false,
          message: 'Employee was not created because the credential email could not be sent: ' + emailError.message
        });
      }

      await pool.execute(
        `UPDATE offer_letters
         SET employee_id = ?, status = 'Accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND tenant_id = ?`,
        [result.user_id, id, req.tenantId]
      );

      return res.json({
        success: true,
        message: 'Offer accepted and employee created successfully',
        employee_id: result.employee_id,
        user_id: result.user_id
      });
    } catch (error) {
      console.error('Update offer status error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Employee ID or email already exists' });
      }
      return res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },

  resendOfferLetter: async (req, res) => {
    try {
      await ensureOfferLetterSchema();
      const { id } = req.params;

      const [rows] = await pool.execute(
        'SELECT * FROM offer_letters WHERE id = ? AND tenant_id = ?',
        [id, req.tenantId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Offer letter not found' });
      }

      const offer = rows[0];
      const formData = parseJson(offer.form_data);
      const candidateName = offer.candidate_name || formData.fullName || 'Candidate';
      const candidateEmail = offer.candidate_email || formData.email;

      if (!candidateEmail) {
        return res.status(400).json({ message: 'Candidate email address is missing' });
      }

      await sendOfferLetter(req.tenantId, {
        candidateName,
        candidateEmail,
        formData,
        pdfBase64: req.body.pdf_base64
      });

      await pool.execute(
        "UPDATE offer_letters SET status = 'Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?",
        [id, req.tenantId]
      );

      return res.status(200).json({
        success: true,
        message: `Offer letter emailed successfully to ${candidateEmail}`
      });
    } catch (error) {
      console.error('Resend offer letter error:', error);
      const isSmtpMissing = error.code === 'SMTP_NOT_CONFIGURED' ||
        error.message?.includes('SMTP_NOT_CONFIGURED') ||
        error.message?.includes('SMTP configuration not found') ||
        error.message?.includes('SMTP configuration is incomplete');

      if (isSmtpMissing) {
        return res.status(428).json({
          success: false,
          code: 'SMTP_NOT_CONFIGURED',
          smtp_not_configured: true,
          message: 'Your organization has not configured email (SMTP) settings yet. Please configure SMTP in Settings → SMTP Config to send offer letters.'
        });
      }

      return res.status(500).json({ message: 'Failed to send offer letter email: ' + error.message });
    }
  }
};

module.exports = offerLetterController;
