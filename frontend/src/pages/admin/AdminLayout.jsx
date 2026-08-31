// src/pages/dashboard/admin/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import worklyLogo from '../../assets/img/workly-full-logo.png';
import worklyShortLogo from '../../assets/img/workly-logo.png';
import { BsPersonCircle } from "react-icons/bs";
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './AdminLayout.css';
import Dashboard from './Dashboard.jsx';

import EmployeeManagement from '../HRModule/EmployeeManagement/EmployeeManagement.jsx';
import AttendanceManagement from '../HRModule/AttendanceManagement/AttendanceManagement.jsx';
import BreakManagement from '../HRModule/BreakManagement/BreakManagement.jsx';
import LeaveManagement from '../HRModule/AttendanceManagement/LeaveManagement.jsx';
import ShiftManagement from '../HRModule/AttendanceManagement/ShiftManagement.jsx';
import HrDashboard from '../HRModule/HRDashboard/HRDashboard.jsx';
import BillingManagement from '../Accounts/BillingManagement.jsx';
import BillingSettings from '../Accounts/BillingSettings.jsx';
import DeliveryManagement from '../Accounts/DeliveryChallan.jsx';
import ExpenseManagement from '../Accounts/ExpenseManagement.jsx';
import QuotationManagement from '../Accounts/QuotationManagement.jsx';
import ReportsManagement from './ReportsManagement.jsx';
import ModuleManagement from '../Settings/ModuleManagement.jsx';
import BrandingSettings from '../Settings/BrandingSettings.jsx';
import DepartmentSettings from '../Settings/DepartmentSettings.jsx';
import ExpenseCategorySettings from '../Settings/ExpenseCategorySettings.jsx';
import SmtpConfig from '../Settings/SmtpConfig.jsx';
import AdminProfile from '../Settings/AdminProfile.jsx';
import CompanySettings from '../Settings/CompanySettings.jsx';
import CompanyDocuments from '../CompanyDocuments/CompanyDocuments.jsx';
import LeavePolicy from '../Settings/LeavePolicy.jsx';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';

import NotificationBell from '../../components/NotificationBell.jsx';

import OfferLetter from '../HRModule/EmployeeManagement/OfferLetter.jsx';
import DeclarationForm from '../HRModule/EmployeeManagement/DeclarationForm.jsx';
import ResignationRequests from '../HRModule/EmployeeManagement/ResignationRequests.jsx';
import SalarySlipRecord from '../HRModule/EmployeeManagement/SalarySlipRecord.jsx';
import ExperienceLetters from '../HRModule/EmployeeManagement/ExperienceLetters.jsx';
import IncrementLetters from '../HRModule/EmployeeManagement/IncrementLetters.jsx';
import AiDocumentGenerator from '../HRModule/EmployeeManagement/AiDocumentGenerator.jsx';
import RegularizationManagement from '../HRModule/AttendanceManagement/RegularizationManagement.jsx';
import { hasModuleAccess } from '../../utils/moduleAccess.js';
import { BsFillPersonLinesFill, BsGrid3X3GapFill } from "react-icons/bs";
import { MdAccountBalance } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { FiMoreHorizontal, FiPlus, FiMinus } from "react-icons/fi";
import SalaryManagement from '../HRModule/Payroll&Finance/SalaryManagement.jsx';
import HolidayManagement from '../HRModule/Payroll&Finance/HolidayManagement.jsx';
const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
    </svg>
  );

  const ReportIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM13 9V3.5L18.5 9H13ZM8 13H16V15H8V13ZM8 17H16V19H8V17ZM8 9H11V11H8V9Z" fill="currentColor" />
    </svg>
  );

  const FolderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
    </svg>
  );

  const ManageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor" />
    </svg>
  );

  const TicketsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 10V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V10C3.11 10 4 10.9 4 12C4 13.1 3.11 14 2 14V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V14C20.9 14 20 13.1 20 12C20 10.9 20.9 10 22 10ZM20 8.54C18.84 9.4 18 10.61 18 12C18 13.39 18.84 14.6 20 15.46V18H4V15.46C5.16 14.6 6 13.39 6 12C6 10.61 5.16 9.4 4 8.54V6H20V8.54ZM11 15H13V17H11V15ZM11 11H13V13H11V11ZM11 7H13V9H11V7Z" fill="currentColor" />
    </svg>
  );

  const ChevronDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.41 8.84L12 13.42L16.59 8.84L18 10.25L12 16.25L6 10.25L7.41 8.84Z" fill="currentColor" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.59 16.84L13.42 12L8.59 7.16L10 5.75L16 11.75L10 17.75L8.59 16.84Z" fill="currentColor" />
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor" />
    </svg>
  );

  const ChevronRightIcon2 = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" />
    </svg>
  );

