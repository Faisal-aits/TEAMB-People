import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasModuleAccess } from '../../utils/moduleAccess';
import { ModuleAccessProvider, MODULE_DEFAULT_TAB, TAB_TO_MODULE } from '../../contexts/ModuleAccessContext';
import UserModuleContent from '../../components/workspace/UserModuleContent';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeAttendace from './EmployeeAttendance';
import EmployeeExpense from './EmployeeExpense';
import '../admin/AdminLayout.css';
import './EmployeeLayout.css';

const STORAGE_KEY = 'employeeActiveTab';

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
  </svg>
);

const ManageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M7.41 8.84L12 13.42L16.59 8.84L18 10.25L12 16.25L6 10.25L7.41 8.84Z" fill="currentColor" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M8.59 16.84L13.42 12L8.59 7.16L10 5.75L16 11.75L10 17.75L8.59 16.84Z" fill="currentColor" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor" />
  </svg>
);

const ChevronRightIcon2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" />
  </svg>
);
 const ExpensesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" fill="currentColor" />
    </svg>
  );
 const AttendanceIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" fill="currentColor" />
    </svg>
  );

 const LeaveIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1H8C6.9 1 6 1.9 6 3V21C6 22.1 6.9 23 8 23H16C17.1 23 18 22.1 18 21V3C18 1.9 17.1 1 16 1ZM16 19H8V5H16V19ZM10 7H14V9H10V7ZM10 11H14V13H10V11Z" fill="currentColor" />
    </svg>
  );


const EmployeeLayout = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hrModuleOpen, setHrModuleOpen] = useState(false);
  const [accountModuleOpen, setAccountModuleOpen] = useState(false);
  const [servicesModuleOpen, setServicesModuleOpen] = useState(false);
  const [employeeattendanceModuleOpen, setEmployeeAttendanceModuleOpen] = useState(false);
  const [employeeExpenseModuleOpen, setEmployeeExpenseModuleOpen] = useState(false);
