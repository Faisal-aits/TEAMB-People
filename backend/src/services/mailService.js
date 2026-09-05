const nodemailer = require('nodemailer');
const ServiceSetting = require('../features/servicesetting/serviceSettingModel');

const APP_NAME = process.env.APP_NAME || 'TEAM B People';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5175';

const createSystemTransporter = async () => {
  try {
    const ServiceSetting = require('../features/servicesetting/serviceSettingModel');
    const row = await ServiceSetting.getSetting(0, 'super_admin_smtp');
    const config = ServiceSetting.toPrivateSmtpConfig(row);

    if (config && config.host && config.username && config.password) {
      const port = Number(config.port || 587);
      const isSecure = config.encryption === 'ssl' || port === 465;
      return {
        transporter: nodemailer.createTransport({
          host: config.host,
          port,
          secure: isSecure,
          auth: {
            user: config.username,
            pass: config.password
          },
          tls: { rejectUnauthorized: false }
        }),
        config: {
          from_name: config.from_name || APP_NAME,
          from_email: config.from_email || config.username
        }
      };
    }
  } catch (err) {
    console.warn('[mailService] Failed to load super admin SMTP setting from DB:', err.message);
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || 465);
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: { rejectUnauthorized: false }
      }),
      config: {
        from_name: process.env.FROM_NAME || APP_NAME,
        from_email: process.env.FROM_EMAIL || process.env.SMTP_USER
      }
    };
  }

  return null;
};

