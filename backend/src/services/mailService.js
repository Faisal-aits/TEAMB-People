const nodemailer = require('nodemailer');
const ServiceSetting = require('../features/servicesetting/serviceSettingModel');

const buildTransportOptions = (config) => {
  if (!config?.host || !config?.port || !config?.username || !config?.password) {
    throw new Error('SMTP configuration is incomplete');
  }

  const port = Number(config.port);
  const encryption = config.encryption || 'tls';

  // Port 465 always uses implicit SSL; 587 and 25 use STARTTLS
  const isSecure = encryption === 'ssl' || port === 465;

  const options = {
    host: config.host,
    port,
    secure: isSecure,
    auth: {
      user: config.username,
      pass: config.password
    },
    tls: {
      // Allow self-signed or internally-issued certificates
      rejectUnauthorized: false
    }
  };

  if (!isSecure && encryption !== 'none') {
    // For STARTTLS (port 587) require the TLS upgrade
    options.requireTLS = true;
  }

  if (encryption === 'none') {
    options.ignoreTLS = true;
  }

  return options;
};

const createTransportForTenant = async (tenantId) => {
  const config = await ServiceSetting.getPrivateSmtpConfig(tenantId);
  if (!config) {
    throw new Error('SMTP configuration not found');
  }

  const transporter = nodemailer.createTransport(buildTransportOptions(config));
  return { transporter, config };
};

const assertSmtpConfigured = async (tenantId) => {
  const config = await ServiceSetting.getPrivateSmtpConfig(tenantId);
  if (!config) {
    throw new Error('SMTP configuration not found');
  }

  if (!config.from_email || !config.from_name) {
    throw new Error('SMTP configuration is incomplete');
  }

  buildTransportOptions(config);
  return true;
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildCredentialsTemplate = ({ employeeName, email, password }) => {
  const safeName = escapeHtml(employeeName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 16px; color: #111827;">Welcome to Work Desk</h2>
      <p>Hello ${safeName},</p>
      <p>Your Work Desk employee account has been created. Use the credentials below to sign in.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Login Email</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Temporary Password</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${safePassword}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Login URL</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">
            <a href="https://work-desk.tech">https://work-desk.tech</a>
          </td>
        </tr>
      </table>
      <p style="color: #92400e;">Please change this password after your first login.</p>
      <p>Regards,<br />Work Desk Team</p>
    </div>
  `;
};

const buildOfferLetterTemplate = ({ candidateName, formData }) => {
  const safeName = escapeHtml(candidateName || formData.fullName || 'Candidate');
  const safeDesignation = escapeHtml(formData.designation || 'the offered role');
  const safeJoiningDate = escapeHtml(formData.joiningDate || 'as discussed');
  const safeCtc = escapeHtml(formData.ctc || formData.salaryBreakup?.ctc?.annual || '');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 16px; color: #111827;">Offer Letter</h2>
      <p>Hello ${safeName},</p>
      <p>We are pleased to share your offer letter details for <strong>${safeDesignation}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Designation</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeDesignation}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Joining Date</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeJoiningDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f3f4f6; font-weight: 700;">Annual CTC</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb;">${safeCtc || '-'}</td>
        </tr>
      </table>
      <p>Please review the offer and contact HR for acceptance or any clarification.</p>
      <p>Regards,<br />Work Desk Team</p>
    </div>
  `;
};

const buildPasswordResetTemplate = ({ userName, resetLink }) => {
  const safeName = escapeHtml(userName || 'there');
  const safeResetLink = escapeHtml(resetLink);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 16px; color: #111827;">Reset Your Work Desk Password</h2>
      <p>Hello ${safeName},</p>
      <p>We received a request to reset your Work Desk password. Use the button below to choose a new password.</p>
      <p style="margin: 24px 0;">
        <a href="${safeResetLink}" style="background: #6d5dfc; color: #ffffff; padding: 12px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>Regards,<br />Work Desk Team</p>
    </div>
  `;
};

const sendMail = async (tenantId, { to, subject, html, text }) => {
  const { transporter, config } = await createTransportForTenant(tenantId);
  const fromName = config.from_name || 'Work Desk';
  const fromEmail = config.from_email || config.username;

  try {
    return await transporter.sendMail({
      from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
      to,
      subject,
      html,
      text
    });
  } catch (err) {
    console.error('[mailService] sendMail failed:', {
      host: config.host,
      port: config.port,
      encryption: config.encryption,
      username: config.username,
      from_email: fromEmail,
      to,
      error: err.message
    });
    throw err;
  }
};

const sendEmployeeCredentials = async (tenantId, employee) => sendMail(tenantId, {
  to: employee.email,
  subject: 'Your Work Desk Login Credentials',
  html: buildCredentialsTemplate(employee),
  text: [
    `Hello ${employee.employeeName},`,
    '',
    'Your Work Desk employee account has been created.',
    `Login Email: ${employee.email}`,
    `Temporary Password: ${employee.password}`,
    'Login URL: https://work-desk.tech',
    '',
    'Please change this password after your first login.'
  ].join('\n')
});

const sendTestEmail = async (tenantId, to) => sendMail(tenantId, {
  to,
  subject: 'Work Desk SMTP Test Email',
  html: '<p>Your Work Desk SMTP configuration is working.</p>',
  text: 'Your Work Desk SMTP configuration is working.'
});

const sendPasswordResetEmail = async (tenantId, user) => sendMail(tenantId, {
  to: user.email,
  subject: 'Reset Your Work Desk Password',
  html: buildPasswordResetTemplate(user),
  text: [
    `Hello ${user.userName || 'there'},`,
    '',
    'We received a request to reset your Work Desk password.',
    `Reset link: ${user.resetLink}`,
    '',
    'This link will expire in 1 hour.',
    'If you did not request this, you can ignore this email.',
    '',
    'Regards,',
    'Work Desk Team'
  ].join('\n')
});

const sendOfferLetter = async (tenantId, offer) => sendMail(tenantId, {
  to: offer.candidateEmail,
  subject: `Offer Letter - ${offer.formData.designation || 'Work Desk'}`,
  html: buildOfferLetterTemplate(offer),
  text: [
    `Hello ${offer.candidateName || offer.formData.fullName || 'Candidate'},`,
    '',
    `We are pleased to share your offer letter details for ${offer.formData.designation || 'the offered role'}.`,
    `Joining Date: ${offer.formData.joiningDate || 'as discussed'}`,
    `Annual CTC: ${offer.formData.ctc || offer.formData.salaryBreakup?.ctc?.annual || '-'}`,
    '',
    'Please review the offer and contact HR for acceptance or any clarification.',
    '',
    'Regards,',
    'Work Desk Team'
  ].join('\n')
});

module.exports = {
  assertSmtpConfigured,
  sendEmployeeCredentials,
  sendOfferLetter,
  sendPasswordResetEmail,
  sendTestEmail
};
