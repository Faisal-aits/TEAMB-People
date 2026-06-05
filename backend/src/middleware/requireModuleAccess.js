const { query } = require('../config/db');
const sendResponse = require('../utils/response');

const accessMeetsLevel = (access, minLevel) => {
  if (!access || access === 'none') return false;
  if (minLevel === 'read') return access === 'read' || access === 'write';
  if (minLevel === 'write') return access === 'write';
  return false;
};

const requireModuleAccess = (moduleKey, minLevel = 'read') => async (req, res, next) => {
  try {
    const role = req.user?.role || req.user?.position || req.user?.role_name;
    if (role === 'admin') return next();

    const userId = req.user?.id || req.user?.user_id;
    const tenantId = req.tenantId || req.user?.tenant_id;

    if (!userId || !tenantId) {
      return sendResponse(res, 401, false, 'Unauthorized', null);
    }

    const rows = await query(
      `SELECT access_level
       FROM user_module_access
       WHERE user_id = ? AND tenant_id = ? AND module_key = ?
       LIMIT 1`,
      [userId, tenantId, moduleKey]
    );

    const access = rows[0]?.access_level || 'none';
    if (!accessMeetsLevel(access, minLevel)) {
      return sendResponse(res, 403, false, 'Module access required', {
        module_key: moduleKey,
        required_access: minLevel,
      });
    }

    return next();
  } catch (error) {
    console.error('Module access check error:', error);
    return sendResponse(res, 500, false, 'Failed to verify module access', null);
  }
};

module.exports = requireModuleAccess;
