import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { canWriteModule, getModuleAccessLevel } from '../utils/moduleAccess';

const ModuleAccessContext = createContext({
  activeModule: null,
  accessLevel: 'none',
  isReadOnly: true,
  canWrite: false,
});

export const TAB_TO_MODULE = {
  hrdashboard: 'hr',
  employee: 'hr',
  attendance: 'hr',
  leave: 'hr',
  shift: 'hr',
  salary: 'hr',
  holiday: 'hr',
  aiDocumentGenerator: 'hr',
  billing: 'accounts',
  delivery: 'accounts',
  expenses: 'accounts',
  billingsettings: 'accounts',
  quotation: 'accounts',
  service: 'services',
  'employee-attendance': 'employee_attendance',
  'employee-leave': 'employee_attendance',
  'employee-expense': 'employee_expense',
};

export const MODULE_DEFAULT_TAB = {
  hr: 'hrdashboard',
  accounts: 'billing',
  services: 'service',
  employee_attendance: 'employee-attendance',
  employee_expense: 'employee-expense',
};

export const ModuleAccessProvider = ({ activeTab, children }) => {
  const { user } = useAuth();
  const activeModule = TAB_TO_MODULE[activeTab] || null;

  const value = useMemo(() => {
    if (!activeModule) {
      return {
        activeModule: null,
        accessLevel: 'none',
        isReadOnly: false,
        canWrite: true,
      };
    }
    const accessLevel = getModuleAccessLevel(user, activeModule);
    const canWrite = canWriteModule(user, activeModule);
    return {
      activeModule,
      accessLevel,
      isReadOnly: !canWrite,
      canWrite,
    };
  }, [activeModule, user]);

  return (
    <ModuleAccessContext.Provider value={value}>
      {children}
    </ModuleAccessContext.Provider>
  );
};

export const useModuleAccess = () => useContext(ModuleAccessContext);
