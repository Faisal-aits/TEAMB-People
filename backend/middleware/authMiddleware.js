// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = {
    // Verify JWT token - SIMPLIFIED
    verifyToken: (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        console.log('Token received:', token);
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        try {
            // Use simple secret for testing
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('JWT Error:', error.message);
            res.status(401).json({ message: 'Invalid token: ' + error.message });
        }
    },

    // Check if user has specific role
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