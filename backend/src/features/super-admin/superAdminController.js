// controllers/superAdminController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('./superAdminModel');
const Tenant = require('./tenantModel');
const { pool } = require('../../config/db');

const superAdminController = {
    // Super Admin Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email and password are required' 
                });
            }

            const admin = await SuperAdmin.findByEmail(email);
            if (!admin) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid credentials' 
                });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error('FATAL ERROR: JWT_SECRET is not defined');
            }

            const token = jwt.sign(
                {
                    id: admin.id,
                    email: admin.email,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    is_super_admin: true
                },
                process.env.JWT_SECRET,
                { expiresIn: '12h' }
            );

            res.cookie('auth_token', token, {
                maxAge: 12 * 60 * 60 * 1000,
                httpOnly: false,
                sameSite: 'lax',
                path: '/'
            });

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: admin.id,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    email: admin.email,
                    role: 'super_admin'
                }
            });
        } catch (error) {
            console.error('Super admin login error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error: ' + error.message 
            });
        }
    },

    // Get Super Admin Profile
    getProfile: async (req, res) => {
        try {
            const admin = await SuperAdmin.findById(req.user.id);
            if (!admin) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Admin not found' 
                });
            }
            res.json({ 
                success: true,
                user: { ...admin, role: 'super_admin' } 
            });
        } catch (error) {
            console.error('Get super admin profile error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    // Get Dashboard Stats
    getDashboard: async (req, res) => {
        try {
            const stats = await Tenant.getDashboardStats();
            res.json(stats);
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    // Get All Tenants
    getTenants: async (req, res) => {
        try {
            const { search, is_active } = req.query;
            const filters = {};
            if (search) filters.search = search;
            if (is_active !== undefined) filters.is_active = is_active === 'true';

            const tenants = await Tenant.getAll(filters);
            res.json({ tenants });
        } catch (error) {
            console.error('Get tenants error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    // Get Single Tenant
    getTenantById: async (req, res) => {
        try {
            const tenant = await Tenant.getById(req.params.id);
            if (!tenant) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Tenant not found' 
                });
            }

            // Get tenant's users
            const [users] = await pool.execute(
                `SELECT id, first_name, last_name, email, phone, position, is_active, created_at
                 FROM users 
                 WHERE tenant_id = ?`,
                [req.params.id]
            );

            res.json({ tenant, users });
        } catch (error) {
            console.error('Get tenant error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    // Create New Tenant
    createTenant: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { 
                name, slug, email, phone, address, logo_url,
                subscription_plan, max_employees,
                admin_first_name, admin_last_name, admin_email, admin_password 
            } = req.body;

            // Validate required fields
            if (!name || !slug || !email) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Name, slug, and email are required' 
                });
            }

            const finalAdminEmail = admin_email || email;
            const finalAdminFirstName = admin_first_name || 'Admin';
            const finalAdminLastName = admin_last_name || name;
            const rawPassword = (admin_password && admin_password.trim()) 
                ? admin_password.trim() 
                : `Pass@${Math.floor(100000 + Math.random() * 900000)}`;

            await connection.beginTransaction();

            // Check email and slug uniqueness in tenants table
            const [existingTenant] = await connection.execute(
                'SELECT id, email, slug FROM tenants WHERE LOWER(email) = LOWER(?) OR LOWER(email) = LOWER(?) OR LOWER(slug) = LOWER(?)',
                [email, finalAdminEmail, slug]
            );
            if (existingTenant.length > 0) {
                await connection.rollback();
                const matched = existingTenant[0];
                if (matched.slug?.toLowerCase() === slug.toLowerCase()) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'An organization already exists with this URL slug. Please use a different slug.' 
                    });
                }
                return res.status(400).json({ 
                    success: false,
                    message: 'An organization already exists with this email. Please use a different email address.' 
                });
            }

            // Check if admin email already exists in users table
            const [existingUser] = await connection.execute(
                'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
                [finalAdminEmail]
            );
            if (existingUser.length > 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false,
                    message: 'An organization already exists with this email. Please use a different email address.' 
                });
            }

            // Create tenant
            const tenantId = await Tenant.create({
                name, slug, email, phone, address, logo_url,
                subscription_plan, max_employees
            }, connection);

            // Create the first tenant user as a system admin.
            const passwordHash = await bcrypt.hash(rawPassword, 10);

            await connection.execute(
                `INSERT INTO users (tenant_id, first_name, last_name, email, password_hash, position, is_active) 
                 VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
                [tenantId, finalAdminFirstName, finalAdminLastName, finalAdminEmail, passwordHash]
            );

            // Create default BIM department for new tenant
            await connection.execute(
                `INSERT INTO departments (tenant_id, name, description) 
                 VALUES (?, ?, ?)`,
                [tenantId, 'BIM', 'Building Information Modeling']
            );

            // Create default Food reimbursement category for new tenant (limit 2000)
            await connection.execute(
                `INSERT INTO expense_categories (tenant_id, name, limit_amount, description) 
                 VALUES (?, ?, ?, ?)`,
                [tenantId, 'Food', 2000, 'Food & Meals reimbursement']
            );

            await connection.commit();


            // Send Welcome Email (optional — org is created regardless)
            let emailSent = false;
            try {
                const { sendOrganizationWelcomeEmail } = require('../../services/mailService');
                console.log(`[createTenant] Sending welcome email to: ${finalAdminEmail}`);
                const mailResult = await sendOrganizationWelcomeEmail({
                    tenantId,
                    orgName: name,
                    slug,
                    adminName: `${finalAdminFirstName} ${finalAdminLastName}`.trim(),
                    adminEmail: finalAdminEmail,
                    adminPassword: rawPassword,
                    plan: subscription_plan || 'Free',
                    maxEmployees: max_employees || 'Unlimited'
                });
                console.log(`[createTenant] Welcome email result:`, JSON.stringify(mailResult?.envelope || mailResult));
                emailSent = true;
            } catch (mailErr) {
                console.warn('[createTenant] Welcome email skipped:', mailErr.message);
            }

            res.status(201).json({
                success: true,
                message: emailSent
                    ? `Organization created! Welcome email sent to ${finalAdminEmail}`
                    : `Organization created! Admin: ${finalAdminEmail} | Password: ${rawPassword}`,
                tenant: {
                    id: tenantId,
                    name,
                    slug,
                    email: finalAdminEmail,
                    subscription_plan: subscription_plan || 'free',
                    admin_email: finalAdminEmail,
                    generated_password: rawPassword
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create tenant error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error: ' + error.message 
            });
        } finally {
            connection.release();
        }
    },

    // Update Tenant
    updateTenant: async (req, res) => {
        try {
            const updated = await Tenant.update(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Tenant not found' 
                });
            }
            res.json({ 
                success: true,
                message: 'Tenant updated successfully' 
            });
        } catch (error) {
            console.error('Update tenant error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    // Permanently Delete Tenant and all associated data
    deleteTenant: async (req, res) => {
        try {
            const deleted = await Tenant.hardDelete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Organization not found' 
                });
            }
            res.json({ 
                success: true,
                message: 'Organization and all associated data permanently deleted from database' 
            });
        } catch (error) {
            console.error('Permanent delete tenant error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to permanently delete organization: ' + error.message 
            });
        }
    },

    getSmtpConfig: async (req, res) => {
        try {
            const ServiceSetting = require('../servicesetting/serviceSettingModel');
            const row = await ServiceSetting.getSetting(0, 'super_admin_smtp');
            let config = ServiceSetting.toPublicSmtpConfig(row);

            if (!config || !config.host) {
                config = {
                    host: 'smtp.gmail.com',
                    port: 587,
                    username: 'kf94482@gmail.com',
                    from_email: 'kf94482@gmail.com',
                    from_name: 'TEAM B People',
                    encryption: 'tls',
                    has_password: false
                };
            }

            res.json({ success: true, smtp: config });
        } catch (error) {
            console.error('Get super admin SMTP config error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    updateSmtpConfig: async (req, res) => {
        try {
            const { host, port, username, password, from_email, from_name, encryption } = req.body;
            const ServiceSetting = require('../servicesetting/serviceSettingModel');

            const row = await ServiceSetting.getSetting(0, 'super_admin_smtp');
            let passwordValue = row?.smtp_password || null;

            if (password) {
                passwordValue = ServiceSetting.encryptSecret(password);
            }

            const finalHost = host || 'smtp.gmail.com';
            const finalPort = Number(port) || 587;
            const finalUser = username || 'kf94482@gmail.com';
            const finalFromEmail = from_email || finalUser;
            const finalFromName = from_name || 'TEAM B People';
            const finalEncryption = encryption || 'tls';

            await ServiceSetting.upsertSetting(0, 'super_admin_smtp', {
                smtp_host: finalHost,
                smtp_port: finalPort,
                smtp_user: finalUser,
                smtp_password: passwordValue,
                smtp_from_email: finalFromEmail,
                smtp_from_name: finalFromName,
                smtp_encryption: finalEncryption,
                smtp_secure: finalEncryption === 'ssl' || finalPort === 465 ? 1 : 0
            });

            res.json({ success: true, message: 'Super Admin Gmail App Password saved successfully' });
        } catch (error) {
            console.error('Update super admin SMTP config error:', error);
            res.status(500).json({ success: false, message: 'Failed to save SMTP configuration: ' + error.message });
        }
    },

    testSmtpConfig: async (req, res) => {
        try {
            const { to } = req.body;
            if (!to) {
                return res.status(400).json({ success: false, message: 'Recipient email is required' });
            }

            const ServiceSetting = require('../servicesetting/serviceSettingModel');
            const row = await ServiceSetting.getSetting(0, 'super_admin_smtp');
            const config = ServiceSetting.toPrivateSmtpConfig(row);

            if (!config || !config.host || !config.username || !config.password) {
                return res.status(400).json({ success: false, message: 'Super Admin SMTP is not configured or missing password' });
            }

            const nodemailer = require('nodemailer');
            const port = Number(config.port || 587);
            const isSecure = config.encryption === 'ssl' || port === 465;

            const transporter = nodemailer.createTransport({
                host: config.host,
                port,
                secure: isSecure,
                auth: {
                    user: config.username,
                    pass: config.password
                },
                tls: { rejectUnauthorized: false }
            });

            const fromName = config.from_name || 'TEAM B People';
            const fromEmail = config.from_email || config.username;

            await transporter.sendMail({
                from: `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`,
                to,
                subject: 'TEAM B People Super Admin SMTP Test',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #111827;"><h2 style="color: #4f46e5;">🎉 Super Admin SMTP Test Successful!</h2><p>Your Super Admin SMTP configuration is working properly.</p></div>`,
                text: 'Your Super Admin SMTP configuration is working properly.'
            });

            res.json({ success: true, message: `Test email sent successfully to ${to}` });
        } catch (error) {
            console.error('Test super admin SMTP error:', error);
            res.status(400).json({ success: false, message: 'SMTP Test Failed: ' + error.message });
        }
    }
};

module.exports = superAdminController;
