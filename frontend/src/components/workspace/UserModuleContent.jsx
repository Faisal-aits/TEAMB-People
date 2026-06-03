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
import EmployeeAttendance from '../../pages/employees/EmployeeAttendance';
import EmployeePersonalInfo from '../../pages/employees/EmployeePersonalInfo';
import EmployeeLeave from '../../pages/employees/EmployeeLeave';
import EmployeeExpense from '../../pages/employees/EmployeeExpense';
const UserModuleContent = ({ activeTab, navigateToTab, DashboardComponent }) => {
  const { user } = useAuth();
  const { isReadOnly } = useModuleAccess();

  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessAccounts = hasModuleAccess(user, 'accounts');
  const canAccessServices = hasModuleAccess(user, 'services');
  const canAccessEmployeeAttendance = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeLeave = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeExpense = hasModuleAccess(user, 'employee_expense');

  const mainClass = `dashboard-main${isReadOnly ? ' module-readonly' : ''}`;

  return (
    <main className={mainClass}>
      <ReadOnlyBanner />
      {activeTab === 'dashboard' && (
        <DashboardComponent user={user} navigateToTab={navigateToTab} />
      )}
      {activeTab === 'employee' && canAccessHr && <EmployeeManagement />}
      {activeTab === 'attendance' && canAccessHr && <AttendanceManagement />}
      {activeTab === 'leave' && canAccessHr && <LeaveManagement />}
      {activeTab === 'shift' && canAccessHr && <ShiftManagement />}
      {activeTab === 'hrdashboard' && canAccessHr && <HrDashboard navigateToTab={navigateToTab} />}
      {activeTab === 'salary' && canAccessHr && <SalaryManagement />}
      {activeTab === 'holiday' && canAccessHr && <HolidayManagement />}
      {activeTab === 'aiDocumentGenerator' && canAccessHr && <AiDocumentGenerator />}
      {activeTab === 'billing' && canAccessAccounts && <BillingManagement />}
      {activeTab === 'billingsettings' && canAccessAccounts && <BillingSettings />}
      {activeTab === 'delivery' && canAccessAccounts && <DeliveryManagement />}
      {activeTab === 'expenses' && canAccessAccounts && <ExpenseManagement />}
      {activeTab === 'quotation' && canAccessAccounts && <QuotationManagement />}
      {activeTab === 'service' && canAccessServices && (
        <ServiceManagement initialTab="services" />
      )}
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
    </main>
  );
};

export default UserModuleContent;