const buildTransportOptions = (config) => {
  if (config.provider === 'outlook_graph') {
    return null; // Not applicable for Graph API
  }
  
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

  if (config.provider === 'outlook_graph') {
      const transporter = {
          sendMail: async (options) => {
              const tenantIdStr = config.azure_tenant_id;
              const clientId = config.azure_client_id;
              const clientSecret = config.azure_client_secret;
              const senderEmail = config.from_email || config.username;
              const senderName = config.from_name || APP_NAME;

              const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantIdStr)}/oauth2/v2.0/token`;
              const tokenParams = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'https://graph.microsoft.com/.default',
                grant_type: 'client_credentials'
              });

              let tokenRes;
              try {
                tokenRes = await fetch(tokenUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: tokenParams.toString()
                });
              } catch (netErr) {
                throw new Error(`Failed to connect to Microsoft Login service: ${netErr.message}`);
              }

              const tokenData = await tokenRes.json().catch(() => ({}));
              if (!tokenRes.ok) {
                const desc = tokenData.error_description || tokenData.error || 'Failed to authenticate with Microsoft 365';
                throw new Error(`Microsoft 365 Authentication Failed: ${desc}`);
              }
              const accessToken = tokenData.access_token;

              // Check if we need to send attachment
              const attachments = [];
              if (options.attachments && options.attachments.length > 0) {
                  for (const att of options.attachments) {
                      let base64Content = '';
                      if (Buffer.isBuffer(att.content)) {
                          base64Content = att.content.toString('base64');
                      } else if (typeof att.content === 'string') {
                          // Check if it's already base64 string
                          base64Content = att.content.includes('base64,') ? att.content.split('base64,')[1] : att.content;
                      }
                      attachments.push({
                          "@odata.type": "#microsoft.graph.fileAttachment",
                          "name": att.filename,
                          "contentType": att.contentType || 'application/pdf',
                          "contentBytes": base64Content
                      });
                  }
              }

              const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;
              const payload = {
                message: {
                  subject: options.subject,
                  body: { contentType: 'HTML', content: options.html },
                  toRecipients: [{ emailAddress: { address: options.to } }],
                  from: { emailAddress: { name: senderName, address: senderEmail } }
                },
                saveToSentItems: true
              };
              
              if (attachments.length > 0) {
                  payload.message.hasAttachments = true;
                  payload.message.attachments = attachments;
              }

              const sendRes = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              });
              
              if (!sendRes.ok) {
                  const errText = await sendRes.text().catch(()=>'');
                  throw new Error(`Graph API returned ${sendRes.status}: ${errText}`);
              }
              
              return true;
          },
          close: () => {}
      };
      return { transporter, config };
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
  
  if (config.provider === 'outlook_graph') {
      if (!config.azure_tenant_id || !config.azure_client_id || !config.azure_client_secret) {
          throw new Error('Microsoft 365 configuration is incomplete');
      }
      return true;
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
      <h2 style="margin: 0 0 16px; color: #111827;">Welcome to ${APP_NAME}</h2>
      <p>Hello ${safeName},</p>
      <p>Your ${APP_NAME} employee account has been created. Use the credentials below to sign in.</p>
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
            <a href="${FRONTEND_URL}">${FRONTEND_URL}</a>
          </td>
        </tr>
      </table>
      <p style="color: #92400e;">Please change this password after your first login.</p>
      <p>Regards,<br />${APP_NAME} Team</p>
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
      <p>Regards,<br />${APP_NAME} Team</p>
    </div>
  `;
};

const buildPasswordResetTemplate = ({ userName, resetLink }) => {
  const safeName = escapeHtml(userName || 'there');
  const safeResetLink = escapeHtml(resetLink);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 16px; color: #111827;">Reset Your ${APP_NAME} Password</h2>
      <p>Hello ${safeName},</p>
      <p>We received a request to reset your ${APP_NAME} password. Use the button below to choose a new password.</p>
      <p style="margin: 24px 0;">
        <a href="${safeResetLink}" style="background: #6d5dfc; color: #ffffff; padding: 12px 18px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>Regards,<br />${APP_NAME} Team</p>
    </div>
  `;
};

const sendMail = async (tenantId, { to, subject, html, text, attachments }) => {
  const { transporter, config } = await createTransportForTenant(tenantId);
  const fromName = config.from_name || APP_NAME;
  const fromEmail = config.from_email || config.username;

  try {
    return await transporter.sendMail({
      from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
      attachments
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
  subject: `Welcome to ${APP_NAME} - Login Credentials for ${employee.employeeName || employee.email} (${new Date().toLocaleTimeString()})`,
  html: buildCredentialsTemplate(employee),
  text: [
    `Hello ${employee.employeeName},`,
    '',
    `Your ${APP_NAME} employee account has been created.`,
    `Login Email: ${employee.email}`,
    `Temporary Password: ${employee.password}`,
    'Login URL: ${FRONTEND_URL}',
    '',
    'Please change this password after your first login.'
  ].join('\n')
});

const sendTestEmail = async (tenantId, to) => sendMail(tenantId, {
  to,
  subject: `${APP_NAME} SMTP Test Email`,
  html: `<p>Your ${APP_NAME} SMTP configuration is working.</p>`,
  text: `Your ${APP_NAME} SMTP configuration is working.`
});

const sendPasswordResetEmail = async (tenantId, user) => sendMail(tenantId, {
  to: user.email,
  subject: `Reset Your ${APP_NAME} Password`,
  html: buildPasswordResetTemplate(user),
  text: [
    `Hello ${user.userName || 'there'},`,
    '',
    `We received a request to reset your ${APP_NAME} password.`,
    `Reset link: ${user.resetLink}`,
    '',
    'This link will expire in 1 hour.',
    'If you did not request this, you can ignore this email.',
    '',
    'Regards,',
    `${APP_NAME} Team`
  ].join('\n')
});

const sendOfferLetter = async (tenantId, offer) => sendMail(tenantId, {
  to: offer.candidateEmail,
  subject: `Offer Letter - ${offer.formData.designation || APP_NAME}`,
  html: buildOfferLetterTemplate(offer),
  text: [
    `Hello ${offer.candidateName || offer.formData.fullName || 'Candidate'},`,
    '',
    `We are pleased to share your offer letter details for ${offer.formData.designation || 'the offered role'}.`,
    `Joining Date: ${offer.formData.joiningDate || 'as discussed'}`,
    `Annual CTC: ${offer.formData.ctc || offer.formData.salaryBreakup?.ctc?.annual || '-'}`,
    '',
    'Please review the offer and contact HR for acceptance or any clarification.',
    'Regards,',
    `${APP_NAME} Team`
  ].join('\n'),
  attachments: offer.pdfBase64 ? [
    {
      filename: `Offer_Letter_${(offer.candidateName || offer.formData.fullName || 'Candidate').replace(/\s+/g, '_')}.pdf`,
      content: offer.pdfBase64.includes('base64,') ? offer.pdfBase64.split('base64,')[1] : offer.pdfBase64,
      encoding: 'base64'
    }
  ] : []
});

const sendSalarySlip = async (tenantId, { to, name, monthName, year, pdfBuffer }) => {
  const { transporter, config } = await createTransportForTenant(tenantId);
  const fromName = config.from_name || APP_NAME;
  const fromEmail = config.from_email || config.username;
  const safeName = escapeHtml(name || 'Employee');
  const safeMonth = escapeHtml(`${monthName} ${year}`);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 16px; color: #111827;">Salary Slip — ${safeMonth}</h2>
      <p>Hello ${safeName},</p>
      <p>Please find attached your salary slip for <strong>${safeMonth}</strong>.</p>
      <p>If you have any questions regarding your salary, please contact the HR department.</p>
      <p>Regards,<br />${APP_NAME} Team</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
    to,
    subject: `Salary Slip for ${monthName} ${year} — ${APP_NAME}`,
    html,
    text: `Hello ${name},\n\nPlease find attached your salary slip for ${monthName} ${year}.\n\nRegards,\n${APP_NAME} Team`,
    attachments: [
      {
        filename: `SalarySlip_${(name || '').replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
};

const sendOrganizationWelcomeEmail = async ({ tenantId, orgName, slug, adminName, adminEmail, adminPassword, plan, maxEmployees }) => {
  let transporter, config;
  
  // Try Super Admin system SMTP first (configured in Super Admin SMTP panel)
  const sysRes = await createSystemTransporter();
  if (sysRes) {
    transporter = sysRes.transporter;
    config = sysRes.config;
  } else {
    try {
      const res = await createTransportForTenant(tenantId);
      transporter = res.transporter;
      config = res.config;
    } catch (err) {
      console.warn('[mailService] System & Tenant SMTP not configured for organization welcome email:', err.message);
      return false;
    }
  }

  const fromName = config.from_name || APP_NAME;
  const fromEmail = config.from_email || config.username;
  const loginUrl = `${FRONTEND_URL}/login`;

  const safeOrgName = escapeHtml(orgName);
  const safeSlug = escapeHtml(slug);
  const safeAdminName = escapeHtml(adminName || 'Admin');
  const safeAdminEmail = escapeHtml(adminEmail);
  const safePassword = escapeHtml(adminPassword);
  const safeUrl = escapeHtml(loginUrl);
  const safePlan = escapeHtml(plan || 'Free');
  const safeMax = escapeHtml(maxEmployees || 'Unlimited');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; padding: 24px; background-color: #ffffff;">
      <div style="background-color: #4f46e5; padding: 20px 24px; margin: -24px -24px 24px -24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 Welcome to ${APP_NAME}!</h2>
      </div>
      <p style="font-size: 16px;">Hello <strong>${safeAdminName}</strong>,</p>
      <p>Congratulations! Your organization <strong>${safeOrgName}</strong> has been successfully created on <strong>${APP_NAME}</strong>.</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4f46e5; font-size: 16px;">🔑 Your Admin Credentials & Workspace URL</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600; width: 140px;">Organization:</td>
            <td style="padding: 6px 0; color: #111827; font-weight: 700;">${safeOrgName} (${safeSlug})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Login Email:</td>
            <td style="padding: 6px 0; color: #111827; font-weight: 700;">${safeAdminEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Password:</td>
            <td style="padding: 6px 0; color: #2563eb; font-weight: 700;">${safePassword}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Plan:</td>
            <td style="padding: 6px 0; color: #059669; font-weight: 700;">${safePlan} (${safeMax} Employees)</td>
          </tr>
        </table>
      </div>

      <p style="margin: 28px 0; text-align: center;">
        <a href="${safeUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">Sign In to Your Workspace ↗</a>
      </p>

      <p style="font-size: 13px; color: #92400e; background-color: #fffbebfb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
        💡 <strong>Security Note:</strong> For security reasons, please log in and change your password after your first login.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        Sent automatically by ${APP_NAME} Platform.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
    to: adminEmail,
    subject: `Welcome to ${APP_NAME} — Access Credentials for ${orgName}`,
    html,
    text: `Welcome to ${APP_NAME}!\n\nYour organization ${orgName} has been created.\n\nLogin URL: ${loginUrl}\nEmail: ${adminEmail}\nPassword: ${adminPassword}\n\nPlease change your password upon your first login.`
  });
};


const sendBulkEmployeeCredentials = async (tenantId, employeesArray) => {
  if (!tenantId || !employeesArray || employeesArray.length === 0) return [];

  const config = await ServiceSetting.getPrivateSmtpConfig(tenantId);
  if (!config) {
    throw new Error('SMTP_NOT_CONFIGURED: Your organization has not configured email settings yet.');
  }

  const results = [];

  // 1. Microsoft 365 (Modern Auth / Graph API)
  if (config.provider === 'outlook_graph') {
    const tenantIdStr = config.azure_tenant_id;
    const clientId = config.azure_client_id;
    const clientSecret = config.azure_client_secret;
    const senderEmail = config.from_email || config.username;
    const senderName = config.from_name || APP_NAME;

    if (!tenantIdStr || !clientId || !clientSecret || !senderEmail) {
      throw new Error('SMTP_NOT_CONFIGURED: Microsoft 365 configuration is incomplete.');
    }

    // Get Token ONCE for all bulk emails
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantIdStr)}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    let tokenRes;
    try {
      tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });
    } catch (netErr) {
      throw new Error(`Failed to connect to Microsoft Login service: ${netErr.message}`);
    }

    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      const desc = tokenData.error_description || tokenData.error || 'Failed to authenticate with Microsoft 365';
      throw new Error(`Microsoft 365 Authentication Failed: ${desc}`);
    }
    const accessToken = tokenData.access_token;

    // Send emails concurrently
    const sendPromises = employeesArray.map(async (employee) => {
      const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;
      const html = buildCredentialsTemplate(employee);
      
      const payload = {
        message: {
          subject: `Welcome to ${APP_NAME} - Login Credentials for ${employee.employeeName || employee.email} (${new Date().toLocaleTimeString()})`,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: employee.email } }],
          from: { emailAddress: { name: senderName, address: senderEmail } }
        },
        saveToSentItems: true
      };

      try {
        const sendRes = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!sendRes.ok) throw new Error(`Graph API returned ${sendRes.status}`);
        results.push({ email: employee.email, success: true });
        // 3 second delay for Graph API as well
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        results.push({ email: employee.email, success: false, error: err.message });
      }
    });

    await Promise.all(sendPromises);
    return results;
  }

  // 2. Standard SMTP (Gmail / Custom SMTP)
  if (!config.host || !config.username || !config.password) {
    throw new Error('SMTP_NOT_CONFIGURED: Your organization has not configured email (SMTP) settings yet.');
  }

  // Create transporter ONCE
  const transporterOptions = buildTransportOptions(config);
  // Optional: add connection pooling for efficiency in bulk operations
  transporterOptions.pool = true; 
  transporterOptions.maxConnections = 3;
  transporterOptions.maxMessages = 100;

  const transporter = nodemailer.createTransport(transporterOptions);
  const fromName = config.from_name || APP_NAME;
  const fromEmail = config.from_email || config.username;

  try {
    for (const employee of employeesArray) {
      try {
        const html = buildCredentialsTemplate(employee);
        await transporter.sendMail({
          from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
          to: employee.email,
          subject: `Welcome to ${APP_NAME} - Login Credentials for ${employee.employeeName || employee.email} (${new Date().toLocaleTimeString()})`,
          html,
          text: `Your ${APP_NAME} employee account has been created. Login Email: ${employee.email}`
        });
        results.push({ email: employee.email, success: true });
        
        // Small delay to prevent SMTP throttling
        await new Promise(r => setTimeout(r, 3000)); // 3 second delay to fully bypass rate limits
      } catch (err) {
        results.push({ email: employee.email, success: false, error: err.message });
      }
    }
  } finally {
    transporter.close();
  }

  return results;
};

module.exports = {
  sendBulkEmployeeCredentials,
  assertSmtpConfigured,
  sendEmployeeCredentials,
  sendOfferLetter,
  sendPasswordResetEmail,
  sendTestEmail,
  sendSalarySlip,
  sendOrganizationWelcomeEmail
};