const AdminLayout = ({ initialTab, initialState = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    return localStorage.getItem("activeTab") || "dashboard";
  });
  const [navigationState, setNavigationState] = useState(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [companySettings, setCompanySettings] = useState({ salary_format: 'Monthly', probation_months: '4', enable_probation: true });
  
  
  const [hrModuleOpen, setHrModuleOpen] = useState(false);
  const [accountModuleOpen, setAccountModuleOpen] = useState(false);
  const [payrollModuleOpen, setPayrollModuleOpen] = useState(false);
  const [settingsModuleOpen, setSettingsModuleOpen] = useState(false);
  const [activeMainModule, setActiveMainModule] = useState('dashboard');
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(true);

  
  const getMainModuleFromTab = (tab) => {
    const hrTabs = ['employee', 'attendance', 'break', 'shift', 'salary', 'holiday', 'aiDocumentGenerator', 'offerletter', 'declaration', 'resignation', 'salaryslip', 'experienceletters', 'incrementletters'];
    const ticketsTabs = ['leave', 'regularization', 'reports', 'expenses'];
    const settingsTabs = ['modulemanagement', 'branding', 'department', 'expensecategory', 'smtpconfig', 'leavepolicy', 'company-settings'];

    if (hrTabs.includes(tab)) return 'hr';
    if (ticketsTabs.includes(tab)) return 'tickets';
    if (settingsTabs.includes(tab)) return 'settings';
    if (tab === 'company-documents') return 'company-documents';
    if (tab === 'dashboard') return 'dashboard';
    return 'dashboard';
  };

  useEffect(() => {
    const mainMod = getMainModuleFromTab(activeTab);
    setActiveMainModule(mainMod);
    if (['hr', 'settings', 'tickets'].includes(mainMod)) {
      setSecondarySidebarOpen(true);
    } else {
      setSecondarySidebarOpen(false);
    }
  }, [activeTab]);

  const handleMainModuleHover = (moduleName) => {
    setActiveMainModule(moduleName);
    if (['hr', 'settings', 'tickets'].includes(moduleName)) {
      setSecondarySidebarOpen(true);
    } else {
      setSecondarySidebarOpen(false);
    }
  };

  const handleMainModuleClick = (moduleName) => {
    setActiveMainModule(moduleName);
    
    // Auto-navigate for modules
    if (moduleName === 'dashboard') {
      navigateToTab('dashboard');
    } else if (moduleName === 'company-documents') {
      navigateToTab('company-documents');
    } else if (moduleName === 'tickets') {
      setSecondarySidebarOpen(true);
      const ticketsTabs = ['leave', 'regularization', 'reports', 'expenses'];
      if (!ticketsTabs.includes(activeTab)) {
        if (canAccessLeaveManagement) navigateToTab('leave');
        else if (canAccessAttendanceManagement) navigateToTab('regularization');
        else if (isAdmin) navigateToTab('reports');
        else if (canAccessExpenseManagement) navigateToTab('expenses');
        else navigateToTab('leave');
      }
    } else if (moduleName === 'hr') {
      setSecondarySidebarOpen(true);
      const hrTabs = ['employee', 'attendance', 'break', 'shift', 'salary', 'holiday', 'aiDocumentGenerator'];
      if (!hrTabs.includes(activeTab)) {
        if (canAccessEmployeeManagement) navigateToTab('employee');
        else if (canAccessAttendanceManagement) navigateToTab('attendance');
        else if (canAccessShiftManagement) navigateToTab('shift');
        else if (canAccessSalaryManagement) navigateToTab('salary');
        else if (canAccessHolidayManagement) navigateToTab('holiday');
        else if (canAccessAiDocumentGenerator) navigateToTab('aiDocumentGenerator');
        else navigateToTab('employee');
      }
    } else if (moduleName === 'settings') {
      setSecondarySidebarOpen(true);
      const settingsTabs = ['modulemanagement', 'branding', 'master', 'smtpconfig', 'profile'];
      if (!settingsTabs.includes(activeTab)) {
        navigateToTab('modulemanagement');
      }
    }
  };

  const [pinnedModules, setPinnedModules] = useState(() => {
    const saved = localStorage.getItem('pinnedModules_admin');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePin = (moduleId, e) => {
    if (e) e.stopPropagation();
    setPinnedModules(prev => {
      const newPinned = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId];
      localStorage.setItem('pinnedModules_admin', JSON.stringify(newPinned));
      return newPinned;
    });
  };

  const { user, logout } = useAuth();

  // Fetch company settings (salary format + probation)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get('/api/settings/salary_format', { headers }).catch(() => ({ data: { value: 'Monthly' } })),
      axios.get('/api/settings/probation_months', { headers }).catch(() => ({ data: { value: '4' } })),
      axios.get('/api/settings/enable_probation', { headers }).catch(() => ({ data: { value: 'true' } })),
    ]).then(([fmtRes, monthsRes, probRes]) => {
      setCompanySettings({
        salary_format: fmtRes.data?.value || 'Monthly',
        probation_months: monthsRes.data?.value || '4',
        enable_probation: (probRes.data?.value ?? 'true') === 'true',
      });
    });
  }, []);

  const isAdmin = ['admin'].includes(String(user?.position || user?.role || user?.role_name || '').toLowerCase());
  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessHrDashboard = hasModuleAccess(user, 'hr_dashboard');
  const canAccessEmployeeManagement = hasModuleAccess(user, 'employee_management');
  const canAccessAttendanceManagement = hasModuleAccess(user, 'attendance_management');
  const canAccessLeaveManagement = hasModuleAccess(user, 'leave_management');
  const canAccessShiftManagement = hasModuleAccess(user, 'shift_management');
  const canAccessSalaryManagement = hasModuleAccess(user, 'salary_management');
  const canAccessHolidayManagement = hasModuleAccess(user, 'holiday_management');
  const canAccessAiDocumentGenerator = hasModuleAccess(user, 'ai_document_generator');
  const canAccessOfferLetters = hasModuleAccess(user, 'offer_letters');
  const canAccessDeclarations = hasModuleAccess(user, 'declarations');
  const canAccessResignations = hasModuleAccess(user, 'resignations');
  const canAccessSalarySlips = hasModuleAccess(user, 'salary_slips') || hasModuleAccess(user, 'salary_management') || canAccessHr;
  const canAccessExperienceLetters = hasModuleAccess(user, 'experience_letters');
  const canAccessIncrementLetters = hasModuleAccess(user, 'increment_letters');
  const canAccessBillingManagement = hasModuleAccess(user, 'billing_management');
  const canAccessBillingSettings = hasModuleAccess(user, 'billing_settings');
  const canAccessDeliveryManagement = hasModuleAccess(user, 'delivery_management');
  const canAccessExpenseManagement = hasModuleAccess(user, 'expense_management');
  const canAccessQuotationManagement = hasModuleAccess(user, 'quotation_management');

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setNavigationState(initialState);
    }
  }, [initialTab, initialState]);

  const navigateToTab = (tabName, state = null) => {
    setActiveTab(tabName);
    setNavigationState(state);
    localStorage.setItem("activeTab", tabName);
    if (location.pathname !== '/admin') {
      navigate('/admin');
    }
    setTimeout(() => {
      setNavigationState(null);
    }, 500);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  
  const toggleHrModule = () => {
    setHrModuleOpen(!hrModuleOpen);
  };

  const toggleAccountModule = () => {
    setAccountModuleOpen(!accountModuleOpen);
  };
  const togglePayrollModule = () => {
    setPayrollModuleOpen(!payrollModuleOpen);
  };

  const toggleSettingsModule = () => {
    setSettingsModuleOpen(!settingsModuleOpen);
  };
  const handleLogout = () => {
    logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  // Get user display name
  const getUserName = () => {
    if (!user) return 'User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  };



  

  return (
    <div className="dashboard-container">
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

              {/* HR Module */}
              {canAccessHr && (
                <li className={activeMainModule === 'hr' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('hr')} onClick={() => handleMainModuleClick('hr')} title="HR Module">
                    <span className="nav-icon"><BsFillPersonLinesFill /></span>
                    <span className="nav-text">HR Module</span>
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

              {/* Company Documents Module */}
              <li className={activeMainModule === 'company-documents' ? 'active' : ''}>
                <button onMouseEnter={() => handleMainModuleHover('company-documents')} onClick={() => handleMainModuleClick('company-documents')} title="Company Documents">
                  <span className="nav-icon"><FolderIcon /></span>
                  <span className="nav-text">Documents</span>
                </button>
              </li>

              {/* Settings Dropdown - Admin only */}
              {isAdmin && (
                <li className={activeMainModule === 'settings' ? 'active' : ''}>
                  <button onMouseEnter={() => handleMainModuleHover('settings')} onClick={() => handleMainModuleClick('settings')} title="Settings">
                    <span className="nav-icon"><IoSettingsSharp /></span>
                    <span className="nav-text">Settings</span>
                  </button>
                </li>
              )}

              {/* Logout Button */}
              <li>
                <button onClick={handleLogout} title="Logout">
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
        {['hr', 'settings', 'tickets'].includes(activeMainModule) && (
          <aside className={`secondary-sidebar ${secondarySidebarOpen ? 'open' : 'closed'}`}>
            <div className="secondary-header">
              <h2>
                {activeMainModule === 'hr' && 'HR Module'}
                {activeMainModule === 'settings' && 'Settings'}
                {activeMainModule === 'tickets' && 'Tickets'}
              </h2>
              <button className="collapse-btn" onClick={() => setSecondarySidebarOpen(!secondarySidebarOpen)}>
                {secondarySidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon2 />}
              </button>
            </div>
            <div className="secondary-nav">
              <ul>
                {activeMainModule === 'hr' && (
                  <>
                    {canAccessEmployeeManagement && <li className={activeTab === 'employee' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('employee')}>
                        <span className="dropdown-text">Employee Management</span>
                      </button>
                    </li>}
                    {canAccessAttendanceManagement && <li className={activeTab === 'attendance' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('attendance')}>
                        <span className="dropdown-text">Attendance Management</span>
                      </button>
                    </li>}
                    {canAccessAttendanceManagement && <li className={activeTab === 'break' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('break')}>
                        <span className="dropdown-text">Break Management</span>
                      </button>
                    </li>}
                    {canAccessShiftManagement && <li className={activeTab === 'shift' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('shift')}>
                        <span className="dropdown-text">Shift Management</span>
                      </button>
                    </li>}
                    {canAccessSalaryManagement && <li className={activeTab === 'salary' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('salary')}>
                        <span className="dropdown-text">Salary Management</span>
                      </button>
                    </li>}
                    {canAccessHolidayManagement && <li className={activeTab === 'holiday' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('holiday')}>
                        <span className="dropdown-text">Holiday Management</span>
                      </button>
                    </li>}
                  </>
                )}

                {activeMainModule === 'settings' && (
                  <>
                    <li className={activeTab === 'modulemanagement' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('modulemanagement')}>
                        <span className="dropdown-text">Module Management</span>
                      </button>
                    </li>
                    <li className={activeTab === 'branding' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('branding')}>
                        <span className="dropdown-text">Branding</span>
                      </button>
                    </li>
                    <li className={activeTab === 'profile' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('profile')}>
                        <span className="dropdown-text">Profile</span>
                      </button>
                    </li>
                      <li className={activeTab === 'department' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('department')}>
                          <span className="dropdown-text">Department</span>
                        </button>
                      </li>
                      <li className={activeTab === 'expensecategory' ? 'active' : ''}>
                        <button onClick={() => navigateToTab('expensecategory')}>
                          <span className="dropdown-text">Reimbursements Category</span>
                        </button>
                      </li>
                    <li className={activeTab === 'company-settings' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('company-settings')}>
                        <span className="app-icon"><HiOutlineWrenchScrewdriver /></span>
                        Salary Format
                      </button>
                    </li>
                    <li className={activeTab === 'leavepolicy' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('leavepolicy')}>
                        <span className="app-icon"><HiOutlineWrenchScrewdriver /></span>
                        Leave Policy
                      </button>
                    </li>
                    <li className={activeTab === 'smtpconfig' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('smtpconfig')}>
                        <span className="dropdown-text">SMTP Config</span>
                      </button>
                    </li>
                  </>
                )}

                {activeMainModule === 'tickets' && (
                  <>
                    {canAccessLeaveManagement && <li className={activeTab === 'leave' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('leave')}>
                        <span className="dropdown-text">Leave Management</span>
                      </button>
                    </li>}
                    {canAccessAttendanceManagement && <li className={activeTab === 'regularization' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('regularization')}>
                        <span className="dropdown-text">Attendance Correction</span>
                      </button>
                    </li>}
                    {isAdmin && <li className={activeTab === 'reports' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('reports')}>
                        <span className="dropdown-text">Notifications</span>
                      </button>
                    </li>}
                    {canAccessExpenseManagement && <li className={activeTab === 'expenses' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('expenses')}>
                        <span className="dropdown-text">Reimbursements</span>
                      </button>
                    </li>}
                  </>
                )}
              </ul>
            </div>
          </aside>
        )}

        <main className="dashboard-main" style={{ position: 'relative' }}>
          <NotificationBell />
          {activeTab === 'dashboard' && <HrDashboard user={user} navigateToTab={navigateToTab} />}
          {activeTab === 'reports' && isAdmin && <ReportsManagement />}
          {activeTab === 'employee' && canAccessEmployeeManagement && <EmployeeManagement />}
          {activeTab === 'attendance' && canAccessAttendanceManagement && <AttendanceManagement />}
          {activeTab === 'break' && canAccessAttendanceManagement && <BreakManagement />}
          {activeTab === 'leave' && canAccessLeaveManagement && <LeaveManagement />}
          {activeTab === 'shift' && canAccessShiftManagement && <ShiftManagement />}
          {activeTab === 'salary' && canAccessSalaryManagement && <SalaryManagement />}
          {activeTab === 'billing' && canAccessBillingManagement && <BillingManagement />}
          {activeTab === 'billingsettings' && canAccessBillingSettings && <BillingSettings />}
          {activeTab === 'delivery' && canAccessDeliveryManagement && <DeliveryManagement />}
          {activeTab === 'expenses' && canAccessExpenseManagement && <ExpenseManagement />}
          {activeTab === 'quotation' && canAccessQuotationManagement && <QuotationManagement />}
          {activeTab === 'holiday' && canAccessHolidayManagement && <HolidayManagement />}
          {activeTab === 'aiDocumentGenerator' && canAccessAiDocumentGenerator && <AiDocumentGenerator />}
          {activeTab === 'company-settings' && isAdmin && <CompanySettings />}
          {activeTab === 'leavepolicy' && isAdmin && <LeavePolicy />}
          {activeTab === 'modulemanagement' && isAdmin && <ModuleManagement />}
          {activeTab === 'branding' && isAdmin && <BrandingSettings />}
          {activeTab === 'department' && isAdmin && <DepartmentSettings />}
          {activeTab === 'expensecategory' && isAdmin && <ExpenseCategorySettings />}
          {activeTab === 'smtpconfig' && isAdmin && <SmtpConfig />}
          {activeTab === 'profile' && isAdmin && <AdminProfile />}
          {activeTab === 'offerletter' && canAccessOfferLetters && (
            <OfferLetter initialEmployee={navigationState?.employee} companySettings={companySettings} />
          )}
           {activeTab === 'declaration' && canAccessDeclarations && (
            <DeclarationForm initialEmployee={navigationState?.employee} />
          )}
            {activeTab === 'resignation' && canAccessResignations && (
              <ResignationRequests />
            )}
            {activeTab === 'salaryslip' && canAccessSalarySlips && (
              <SalarySlipRecord />
            )}
            {activeTab === 'experienceletters' && canAccessExperienceLetters && (
                <ExperienceLetters />
              )}
              {activeTab === 'incrementletters' && canAccessIncrementLetters && (
                <IncrementLetters />
              )}
              {activeTab === 'regularization' && canAccessAttendanceManagement && (
                <RegularizationManagement />
              )}
              {activeMainModule === 'company-documents' && (
                <CompanyDocuments />
              )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
