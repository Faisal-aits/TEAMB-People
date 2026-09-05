import sys

with open('backend/src/services/mailService.js', 'r', encoding='utf-8') as f:
    content = f.read()

target_build = '''const buildTransportOptions = (config) => {
  if (!config?.host || !config?.port || !config?.username || !config?.password) {
    throw new Error('SMTP configuration is incomplete');
  }'''
  
replacement_build = '''const buildTransportOptions = (config) => {
  if (config.provider === 'outlook_graph') {
    return null; // Not applicable for Graph API
  }
  
  if (!config?.host || !config?.port || !config?.username || !config?.password) {
    throw new Error('SMTP configuration is incomplete');
  }'''

if target_build in content:
    content = content.replace(target_build, replacement_build)
    
target_assert = '''const assertSmtpConfigured = async (tenantId) => {
  const config = await ServiceSetting.getPrivateSmtpConfig(tenantId);
  if (!config) {
    throw new Error('SMTP configuration not found');
  }

  if (!config.from_email || !config.from_name) {
    throw new Error('SMTP configuration is incomplete');
  }

  buildTransportOptions(config);
  return true;
};'''

replacement_assert = '''const assertSmtpConfigured = async (tenantId) => {
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
};'''

if target_assert in content:
    content = content.replace(target_assert, replacement_assert)

target_create = '''const createTransportForTenant = async (tenantId) => {
  const config = await ServiceSetting.getPrivateSmtpConfig(tenantId);
  if (!config) {
    throw new Error('SMTP configuration not found');
  }

  const transporter = nodemailer.createTransport(buildTransportOptions(config));
  return { transporter, config };
};'''

replacement_create = '''const createTransportForTenant = async (tenantId) => {
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
                      attachments.push({
                          "@odata.type": "#microsoft.graph.fileAttachment",
                          "name": att.filename,
                          "contentType": att.contentType,
                          "contentBytes": att.content.toString('base64')
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
};'''

if target_create in content:
    content = content.replace(target_create, replacement_create)

with open('backend/src/services/mailService.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched mailService.js")
