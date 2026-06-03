const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../users/user.repository');
const { query } = require('../../config/db');
const moduleAccessModel = require('../moduleAccess/moduleAccessModel');

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

        // Backward compatibility for older clients that still provide an organization id.
        if (!user) {
          const saltRounds = 10;
          const password_hash = await bcrypt.hash(password, saltRounds);

          const result = await query(
            `INSERT INTO users (tenant_id, first_name, last_name, email, password_hash, phone, position, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 'user', 1)`,
            [tenant.id, email.split('@')[0], '', email, password_hash, '']
          );

          const newUser = await query(`
            SELECT id, tenant_id, first_name, last_name, email, phone,
                   position, password_hash, is_active, created_at, updated_at
            FROM users
            WHERE id = ?
          `, [result.insertId]);

          user = newUser[0];
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
        res.json({ 
            success: true,
            message: 'Password reset functionality coming soon' 
        });
    },

    resetPassword: async (req, res) => {
        res.json({ 
            success: true,
            message: 'Password reset functionality coming soon' 
        });
    }
};


module.exports = authController;
