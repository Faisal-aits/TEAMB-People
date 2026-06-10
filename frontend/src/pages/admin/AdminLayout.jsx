// src/pages/dashboard/admin/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { BsPersonCircle } from "react-icons/bs";
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './AdminLayout.css';
import Dashboard from './Dashboard.jsx';

import EmployeeManagement from '../HRModule/EmployeeManagement/EmployeeManagement.jsx';
import AttendanceManagement from '../HRModule/AttendanceManagement/AttendanceManagement.jsx';
import LeaveManagement from '../HRModule/AttendanceManagement/LeaveManagement.jsx';
import ShiftManagement from '../HRModule/AttendanceManagement/ShiftManagement.jsx';
import HrDashboard from '../HRModule/HRDashboard/HRDashboard.jsx';
import BillingManagement from '../Accounts/BillingManagement.jsx';
import BillingSettings from '../Accounts/BillingSettings.jsx';
import DeliveryManagement from '../Accounts/DeliveryChallan.jsx';
import ExpenseManagement from '../Accounts/ExpenseManagement.jsx';
import QuotationManagement from '../Accounts/QuotationManagement.jsx';
import ServiceManagement from '../services/ServiceManagement.jsx';
import ReportsManagement from './ReportsManagement.jsx';
import TicketManagement from './TicketManagement.jsx';
import ModuleManagement from '../Settings/ModuleManagement.jsx';
import BrandingSettings from '../Settings/BrandingSettings.jsx';
import MasterSettings from '../Settings/MasterSettings.jsx';
import SmtpConfig from '../Settings/SmtpConfig.jsx';

import PTTMContainer from '../PTTM/PTTMContainer.jsx';
import OfferLetter from '../HRModule/EmployeeManagement/OfferLetter.jsx';
import DeclarationForm from '../HRModule/EmployeeManagement/DeclarationForm.jsx';
import ResignationRequests from '../HRModule/EmployeeManagement/ResignationRequests.jsx';
import SalarySlip from '../HRModule/EmployeeManagement/SalarySlip.jsx';
import ExperienceLetters from '../HRModule/EmployeeManagement/ExperienceLetters.jsx';
import IncrementLetters from '../HRModule/EmployeeManagement/IncrementLetters.jsx';
import AiDocumentGenerator from '../HRModule/EmployeeManagement/AiDocumentGenerator.jsx';
import { hasModuleAccess } from '../../utils/moduleAccess.js';
import { BsFillPersonLinesFill } from "react-icons/bs";
import { MdAccountBalance } from "react-icons/md";
import { MdMiscellaneousServices } from "react-icons/md";
import { IoSettingsSharp } from "react-icons/io5";
import { FaTasks } from "react-icons/fa";

