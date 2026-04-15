// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// SECURITY: JWT secret must come from env. No hardcoded fallbacks.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret') {
    console.error('⚠️  WARNING: JWT_SECRET is not set or is using a default value! Set a strong secret in .env');
}

const authMiddleware = {
    // Verify JWT token for tenant users
    verifyToken: (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

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
            const decoded = jwt.verify(token, JWT_SECRET);

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