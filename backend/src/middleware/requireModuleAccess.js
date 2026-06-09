const { query } = require('../config/db');
const sendResponse = require('../utils/response');

const accessMeetsLevel = (access, minLevel) => {
  if (!access || access === 'none') return false;
  if (minLevel === 'read') return access === 'read' || access === 'write';
  if (minLevel === 'write') return access === 'write';
  return false;
};

const MODULE_PARENT_KEYS = {
  hr_dashboard: 'hr',
  employee_management: 'hr',
  attendance_management: 'hr',
  leave_management: 'hr',
  shift_management: 'hr',
  salary_management: 'hr',
  holiday_management: 'hr',
  ai_document_generator: 'hr',
  offer_letters: 'hr',
  declarations: 'hr',
  resignations: 'hr',
  salary_slips: 'hr',
  experience_letters: 'hr',
  increment_letters: 'hr',
  billing_management: 'accounts',
  delivery_management: 'accounts',
  expense_management: 'accounts',
  billing_settings: 'accounts',
  quotation_management: 'accounts',
  service_management: 'services',
};

const getModuleKeysToCheck = (moduleKey) => {
  const keys = Array.isArray(moduleKey) ? moduleKey : [moduleKey];
  return [...new Set(keys.flatMap((key) => [key, MODULE_PARENT_KEYS[key]].filter(Boolean)))];
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

    const moduleKeys = getModuleKeysToCheck(moduleKey);
    const placeholders = moduleKeys.map(() => '?').join(', ');
    const rows = await query(
      `SELECT access_level
       FROM user_module_access
       WHERE user_id = ? AND tenant_id = ? AND module_key IN (${placeholders})`,
      [userId, tenantId, ...moduleKeys]
    );

    const hasAccess = rows.some((row) => accessMeetsLevel(row.access_level, minLevel));
    if (!hasAccess) {
      return sendResponse(res, 403, false, 'Module access required', {
        module_key: Array.isArray(moduleKey) ? moduleKey.join(',') : moduleKey,
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
