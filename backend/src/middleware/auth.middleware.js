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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'arham_simple_secret_2023');
    req.user = decoded;
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

module.exports = {
  verifyToken,
  authMiddleware
};