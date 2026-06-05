const sendResponse = require('../utils/response');

const requireAdmin = (req, res, next) => {
  const role = req.user?.role || req.user?.position;
  if (role === 'admin') {
    return next();
  }
  return sendResponse(res, 403, false, 'Admin access required', null);
};

module.exports = requireAdmin;
