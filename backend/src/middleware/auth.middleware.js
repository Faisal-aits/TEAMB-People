const jwt = require('jsonwebtoken');
const sendResponse = require('../utils/response');

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, false, 'No token provided', null);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
      return sendResponse(res, 500, false, 'Server configuration error', null);
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role || decoded.position || decoded.role_name;
    req.user = decoded;
    req.user.id = decoded.id || decoded.user_id;
    req.user.user_id = decoded.user_id || decoded.id;
    req.user.position = decoded.position || role;
    req.user.role = decoded.role || role;
    req.user.role_name = decoded.role_name || role;
    req.tenantId = decoded.tenant_id;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, 'Invalid or expired token', null);
  }
};

// Simple auth middleware for development (allows all requests)
const authMiddleware = (req, res, next) => {
  const allowAnonymous = true;
  
  if (!allowAnonymous) {
    return sendResponse(res, 401, false, 'Unauthorized', null);
  }
  
  return next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized', null);
    }
    const userRole = req.user.role || req.user.position || req.user.role_name;
    if (!roles.includes(userRole)) {
      return sendResponse(res, 403, false, 'Forbidden: You do not have permission', null);
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authMiddleware,
  authorizeRoles
};