import SalaryManagement from '../HRModule/Payroll&Finance/SalaryManagement.jsx';
import HolidayManagement from '../HRModule/Payroll&Finance/HolidayManagement.jsx';
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
  
  
  const [hrModuleOpen, setHrModuleOpen] = useState(false);
  const [accountModuleOpen, setAccountModuleOpen] = useState(false);
  const [payrollModuleOpen, setPayrollModuleOpen] = useState(false);
  const [settingsModuleOpen, setSettingsModuleOpen] = useState(false);

  const { user, logout } = useAuth();

  const isAdmin = user?.position === 'admin';
  const canAccessHr = hasModuleAccess(user, 'hr');
  const canAccessAccounts = hasModuleAccess(user, 'accounts');
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
  const canAccessSalarySlips = hasModuleAccess(user, 'salary_slips');
  const canAccessExperienceLetters = hasModuleAccess(user, 'experience_letters');
  const canAccessIncrementLetters = hasModuleAccess(user, 'increment_letters');
  const canAccessBillingManagement = hasModuleAccess(user, 'billing_management');
  const canAccessBillingSettings = hasModuleAccess(user, 'billing_settings');
  const canAccessDeliveryManagement = hasModuleAccess(user, 'delivery_management');
  const canAccessExpenseManagement = hasModuleAccess(user, 'expense_management');
  const canAccessQuotationManagement = hasModuleAccess(user, 'quotation_management');
  const canAccessServiceManagement = hasModuleAccess(user, 'service_management');
  const canAccessTicketManagement = hasModuleAccess(user, 'ticket_management') || isAdmin;

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setNavigationState(initialState);
    }
  }, [initialTab, initialState]);

  // Remove the old useEffect that controlled both dropdowns with one state

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

  const ManageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor" />
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-body">
        <button
          className={`sidebar-toggle-btn ${sidebarOpen ? 'open' : 'closed'}`}
          onClick={toggleSidebar}
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
              {/* Dashboard */}
              <li className={activeTab === 'dashboard' ? 'active' : ''}>
                <button onClick={() => navigateToTab('dashboard')}>
                  <span className="nav-icon"><DashboardIcon /></span>
                  {sidebarOpen && <span className="nav-text">Dashboard</span>}
                </button>
              </li>

              {isAdmin && (
                <li className={activeTab === 'reports' ? 'active' : ''}>
                  <button onClick={() => navigateToTab('reports')}>
                    <span className="nav-icon"><ReportIcon /></span>
                    {sidebarOpen && <span className="nav-text">Reports</span>}
                  </button>
                </li>
              )}

             

              {/* HR Module Dropdown */}
              {canAccessHr && (
              <li className={`dropdown ${hrModuleOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleHrModule}>
                  <span className="nav-icon"><BsFillPersonLinesFill /></span>
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

                    {canAccessHrDashboard && <li className={activeTab === 'hrdashboard' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('hrdashboard')}>
                        <span className="dropdown-text">HR Dashboard</span>
                      </button>
                    </li>}


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
                    {canAccessLeaveManagement && <li className={activeTab === 'leave' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('leave')}>
                        <span className="dropdown-text">Leave Management</span>
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
                    {canAccessAiDocumentGenerator && <li className={activeTab === 'aiDocumentGenerator' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('aiDocumentGenerator')}>
                        <span className="dropdown-text">AI Document Generator</span>
                      </button>
                    </li>}
                     </ul>
                )}
              </li>
              )}


              {/* Account Dropdown */}
              {canAccessAccounts && (
              <li className={`dropdown ${accountModuleOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleAccountModule}>
                  <span className="nav-icon"><MdAccountBalance /></span>
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


                    {canAccessBillingManagement && <li className={activeTab === 'billing' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('billing')}>
                        <span className="dropdown-text">Billing Management</span>
                      </button>
                    </li>}
                    {canAccessDeliveryManagement && <li className={activeTab === 'delivery' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('delivery')}>
                        <span className="dropdown-text">Delivery Management</span>
                      </button>
                    </li>}
                    {canAccessExpenseManagement && <li className={activeTab === 'expenses' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('expenses')}>
                        <span className="dropdown-text">Expense Management</span>
                      </button>
                    </li>}
                    {canAccessBillingSettings && <li className={activeTab === 'billingsettings' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('billingsettings')}>
                        <span className="dropdown-text">Billing Settings</span>
                      </button>
                    </li>}

                    {canAccessQuotationManagement && <li className={activeTab === 'quotation' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('quotation')}>
                        <span className="dropdown-text">Quotation Management</span>
                      </button>
                    </li>}
                    
                     </ul>
                )}
              </li>
              )}

              {/* Services */}
              {canAccessServiceManagement && (
              <li className={activeTab === 'service' ? 'active' : ''}>
                <button onClick={() => navigateToTab('service')}>
                  <span className="nav-icon"><MdMiscellaneousServices /></span>
                  {sidebarOpen && <span className="nav-text">Services</span>}
                </button>
              </li>
              )}

              {/* Tickets */}
              {canAccessTicketManagement && (
              <li className={activeTab === 'ticket-management' ? 'active' : ''}>
                <button onClick={() => navigateToTab('ticket-management')}>
                  <span className="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a3 3 0 0 1 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 1 0-6zM4 6h16v2.42c-1.39.81-2 2.3-2 3.58s.61 2.77 2 3.58V18H4v-2.42c1.39-.81 2-2.3 2-3.58s-.61-2.77-2-3.58V6z" fill="currentColor" />
                    </svg>
                  </span>
                  {sidebarOpen && <span className="nav-text">Ticket Management</span>}
                </button>
              </li>
              )}

              {/* Task Manager (PTTM) */}
              <li className={activeTab === 'pttm' ? 'active' : ''}>
                <button onClick={() => navigateToTab('pttm')}>
                  <span className="nav-icon"><FaTasks /></span>
                  {sidebarOpen && <span className="nav-text">PTTM</span>}
                </button>
              </li>

              {/* Settings Dropdown - Admin only */}
              {isAdmin && (
              <li className={`dropdown ${settingsModuleOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleSettingsModule}>
                  <span className="nav-icon"><IoSettingsSharp /></span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-text">Settings</span>
                      <span className="dropdown-arrow">
                        {settingsModuleOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </span>
                    </>
                  )}
                </button>
                {sidebarOpen && settingsModuleOpen && (
                  <ul className="dropdown-menu">
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
                    <li className={activeTab === 'master' ? 'active' : ''}>
                      <button onClick={() => navigateToTab('master')}>
                        <span className="dropdown-text">Master</span>
                      </button>
                    </li>

                  </ul>
                )}
              </li>
              )}

              {/* Logout Button */}
              <li>
                <button onClick={handleLogout}>
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

                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content - ADD THE EMPLOYEE CASE HERE */}
        <main className="dashboard-main">
          {activeTab === 'dashboard' && <Dashboard user={user} navigateToTab={navigateToTab} />}
          {activeTab === 'reports' && isAdmin && <ReportsManagement />}
          {activeTab === 'employee' && canAccessEmployeeManagement && <EmployeeManagement />}
          {activeTab === 'attendance' && canAccessAttendanceManagement && <AttendanceManagement />}
          {activeTab === 'leave' && canAccessLeaveManagement && <LeaveManagement />}
          {activeTab === 'shift' && canAccessShiftManagement && <ShiftManagement />}
          {activeTab === 'hrdashboard' && canAccessHrDashboard && <HrDashboard navigateToTab={navigateToTab} />}

          {activeTab === 'salary' && canAccessSalaryManagement && <SalaryManagement />}
          {activeTab === 'billing' && canAccessBillingManagement && <BillingManagement />}
          {activeTab === 'billingsettings' && canAccessBillingSettings && <BillingSettings />}
          {activeTab === 'delivery' && canAccessDeliveryManagement && <DeliveryManagement />}
          {activeTab === 'expenses' && canAccessExpenseManagement && <ExpenseManagement />}
          {activeTab === 'quotation' && canAccessQuotationManagement && <QuotationManagement />}
          {activeTab === 'holiday' && canAccessHolidayManagement && <HolidayManagement />}
          {activeTab === 'aiDocumentGenerator' && canAccessAiDocumentGenerator && <AiDocumentGenerator />}
          {activeTab === 'service' && canAccessServiceManagement && <ServiceManagement initialTab="services" />}
          {activeTab === 'ticket-management' && canAccessTicketManagement && <TicketManagement />}
          {activeTab === 'modulemanagement' && isAdmin && <ModuleManagement />}
          {activeTab === 'branding' && isAdmin && <BrandingSettings />}
          {activeTab === 'master' && isAdmin && <MasterSettings />}
          {activeTab === 'smtpconfig' && isAdmin && <SmtpConfig />}
          {activeTab === 'leavepolicysettings' && isAdmin && canAccessLeaveManagement && <LeavePolicySettings />}
          {activeTab === 'pttm' && <PTTMContainer />}
          {activeTab === 'offerletter' && canAccessOfferLetters && (
            <OfferLetter initialEmployee={navigationState?.employee} />
          )}
           {activeTab === 'declaration' && canAccessDeclarations && (
            <DeclarationForm initialEmployee={navigationState?.employee} />
          )}
            {activeTab === 'resignation' && canAccessResignations && (
              <ResignationRequests />
            )}
              {activeTab === 'salaryslip' && canAccessSalarySlips && (
                <SalarySlip />
              )}
              {activeTab === 'experienceletters' && canAccessExperienceLetters && (
                <ExperienceLetters />
              )}
              {activeTab === 'incrementletters' && canAccessIncrementLetters && (
                <IncrementLetters />
              )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
