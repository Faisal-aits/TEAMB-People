import React, { useState, useEffect } from 'react';
import worklyLogo from '../../assets/img/workly-full-logo.png';
import worklyShortLogo from '../../assets/img/workly-logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { hasModuleAccess } from '../../utils/moduleAccess';
import { ModuleAccessProvider, MODULE_DEFAULT_TAB, TAB_TO_MODULE } from '../../contexts/ModuleAccessContext';
import UserModuleContent from '../../components/workspace/UserModuleContent';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeAttendace from './EmployeeAttendance';
import EmployeeExpense from './EmployeeExpense';
import '../admin/AdminLayout.css';
import './EmployeeLayout.css';
import { FiMoreHorizontal, FiPlus, FiMinus } from "react-icons/fi";
import { MdAccountBalance } from "react-icons/md";
import { BsGrid3X3GapFill, BsFillPersonLinesFill, BsPersonCircle } from "react-icons/bs";
import NotificationBell from '../../components/NotificationBell.jsx';

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

 const BreakIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z" fill="currentColor" />
    </svg>
  );

 const LeaveIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 1H8C6.9 1 6 1.9 6 3V21C6 22.1 6.9 23 8 23H16C17.1 23 18 22.1 18 21V3C18 1.9 17.1 1 16 1ZM16 19H8V5H16V19ZM10 7H14V9H10V7ZM10 11H14V13H10V11Z" fill="currentColor" />
    </svg>
  );

 const ProjectsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4ZM4 8H20V18H4V8ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z" fill="currentColor" />
    </svg>
  );

  const TicketsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 10V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V10C3.11 10 4 10.9 4 12C4 13.1 3.11 14 2 14V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V14C20.9 14 20 13.1 20 12C20 10.9 20.9 10 22 10ZM20 8.54C18.84 9.4 18 10.61 18 12C18 13.39 18.84 14.6 20 15.46V18H4V15.46C5.16 14.6 6 13.39 6 12C6 10.61 5.16 9.4 4 8.54V6H20V8.54ZM11 15H13V17H11V15ZM11 11H13V13H11V11ZM11 7H13V9H11V7Z" fill="currentColor" />
    </svg>
  );

  const FolderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
    </svg>
  );

const EmployeeLayout = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMainModule, setActiveMainModule] = useState('dashboard');
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(true);

  
  const getMainModuleFromTab = (tab) => {
    const hrTabs = ['hrdashboard', 'employee', 'attendance', 'leave', 'shift', 'salary', 'holiday', 'aiDocumentGenerator'];
    const ticketsTabs = ['employee-leave', 'employee-regularization', 'employee-expense', 'employee-report'];
    const attendanceTabs = ['employee-attendance', 'employee-break', 'employee-holiday'];

    if (hrTabs.includes(tab)) return 'hr';
    if (ticketsTabs.includes(tab)) return 'tickets';
    if (attendanceTabs.includes(tab)) return 'attendance_module';
    if (tab === 'company-documents') return 'company-documents';
    if (tab === 'personal-info') return 'personal_info';
    if (tab === 'employee-salary') return 'employee_salary';
    return 'dashboard';
  };

  useEffect(() => {
    const mainMod = getMainModuleFromTab(activeTab);
    setActiveMainModule(mainMod);
    if (['hr', 'tickets', 'attendance_module'].includes(mainMod)) {
      setSecondarySidebarOpen(true);
    } else {
      setSecondarySidebarOpen(false);
    }
  }, [activeTab]);

  const handleMainModuleHover = (moduleName) => {
    setActiveMainModule(moduleName);
    if (['hr', 'settings', 'tickets', 'attendance_module'].includes(moduleName)) {
      setSecondarySidebarOpen(true);
    } else {
      setSecondarySidebarOpen(false);
    }
  };

  const handleMainModuleClick = (moduleName) => {
    setActiveMainModule(moduleName);

    if (moduleName === 'dashboard') navigateToTab('dashboard');
    else if (moduleName === 'company-documents') navigateToTab('company-documents');
    else if (moduleName === 'personal_info') navigateToTab('personal-info');
    else if (moduleName === 'employee_salary') navigateToTab('employee-salary');
    else if (moduleName === 'attendance_module') {
      setSecondarySidebarOpen(true);
      const attendanceTabs = ['employee-attendance', 'employee-break', 'employee-holiday'];
      if (!attendanceTabs.includes(activeTab)) {
        navigateToTab('employee-attendance');
      }
    }
    else if (moduleName === 'employee_projects') navigateToTab('employee-projects');
    else if (moduleName === 'tickets') {
      setSecondarySidebarOpen(true);
      const ticketsTabs = ['employee-leave', 'employee-regularization', 'employee-expense', 'employee-report'];
      if (!ticketsTabs.includes(activeTab)) {
        if (canAccessEmployeeLeave) navigateToTab('employee-leave');
        else if (canAccessEmployeeAttendance) navigateToTab('employee-regularization');
        else if (canAccessEmployeeExpense) navigateToTab('employee-expense');
        else navigateToTab('employee-leave');
      }
    }
    else if (moduleName === 'hr') {
      setSecondarySidebarOpen(true);
      const hrTabs = ['hrdashboard', 'employee', 'attendance', 'leave', 'shift', 'salary', 'holiday', 'aiDocumentGenerator'];
      if (!hrTabs.includes(activeTab)) navigateToTab('hrdashboard');
    }
  };

  const [hrModuleOpen, setHrModuleOpen] = useState(false);
  const [servicesModuleOpen, setServicesModuleOpen] = useState(false);
  const [employeeattendanceModuleOpen, setEmployeeAttendanceModuleOpen] = useState(false);
  const [employeeExpenseModuleOpen, setEmployeeExpenseModuleOpen] = useState(false);
