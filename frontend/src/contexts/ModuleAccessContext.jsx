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
  hrdashboard: 'hr_dashboard',
  employee: 'employee_management',
  attendance: 'attendance_management',
  leave: 'leave_management',
  shift: 'shift_management',
  salary: 'salary_management',
  holiday: 'holiday_management',
  aiDocumentGenerator: 'ai_document_generator',
  offerletter: 'offer_letters',
  declaration: 'declarations',
  resignation: 'resignations',
  salaryslip: 'salary_slips',
  experienceletters: 'experience_letters',
  incrementletters: 'increment_letters',
  billing: 'billing_management',
  delivery: 'delivery_management',
  expenses: 'expense_management',
  billingsettings: 'billing_settings',
  quotation: 'quotation_management',
  'employee-attendance': 'employee_attendance',
  'employee-break': 'employee_attendance',
  'employee-holiday': 'employee_attendance',
  'employee-leave': 'employee_attendance',
  'employee-expense': 'employee_expense',
  'employee-projects': 'employee_projects',
  'employee-regularization': 'employee_attendance',
  'employee-report': 'employee_attendance',
  'regularization': 'attendance_management',
  'reports': 'hr_dashboard', // No specific reports permission yet, using hr_dashboard or null
};

export const MODULE_DEFAULT_TAB = {
  hr: 'hrdashboard',
  hr_dashboard: 'hrdashboard',
  employee_management: 'employee',
  attendance_management: 'attendance',
  leave_management: 'leave',
  shift_management: 'shift',
  salary_management: 'salary',
  holiday_management: 'holiday',
  ai_document_generator: 'aiDocumentGenerator',
  offer_letters: 'offerletter',
  declarations: 'declaration',
  resignations: 'resignation',
  salary_slips: 'salaryslip',
  experience_letters: 'experienceletters',
  increment_letters: 'incrementletters',
  accounts: 'billing',
  billing_management: 'billing',
  delivery_management: 'delivery',
  expense_management: 'expenses',
  billing_settings: 'billingsettings',
  quotation_management: 'quotation',
  employee_attendance: 'employee-attendance',
  employee_break: 'employee-break',
  employee_holiday: 'employee-holiday',
  employee_expense: 'employee-expense',
  employee_projects: 'employee-projects',
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
