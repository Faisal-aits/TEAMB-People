import React from 'react';
import { hasModuleAccess } from '../../utils/moduleAccess';
import { useAuth } from '../../contexts/AuthContext';
import ReadOnlyBanner from '../common/ReadOnlyBanner';
import { useModuleAccess } from '../../contexts/ModuleAccessContext';

import EmployeeManagement from '../../pages/HRModule/EmployeeManagement/EmployeeManagement';
import AttendanceManagement from '../../pages/HRModule/AttendanceManagement/AttendanceManagement';
import LeaveManagement from '../../pages/HRModule/AttendanceManagement/LeaveManagement';
import ShiftManagement from '../../pages/HRModule/AttendanceManagement/ShiftManagement';
import HrDashboard from '../../pages/HRModule/HRDashboard/HRDashboard';
import SalaryManagement from '../../pages/HRModule/Payroll&Finance/SalaryManagement';
import HolidayManagement from '../../pages/HRModule/Payroll&Finance/HolidayManagement';
import AiDocumentGenerator from '../../pages/HRModule/EmployeeManagement/AiDocumentGenerator';
import BillingManagement from '../../pages/Accounts/BillingManagement';
import BillingSettings from '../../pages/Accounts/BillingSettings';
import DeliveryManagement from '../../pages/Accounts/DeliveryChallan';
import ExpenseManagement from '../../pages/Accounts/ExpenseManagement';
import QuotationManagement from '../../pages/Accounts/QuotationManagement';
import ServiceManagement from '../../pages/services/ServiceManagement';
import PTTMContainer from '../../pages/PTTM/PTTMContainer';
import EmployeeAttendance from '../../pages/employees/EmployeeAttendance';
import EmployeePersonalInfo from '../../pages/employees/EmployeePersonalInfo';
import EmployeeLeave from '../../pages/employees/EmployeeLeave';
import EmployeeExpense from '../../pages/employees/EmployeeExpense';
import EmployeeProjects from '../../pages/employees/EmployeeProjects';
const UserModuleContent = ({ activeTab, navigateToTab, DashboardComponent }) => {
  const { user } = useAuth();
  const { isReadOnly } = useModuleAccess();

  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessAccounts = hasModuleAccess(user, 'accounts');
  const canAccessServices = hasModuleAccess(user, 'services');
  const canAccessHrDashboard = hasModuleAccess(user, 'hr_dashboard');
  const canAccessEmployeeManagement = hasModuleAccess(user, 'employee_management');
  const canAccessAttendanceManagement = hasModuleAccess(user, 'attendance_management');
  const canAccessLeaveManagement = hasModuleAccess(user, 'leave_management');
  const canAccessShiftManagement = hasModuleAccess(user, 'shift_management');
  const canAccessSalaryManagement = hasModuleAccess(user, 'salary_management');
  const canAccessHolidayManagement = hasModuleAccess(user, 'holiday_management');
  const canAccessAiDocumentGenerator = hasModuleAccess(user, 'ai_document_generator');
  const canAccessBillingManagement = hasModuleAccess(user, 'billing_management');
  const canAccessBillingSettings = hasModuleAccess(user, 'billing_settings');
  const canAccessDeliveryManagement = hasModuleAccess(user, 'delivery_management');
  const canAccessExpenseManagement = hasModuleAccess(user, 'expense_management');
  const canAccessQuotationManagement = hasModuleAccess(user, 'quotation_management');
  const canAccessServiceManagement = hasModuleAccess(user, 'service_management');
  const canAccessPttm = hasModuleAccess(user, 'pttm');
  const canAccessEmployeeAttendance = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeLeave = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeExpense = hasModuleAccess(user, 'employee_expense');
  const canAccessEmployeeProjects = hasModuleAccess(user, 'employee_projects');

  const mainClass = `dashboard-main${isReadOnly ? ' module-readonly' : ''}`;

  return (
    <main className={mainClass}>
      <ReadOnlyBanner />
      {activeTab === 'dashboard' && (
        <DashboardComponent user={user} navigateToTab={navigateToTab} />
      )}
      {activeTab === 'employee' && canAccessEmployeeManagement && <EmployeeManagement />}
      {activeTab === 'attendance' && canAccessAttendanceManagement && <AttendanceManagement />}
      {activeTab === 'leave' && canAccessLeaveManagement && <LeaveManagement />}
      {activeTab === 'shift' && canAccessShiftManagement && <ShiftManagement />}
      {activeTab === 'hrdashboard' && canAccessHrDashboard && <HrDashboard navigateToTab={navigateToTab} />}
      {activeTab === 'salary' && canAccessSalaryManagement && <SalaryManagement />}
      {activeTab === 'holiday' && canAccessHolidayManagement && <HolidayManagement />}
      {activeTab === 'aiDocumentGenerator' && canAccessAiDocumentGenerator && <AiDocumentGenerator />}
      {activeTab === 'billing' && canAccessBillingManagement && <BillingManagement />}
      {activeTab === 'billingsettings' && canAccessBillingSettings && <BillingSettings />}
      {activeTab === 'delivery' && canAccessDeliveryManagement && <DeliveryManagement />}
      {activeTab === 'expenses' && canAccessExpenseManagement && <ExpenseManagement />}
      {activeTab === 'quotation' && canAccessQuotationManagement && <QuotationManagement />}
      {activeTab === 'service' && canAccessServiceManagement && (
        <ServiceManagement initialTab="services" />
      )}
      {activeTab === 'pttm' && canAccessPttm && <PTTMContainer />}
      {activeTab === 'personal-info' && (
        <EmployeePersonalInfo />
      )}
      {activeTab === 'employee-attendance' && canAccessEmployeeAttendance && (
        <EmployeeAttendance />
      )}
      {activeTab === 'employee-leave' && canAccessEmployeeLeave && (
        <EmployeeLeave />
      )}
      {activeTab === 'employee-expense' && canAccessEmployeeExpense && (
        <EmployeeExpense />
      )}
      {activeTab === 'employee-projects' && canAccessEmployeeProjects && (
        <EmployeeProjects />
      )}
    </main>
  );
};

export default UserModuleContent;