const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
const [showAttendanceMenu, setShowAttendanceMenu] = useState(false);
  const { user, logout, checkAuthStatus } = useAuth();

  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessAccounts = hasModuleAccess(user, 'accounts');
  const canAccessServices = hasModuleAccess(user, 'services');
  const canAccessPttm = hasModuleAccess(user, 'pttm');
  const canAccessEmployeeAttendance = hasModuleAccess(user, 'employee_attendance');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    checkAuthStatus();

    const refreshAccessOnFocus = () => {
      checkAuthStatus();
    };
    window.addEventListener('focus', refreshAccessOnFocus);
    return () => window.removeEventListener('focus', refreshAccessOnFocus);
  }, []);

  useEffect(() => {
    const moduleKey = TAB_TO_MODULE[activeTab];
    if (moduleKey && !hasModuleAccess(user, moduleKey)) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);
useEffect(() => {
  const handleClickOutside = (event) => {
    if (attendanceDropdownOpen && !event.target.closest('.navbar-dropdown')) {
      setAttendanceDropdownOpen(false);
    }
  };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, [attendanceDropdownOpen]);
  const navigateToTab = (tabName) => {
    setActiveTab(tabName);
  };

  const openModule = (moduleKey, tabName) => {
    if (moduleKey === 'hr') setHrModuleOpen(true);
    if (moduleKey === 'accounts') setAccountModuleOpen(true);
    if (moduleKey === 'services') setServicesModuleOpen(true);
     if (moduleKey === 'employee_attendance') {
    setEmployeeAttendanceModuleOpen(true);
    navigateToTab('employee-attendance');
    return;
  }
  if (moduleKey === 'employee_expense') {
    setEmployeeExpenseModuleOpen(true);
    navigateToTab('employee-expense');
    return;
  }
    navigateToTab(tabName || MODULE_DEFAULT_TAB[moduleKey] || 'dashboard');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return 'User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  };

  const DashboardView = (props) => (
    <EmployeeDashboard {...props} onOpenModule={openModule} />
  );

  return (
    <ModuleAccessProvider activeTab={activeTab}>
      <div className="dashboard-container employee-portal">
       
        <div className="dashboard-body">
          <button
            type="button"
            className={`sidebar-toggle-btn ${sidebarOpen ? 'open' : 'closed'}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon2 />}
          </button>

          <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
              <div className="header-content">
                {sidebarOpen ? (
                  <h2 className="company-title-sidebar">Work Desk</h2>
                ) : (
                  <div className="company-icon">W</div>
                )}
              </div>
            </div>

            <nav className="sidebar-nav">
              <ul>
                <li className={activeTab === 'dashboard' ? 'active' : ''}>
                  <button type="button" onClick={() => navigateToTab('dashboard')}>
                    <span className="nav-icon"><DashboardIcon /></span>
                    {sidebarOpen && <span className="nav-text">Dashboard</span>}
                  </button>
                </li>

                <li className={activeTab === 'personal-info' ? 'active' : ''}>
                  <button type="button" onClick={() => navigateToTab('personal-info')}>
                    <span className="nav-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
                      </svg>
                    </span>
                    {sidebarOpen && <span className="nav-text">Personal Info</span>}
                  </button>
                </li>

                <li className={activeTab === 'employee-expense' ? 'active' : ''}>
                  <button type="button" onClick={() => navigateToTab('employee-expense')}>
                    <span className="nav-icon"><ExpensesIcon /></span>
                    {sidebarOpen && <span className="nav-text">Expense</span>}
                  </button>
                </li>

                <li className={activeTab === 'employee-attendance' ? 'active' : ''}>
                  <button type="button" onClick={() => navigateToTab('employee-attendance')}>
                    <span className="nav-icon"><AttendanceIcon /></span>
                    {sidebarOpen && <span className="nav-text">Attendance</span>}
                  </button>
                </li>

                <li className={activeTab === 'employee-leave' ? 'active' : ''}>
                  <button type="button" onClick={() => navigateToTab('employee-leave')}>
                    <span className="nav-icon"><LeaveIcon /></span>
                    {sidebarOpen && <span className="nav-text">Leave</span>}
                  </button>
                </li>

                {canAccessHr && (
                  <li className={`dropdown ${hrModuleOpen ? 'open' : ''}`}>
                    <button type="button" className="dropdown-toggle" onClick={() => setHrModuleOpen(!hrModuleOpen)}>
                      <span className="nav-icon"><ManageIcon /></span>
                      {sidebarOpen && (
                        <>
                          <span className="nav-text">HR Module</span>
                          <span className="dropdown-arrow">
                            {hrModuleOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </span>
                        </>
                      )}
                    </button>
                    {sidebarOpen && hrModuleOpen && (
                      <ul className="dropdown-menu">
                        <li className={activeTab === 'hrdashboard' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('hrdashboard')}>
                            <span className="dropdown-text">HR Dashboard</span>
                          </button>
                        </li>
                        <li className={activeTab === 'employee' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('employee')}>
                            <span className="dropdown-text">Employee Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'attendance' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('attendance')}>
                            <span className="dropdown-text">Attendance Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'leave' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('leave')}>
                            <span className="dropdown-text">Leave Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'shift' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('shift')}>
                            <span className="dropdown-text">Shift Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'salary' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('salary')}>
                            <span className="dropdown-text">Salary Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'holiday' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('holiday')}>
                            <span className="dropdown-text">Holiday Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'aiDocumentGenerator' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('aiDocumentGenerator')}>
                            <span className="dropdown-text">AI Document Generator</span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {canAccessAccounts && (
                  <li className={`dropdown ${accountModuleOpen ? 'open' : ''}`}>
                    <button type="button" className="dropdown-toggle" onClick={() => setAccountModuleOpen(!accountModuleOpen)}>
                      <span className="nav-icon"><ManageIcon /></span>
                      {sidebarOpen && (
                        <>
                          <span className="nav-text">Account Module</span>
                          <span className="dropdown-arrow">
                            {accountModuleOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </span>
                        </>
                      )}
                    </button>
                    {sidebarOpen && accountModuleOpen && (
                      <ul className="dropdown-menu">
                        <li className={activeTab === 'billing' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('billing')}>
                            <span className="dropdown-text">Billing Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'delivery' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('delivery')}>
                            <span className="dropdown-text">Delivery Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'expenses' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('expenses')}>
                            <span className="dropdown-text">Expense Management</span>
                          </button>
                        </li>
                        <li className={activeTab === 'billingsettings' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('billingsettings')}>
                            <span className="dropdown-text">Billing Settings</span>
                          </button>
                        </li>
                        <li className={activeTab === 'quotation' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('quotation')}>
                            <span className="dropdown-text">Quotation Management</span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {canAccessServices && (
                  <li className={`dropdown ${servicesModuleOpen ? 'open' : ''}`}>
                    <button type="button" className="dropdown-toggle" onClick={() => setServicesModuleOpen(!servicesModuleOpen)}>
                      <span className="nav-icon"><ManageIcon /></span>
                      {sidebarOpen && (
                        <>
                          <span className="nav-text">Services</span>
                          <span className="dropdown-arrow">
                            {servicesModuleOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </span>
                        </>
                      )}
                    </button>
                    {sidebarOpen && servicesModuleOpen && (
                      <ul className="dropdown-menu">
                        <li className={activeTab === 'service' ? 'active' : ''}>
                          <button type="button" onClick={() => navigateToTab('service')}>
                            <span className="dropdown-text">Service Management</span>
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                {canAccessPttm && (
                  <li className={activeTab === 'pttm' ? 'active' : ''}>
                    <button type="button" onClick={() => navigateToTab('pttm')}>
                      <span className="nav-icon"><ManageIcon /></span>
                      {sidebarOpen && <span className="nav-text">PTTM</span>}
                    </button>
                  </li>
                )}

                <li>
                  <button type="button" onClick={logout}>
                    <span className="nav-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor" />
                      </svg>
                    </span>
                    {sidebarOpen && <span className="nav-text">Logout</span>}
                  </button>
                </li>
              </ul>
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile">
                <div className="user-avatar">{getUserInitials()}</div>
                {sidebarOpen && (
                  <div className="user-info">
                    <p className="user-name">{getUserName()}</p>
                    <p className="user-role-label">User Portal</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <UserModuleContent
            activeTab={activeTab}
            
            navigateToTab={navigateToTab}
            DashboardComponent={DashboardView}
          />
        </div>
      </div>
      
    </ModuleAccessProvider>
  );
};

export default EmployeeLayout;
