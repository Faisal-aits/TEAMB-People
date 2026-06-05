const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../users/user.repository');
const { query } = require('../../config/db');
const moduleAccessModel = require('../moduleAccess/moduleAccessModel');
const { sendPasswordResetEmail } = require('../../services/mailService');
const { ensurePasswordResetSchema } = require('./passwordResetSchema');

const PASSWORD_RESET_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';

const hashResetToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

const getFrontendUrl = (req) => (
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  process.env.APP_URL ||
  req.get('origin') ||
  'http://localhost:5173'
).replace(/\/+$/, '');

const authController = {
  login: async (req, res) => {
    try {
      
      const email = req.body.email?.trim();
      const password = req.body.password;
      const tenant_slug = (req.body.tenant_slug || req.body.tenantSlug || '').trim();

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      let tenant = null;
      let user = null;

      if (tenant_slug) {
        const tenantRows = await query(
          'SELECT id, name, slug, is_active FROM tenants WHERE slug = ?',
          [tenant_slug]
        );

        if (tenantRows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Organization not found'
          });
        }

        tenant = tenantRows[0];
        if (!tenant.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Organization is deactivated'
          });
        }

        const userRows = await query(`
          SELECT id, tenant_id, first_name, last_name, email, phone, 
                 position, password_hash, is_active, created_at, updated_at
          FROM users 
          WHERE LOWER(email) = LOWER(?) AND tenant_id = ?
        `, [email, tenant.id]);

        user = userRows[0] || null;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      } else {
        const userRows = await query(`
          SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email, u.phone,
                 u.position, u.password_hash, u.is_active, u.created_at, u.updated_at,
                 t.name AS tenant_name, t.slug AS tenant_slug, t.is_active AS tenant_is_active
          FROM users u
          INNER JOIN tenants t ON t.id = u.tenant_id
          WHERE LOWER(u.email) = LOWER(?)
          ORDER BY u.is_active DESC, u.id ASC
        `, [email]);

        user = userRows[0] || null;

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        tenant = {
          id: user.tenant_id,
          name: user.tenant_name,
          slug: user.tenant_slug,
          is_active: user.tenant_is_active
        };

        if (!tenant.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Organization is deactivated'
          });
        }
      }

     
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated. Please contact administrator.'
        });
      }

      let isPasswordValid = false;
      let isFirstLogin = false;

      if (!user.password_hash) {
       
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        await query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);
        isPasswordValid = true;
        isFirstLogin = true;
      } else {
      
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      await moduleAccessModel.updateLastActive(user.id);

      const isAdmin = user.position === 'admin';
      const modules = await moduleAccessModel.getModulesForUser(
        user.id,
        tenant.id,
        isAdmin
      );

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          position: user.position,
          first_name: user.first_name,
          last_name: user.last_name,
          tenant_id: tenant.id
        },
        process.env.JWT_SECRET || 'arham_simple_secret_2023',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: isFirstLogin ? 'Account created successfully! Welcome!' : 'Login successful',
        token: token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || '',
          position: user.position,
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          modules,
        },
        firstLogin: isFirstLogin
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  },

 getProfile: async (req, res) => {
    try {
     

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await query(`
        SELECT id, tenant_id, first_name, last_name, email, phone, 
               position, is_active, created_at, updated_at
        FROM users 
        WHERE id = ?
      `, [req.user.id]);

      if (!user || user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = user[0];
      const tenantId = userData.tenant_id;
      const isAdmin = userData.position === 'admin';

      await moduleAccessModel.updateLastActive(userData.id);

      const modules = await moduleAccessModel.getModulesForUser(
        userData.id,
        tenantId,
        isAdmin
      );

      const tenantRows = await query(
        'SELECT name, slug FROM tenants WHERE id = ?',
        [tenantId]
      );
      const tenant = tenantRows[0] || {};

      res.json({
        success: true,
        user: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone || '',
          position: userData.position,
          is_active: userData.is_active,
          tenant_id: tenantId,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          modules,
        },
        data: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone || '',
          position: userData.position,
          is_active: userData.is_active,
          tenant_id: tenantId,
          tenant_name: tenant.name,
          tenant_slug: tenant.slug,
          modules,
        },
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  },

  
    getTenantBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const rows = await query(
                'SELECT id, name, slug, logo_url FROM tenants WHERE slug = ? AND is_active = 1',
                [slug]
            );
            
            if (rows.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Organization not found' 
                });
            }

            res.json({ success: true, tenant: rows[0] });
        } catch (error) {
            console.error('Get tenant by slug error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

   register: async (req, res) => {
    try {
       
        const { first_name, last_name, email, password, phone, position, tenant_id } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        const tenantId = tenant_id || req.user?.tenant_id || 1;
      
        const existingUser = await userRepository.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
   
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
       
        const userId = await userRepository.insertUser({
            tenant_id: tenantId,
            first_name: first_name || 'User',
            last_name: last_name || '',
            email: email,
            password_hash: password_hash, 
            phone: phone || '',
            role: 'user',  
            position: position || 'employee' 
        });
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user_id: userId
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
},
   
    getUsersByPosition: async (req, res) => {
        try {
            const { position } = req.params;
            const tenantId = req.user?.tenant_id;

            if (req.user?.role !== 'admin') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Only admin can view users' 
                });
            }

            const users = await userRepository.getUsersByPosition(tenantId, position);
            
            res.json({
                success: true,
                position: position,
                users: users
            });
        } catch (error) {
            console.error('Get users by position error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Current password and new password are required' 
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    message: 'New password must be at least 6 characters' 
                });
            }

            const user = await userRepository.findUserById(req.user.id);
            if (!user || !user.password_hash) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            
            if (!isPasswordValid) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Current password is incorrect' 
                });
            }

            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            await userRepository.updateUserPassword(req.user.id, newPasswordHash);

            res.json({ 
                success: true,
                message: 'Password changed successfully' 
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error' 
            });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            await ensurePasswordResetSchema();

            const email = req.body.email?.trim();
            const tenantSlug = (req.body.tenant_slug || req.body.tenantSlug || '').trim();

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const users = tenantSlug
                ? await query(
                    `SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email, u.is_active
                     FROM users u
                     INNER JOIN tenants t ON t.id = u.tenant_id
                     WHERE LOWER(u.email) = LOWER(?)
                       AND t.slug = ?
                       AND t.is_active = 1
                     LIMIT 1`,
                    [email, tenantSlug]
                )
                : await query(
                    `SELECT u.id, u.tenant_id, u.first_name, u.last_name, u.email, u.is_active
                     FROM users u
                     INNER JOIN tenants t ON t.id = u.tenant_id
                     WHERE LOWER(u.email) = LOWER(?)
                       AND t.is_active = 1
                     ORDER BY u.is_active DESC, u.id ASC
                     LIMIT 1`,
                    [email]
                );
            const user = users[0];

            if (!user || !user.is_active) {
                return res.json({
                    success: true,
                    message: PASSWORD_RESET_MESSAGE
                });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const tokenHash = hashResetToken(token);
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await query(
                `UPDATE users
                 SET password_reset_token_hash = ?,
                     password_reset_expires_at = ?,
                     updated_at = NOW()
                 WHERE id = ? AND tenant_id = ?`,
                [tokenHash, expiresAt, user.id, user.tenant_id]
            );

            const resetLink = `${getFrontendUrl(req)}/reset-password/${token}`;
            await sendPasswordResetEmail(user.tenant_id, {
                email: user.email,
                userName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
                resetLink
            });

            return res.json({
                success: true,
                message: PASSWORD_RESET_MESSAGE
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email: ' + error.message
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            await ensurePasswordResetSchema();

            const { token } = req.params;
            const newPassword = req.body.newPassword || req.body.new_password;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Reset token and new password are required'
                });
            }

            if (String(newPassword).length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            const tokenHash = hashResetToken(token);
            const users = await query(
                `SELECT id, tenant_id
                 FROM users
                 WHERE password_reset_token_hash = ?
                   AND password_reset_expires_at > NOW()
                   AND is_active = 1
                 LIMIT 1`,
                [tokenHash]
            );
            const user = users[0];

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Password reset token is invalid or has expired'
                });
            }

            const passwordHash = await bcrypt.hash(newPassword, 10);
            await query(
                `UPDATE users
                 SET password_hash = ?,
                     password_reset_token_hash = NULL,
                     password_reset_expires_at = NULL,
                     updated_at = NOW()
                 WHERE id = ? AND tenant_id = ?`,
                [passwordHash, user.id, user.tenant_id]
            );

            return res.json({
                success: true,
                message: 'Password has been successfully reset. You can now login.'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error: ' + error.message
            });
        }
    }
};


module.exports = authController;