const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);
const [showAttendanceMenu, setShowAttendanceMenu] = useState(false);

const [pinnedModules, setPinnedModules] = useState(() => {
  const saved = localStorage.getItem('pinnedModules_employee');
  return saved ? JSON.parse(saved) : ['employee_expense'];
});

const togglePin = (moduleId, e) => {
  if (e) e.stopPropagation();
  setPinnedModules(prev => {
    const newPinned = prev.includes(moduleId)
      ? prev.filter(id => id !== moduleId)
      : [...prev, moduleId];
    localStorage.setItem('pinnedModules_employee', JSON.stringify(newPinned));
    return newPinned;
  });
};

  const { user, logout, checkAuthStatus } = useAuth();

  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessServices = hasModuleAccess(user, 'services');
  const canAccessEmployeeAttendance = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeLeave = hasModuleAccess(user, 'employee_attendance');
  const canAccessEmployeeExpense = hasModuleAccess(user, 'employee_expense');

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
    if (moduleKey === 'services') setServicesModuleOpen(true);
     if (moduleKey === 'employee_attendance') {
    setEmployeeAttendanceModuleOpen(true);
    navigateToTab('employee-attendance');
    return;
  }
  if (moduleKey === 'employee_break') {
    navigateToTab('employee-break');
    return;
  }
  if (moduleKey === 'employee_holiday') {
    navigateToTab('employee-holiday');
    return;
  }
  if (moduleKey === 'employee_projects') {
    navigateToTab('employee-projects');
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
          

          <aside className="primary-sidebar">
            <div className="sidebar-header">
              <div className="header-content">
                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={worklyShortLogo} alt="TEAM B People Logo" style={{ maxHeight: '28px', maxWidth: '44px', objectFit: 'contain' }} />
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              <ul>
                {/* Dashboard */}
                <li className={activeMainModule === 'dashboard' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('dashboard')} onClick={() => handleMainModuleClick('dashboard')} title="Dashboard">
                    <span className="nav-icon"><DashboardIcon /></span>
                    <span className="nav-text">Dashboard</span>
                  </button>
                </li>

                {/* Personal Info */}
                <li className={activeMainModule === 'personal_info' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('personal_info')} onClick={() => handleMainModuleClick('personal_info')} title="Personal Info">
                    <span className="nav-icon"><BsPersonCircle /></span>
                    <span className="nav-text">Personal Info</span>
                  </button>
                </li>

                {/* Attendance Module */}
                {canAccessEmployeeAttendance && (
                  <li className={activeMainModule === 'attendance_module' ? 'active' : ''}>
                    <button onMouseEnter={() => handleMainModuleHover('attendance_module')} onClick={() => handleMainModuleClick('attendance_module')} title="Attendance">
                      <span className="nav-icon"><AttendanceIcon /></span>
                      <span className="nav-text">Attendance</span>
                    </button>
                  </li>
                )}

                {/* Tickets Module */}
                <li className={activeMainModule === 'tickets' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('tickets')} onClick={() => handleMainModuleClick('tickets')} title="Tickets Module">
                    <span className="nav-icon"><TicketsIcon /></span>
                    <span className="nav-text">Tickets</span>
                  </button>
                </li>

                {/* My Salary Module */}
                <li className={activeMainModule === 'employee_salary' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('employee_salary')} onClick={() => handleMainModuleClick('employee_salary')} title="My Salary">
                    <span className="nav-icon"><ExpensesIcon /></span>
                    <span className="nav-text">My Salary</span>
                  </button>
                </li>

                {/* Company Documents Module */}
                <li className={activeMainModule === 'company-documents' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('company-documents')} onClick={() => handleMainModuleClick('company-documents')} title="Company Documents">
                    <span className="nav-icon"><FolderIcon /></span>
                    <span className="nav-text">Documents</span>
                  </button>
                </li>

                {/* HR Module */}
                {canAccessHr && (
                  <li className={activeMainModule === 'hr' ? 'active' : ''}>
                    <button onMouseEnter={() => handleMainModuleHover('hr')} onClick={() => handleMainModuleClick('hr')} title="HR Module">
                      <span className="nav-icon"><BsFillPersonLinesFill /></span>
                      <span className="nav-text">HR Module</span>
                    </button>
                  </li>
                )}

                {/* Logout Button */}
                <li>
                  <button onClick={logout} title="Logout">
                    <span className="nav-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor" />
                      </svg>
                    </span>
                    <span className="nav-text">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile">
                <div className="user-avatar" title={getUserName()}>{getUserInitials()}</div>
              </div>
            </div>
          </aside>

          {/* Secondary Sidebar Context Menu */}
          {['hr', 'tickets', 'attendance_module'].includes(activeMainModule) && (
            <aside className={`secondary-sidebar ${secondarySidebarOpen ? 'open' : 'closed'}`}>
              <div className="secondary-header">
                <h2>
                  {activeMainModule === 'attendance_module' && 'Attendance'}
                  {activeMainModule === 'hr' && 'HR Module'}
                  {activeMainModule === 'tickets' && 'Tickets'}
                </h2>
                <button className="collapse-btn" onClick={() => setSecondarySidebarOpen(!secondarySidebarOpen)}>
                  {secondarySidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon2 />}
                </button>
              </div>
              <div className="secondary-nav">
                <ul>
                  {activeMainModule === 'attendance_module' && (
                    <>
                      <li className={activeTab === 'employee-attendance' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-attendance')}>
                          <span className="dropdown-text">Attendance</span>
                        </button>
                      </li>
                      <li className={activeTab === 'employee-break' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-break')}>
                          <span className="dropdown-text">Breaks</span>
                        </button>
                      </li>
                      <li className={activeTab === 'employee-holiday' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-holiday')}>
                          <span className="dropdown-text">Holidays</span>
                        </button>
                      </li>
                    </>
                  )}
                  {activeMainModule === 'hr' && (
                    <>
                      <li className={activeTab === 'hrdashboard' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('hrdashboard')}>
                          <span className="dropdown-text">HR Dashboard</span>
                        </button>
                      </li>
                      <li className={activeTab === 'employee' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee')}>
                          <span className="dropdown-text">Employee Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'attendance' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('attendance')}>
                          <span className="dropdown-text">Attendance Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'leave' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('leave')}>
                          <span className="dropdown-text">Leave Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'shift' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('shift')}>
                          <span className="dropdown-text">Shift Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'salary' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('salary')}>
                          <span className="dropdown-text">Salary Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'holiday' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('holiday')}>
                          <span className="dropdown-text">Holiday Management</span>
                        </button>
                      </li>
                      <li className={activeTab === 'aiDocumentGenerator' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('aiDocumentGenerator')}>
                          <span className="dropdown-text">AI Document Generator</span>
                        </button>
                      </li>
                    </>
                  )}

                  {activeMainModule === 'tickets' && (
                    <>
                      {canAccessEmployeeLeave && <li className={activeTab === 'employee-leave' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-leave')}>
                          <span className="dropdown-text">My Leave</span>
                        </button>
                      </li>}
                      {canAccessEmployeeAttendance && <li className={activeTab === 'employee-regularization' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-regularization')}>
                          <span className="dropdown-text">Attendance Correction</span>
                        </button>
                      </li>}
                      <li className={activeTab === 'employee-report' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-report')}>
                          <span className="dropdown-text">Tickets</span>
                        </button>
                      </li>
                      {canAccessEmployeeExpense && <li className={activeTab === 'employee-expense' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('employee-expense')}>
                          <span className="dropdown-text">Reimbursements</span>
                        </button>
                      </li>}
                    </>
                  )}
                </ul>
              </div>
            </aside>
          )}
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <NotificationBell />
            <UserModuleContent
              activeTab={activeTab}
              
              navigateToTab={navigateToTab}
              DashboardComponent={DashboardView}
            />
          </div>
        </div>
      </div>
      
    </ModuleAccessProvider>
  );
};

export default EmployeeLayout;
