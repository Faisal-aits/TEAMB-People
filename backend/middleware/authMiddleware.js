// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = {
    // Verify JWT token for tenant users
    verifyToken: (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arham_simple_secret_2023');
            
            // Reject super admin tokens on tenant routes
            if (decoded.is_super_admin) {
                return res.status(403).json({ message: 'Super admin tokens cannot access tenant routes.' });
            }

            req.user = decoded;
            req.tenantId = decoded.tenant_id;
            next();
        } catch (error) {
            console.error('JWT Error:', error.message);
            res.status(401).json({ message: 'Invalid token: ' + error.message });
        }
    },

    // Verify JWT token for super admin
    verifySuperAdminToken: (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arham_simple_secret_2023');
            
            if (!decoded.is_super_admin) {
                return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Super Admin JWT Error:', error.message);
            res.status(401).json({ message: 'Invalid token: ' + error.message });
        }
    },

    // Check if user has specific role (within their tenant)
    requireRole: (roles) => {
        return (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role_name)) {
                return res.status(403).json({ 
                    message: 'Access denied. Insufficient permissions.' 
                });
            }
            next();
        };
    }
};

module.exports = authMiddleware;