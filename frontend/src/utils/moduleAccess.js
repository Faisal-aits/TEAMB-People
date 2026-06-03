export const MODULE_KEYS = {
  HR: 'hr',
  ACCOUNTS: 'accounts',
  SERVICES: 'services',
  EMPLOYEE_ATTENDANCE: 'employee_attendance',
  EMPLOYEE_EXPENSE: 'employee_expense',
};

const DEFAULT_EMPLOYEE_MODULES = [
  MODULE_KEYS.EMPLOYEE_ATTENDANCE,
  MODULE_KEYS.EMPLOYEE_EXPENSE,
];

export const hasModuleAccess = (user, moduleKey, minLevel = 'read') => {
  if (!user) return false;
  if (user.position === 'admin') return true;
  if (DEFAULT_EMPLOYEE_MODULES.includes(moduleKey)) return true;

  const mod = (user.modules || []).find((m) => m.module_key === moduleKey);
  if (!mod || mod.access === 'none') return false;
  if (minLevel === 'read') return mod.access === 'read' || mod.access === 'write';
  if (minLevel === 'write') return mod.access === 'write';
  return false;
};

export const canWriteModule = (user, moduleKey) =>
  hasModuleAccess(user, moduleKey, 'write');

export const getModuleAccessLevel = (user, moduleKey) => {
  if (user?.position === 'admin') return 'write';
  if (DEFAULT_EMPLOYEE_MODULES.includes(moduleKey)) return 'write';
  const mod = (user?.modules || []).find((m) => m.module_key === moduleKey);
  return mod?.access || 'none';
};
