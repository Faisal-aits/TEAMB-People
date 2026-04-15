// src/pages/dashboard/admin/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { BsPersonCircle } from "react-icons/bs";
import { useAuth } from '../../../contexts/AuthContext';
import './AdminLayout.css';
import Dashboard from './Dashboard.jsx';
import ExpenseManagement from './ExpenseManagement.jsx';
import EmployeeManagement from './EmployeeManagement.jsx';
import DepartmentManagement from './DepartmentManagement.jsx';
import ProjectManagement from './ProjectManagement.jsx';
import SalaryManagement from './SalaryManagement.jsx';
import ClientMangement from './ClientManagement.jsx';
import ServiceManagement from './ServiceManagement.jsx';
import Reports from './Reports.jsx';
import InternshipManagement from './InternshipManagement.jsx';
import StudentManagement from './StudentManagement.jsx';
import CourseManagement from './CourseManagement.jsx';

import AttendanceManagement from './AttendanceManagement.jsx';
import LeaveManagement from './LeaveManagement.jsx';
import ShiftManagement from './ShiftManagement.jsx';
import DeliveryChallan from './DeliveryChallan.jsx';
import BillingManagement from './BillingManagement.jsx';
import QuotationManagement from './QuotationManagement.jsx';
import BillingSettings from './BillingSettings.jsx'
import Settings from './Setting.jsx';


// Import the new Student Attendance Management component
import StudentAttendanceManagement from './StudentAttendanceManagement.jsx';

// Hirirng Manager Module 
import HRDashboard from './HRDashboard.jsx';
import OfferLetter from '../HR/OfferLetter.jsx'; //Offer letter jsx HR Folder  
import SalarySlip from '../HR/SalarySlip.jsx';
import SalaryHistory from '../HR/SalaryHistory.jsx';
import EmployeeDirectory from '../HR/EmployeeDirectory.jsx';
import CompanyBranding from './CompanyBranding.jsx';
import ResignationRequests from '../HR/ResignationRequests.jsx';
import ExperienceLetters from '../HR/ExperienceLetters.jsx';
import IncrementLetters from '../HR/IncrementLetters.jsx';
import DeclarationForm from '../HR/DeclarationForm.jsx';
const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "dashboard";
  });
  const [navigationState, setNavigationState] = useState(null); // Add this state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    // Close all dropdowns first
    setManageOpen(false);
    setCoursesOpen(false);
    setAttendanceOpen(false);
    setBillingOpen(false);

    // Open correct dropdown based on activeTab
    if (
      ["employee", "department", "project", "salary", "client", "services", "reports"].includes(activeTab)
    ) {
      setManageOpen(true);
    }

    if (
      ["attendance", "leave", "shift"].includes(activeTab)
    ) {
      setAttendanceOpen(true);
    }

    if (
      ["billing", "quotation", "deliveryChallan", "billing_settings"].includes(activeTab)
    ) {
      setBillingOpen(true);
    }
  }, [activeTab]);

  // Function to navigate to a tab with optional state
  const navigateToTab = (tabName, state = null) => {
    setActiveTab(tabName);
    setNavigationState(state);
    // Clear navigation state after a delay to prevent stale data
    setTimeout(() => {
      setNavigationState(null);
    }, 500);
  };

  // Get user data from backend
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleManage = () => {
    setManageOpen(!manageOpen);
    if (coursesOpen) setCoursesOpen(false);
    if (billingOpen) setBillingOpen(false);
    if (attendanceOpen) setAttendanceOpen(false);
  };

  const toggleCourses = () => {
    setCoursesOpen(!coursesOpen);
    if (manageOpen) setManageOpen(false);
    if (billingOpen) setBillingOpen(false);
    if (attendanceOpen) setAttendanceOpen(false);
  };

  const toggleBilling = () => {
    setBillingOpen(!billingOpen);
    if (manageOpen) setManageOpen(false);
    if (coursesOpen) setCoursesOpen(false);
    if (attendanceOpen) setAttendanceOpen(false);
  };

  const toggleAttendance = () => {
    setAttendanceOpen(!attendanceOpen);
    if (manageOpen) setManageOpen(false);
    if (coursesOpen) setCoursesOpen(false);
    if (billingOpen) setBillingOpen(false);
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

  // Get user role display name
  const getUserRole = () => {
    if (!user) return 'Admin';
    const roleMap = {
      'admin': 'Administrator',
      'hr': 'HR',
      'employee': 'Employee',
      'student': 'Student'
    };
    return roleMap[user.role] || 'User';
  };

  // SVG Icon Components
  const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
    </svg>
  );

  const AttendanceIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" fill="currentColor" />
    </svg>
  );

  const ManageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor" />
    </svg>
  );

  const CoursesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 17.18 8 16 12 16C16 16 19 17.18 19 17.18V13.18C19 13.18 16 14 12 14C8 14 5 13.18 5 13.18Z" fill="currentColor" />
    </svg>
  );

  const ExpensesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" fill="currentColor" />
    </svg>
  );

  const BillingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8H4V6H20V8ZM18 4H6V2H18V4ZM22 10V20C22 21.1 21.1 22 20 22H4C2.89 22 2 21.1 2 20V10C2 8.9 2.89 8 4 8H20C21.11 8 22 8.9 22 10ZM16 15C16 16.66 14.66 18 13 18S10 16.66 10 15C10 13.34 11.34 12 13 12S16 13.34 16 15Z" fill="currentColor" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor" />
    </svg>
  );

  // Arrow Icons
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
        {/* Circular Sidebar Toggle Button */}
        <button
          className={`sidebar-toggle-btn ${sidebarOpen ? 'open' : 'closed'}`}
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon2 />}
        </button>

        {/* Sidebar */}
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

              {/* Attendance Dropdown */}
              <li className={`dropdown ${attendanceOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleAttendance}>
                  <span className="nav-icon"><AttendanceIcon /></span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-text">Attendance</span>
                      <span className="dropdown-arrow">
                        {attendanceOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </span>
                    </>
                  )}
                </button>
                {sidebarOpen && attendanceOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <button onClick={() => navigateToTab('attendance')}>
                        <span className="dropdown-text">Employee Attendance</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('leave')}>
                        <span className="dropdown-text">Leave Management</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('shift')}>
                        <span className="dropdown-text">Shift Management</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* Manage Dropdown */}
              <li className={`dropdown ${manageOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleManage}>
                  <span className="nav-icon"><ManageIcon /></span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-text">Manage</span>
                      <span className="dropdown-arrow">
                        {manageOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </span>
                    </>
                  )}
                </button>
                {sidebarOpen && manageOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <button onClick={() => navigateToTab('employee')}>
                        <span className="dropdown-text">Employee</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('department')}>
                        <span className="dropdown-text">Department</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('project')}>
                        <span className="dropdown-text">Project</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('salary')}>
                        <span className="dropdown-text">Salary</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('client')}>
                        <span className="dropdown-text">Client</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('services')}>
                        <span className="dropdown-text">Services</span>
                      </button>
                    </li>


                      <li>
                      <button onClick={() => navigateToTab('internship')}>
                        <span className="dropdown-text">Intership</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('courses')}>
                        <span className="dropdown-text">Courses</span>
                      </button>
                    </li>


                    <li>
                      <button onClick={() => navigateToTab('reports')}>
                        <span className="dropdown-text">Reports</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* Hiring Manager Nav */}
              <li className={activeTab === 'hr' ? 'active' : ''}>
                <button onClick={() => navigateToTab('hr')}>
                  <span className="nav-icon"><BsPersonCircle /></span>
                  {sidebarOpen && <span className="nav-text">HR Dashboard</span>}
                </button>
              </li>

              {/* Expenses */}
              <li className={activeTab === 'expenses' ? 'active' : ''}>
                <button onClick={() => navigateToTab('expenses')}>
                  <span className="nav-icon"><ExpensesIcon /></span>
                  {sidebarOpen && <span className="nav-text">Expenses</span>}
                </button>
              </li>

              {/* Billing Dropdown */}
              <li className={`dropdown ${billingOpen ? 'open' : ''}`}>
                <button className="dropdown-toggle" onClick={toggleBilling}>
                  <span className="nav-icon"><BillingIcon /></span>
                  {sidebarOpen && (
                    <>
                      <span className="nav-text">Billing</span>
                      <span className="dropdown-arrow">
                        {billingOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </span>
                    </>
                  )}
                </button>
                {sidebarOpen && billingOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <button onClick={() => navigateToTab('billing')}>
                        <span className="dropdown-text">Billing</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('quotation')}>
                        <span className="dropdown-text">Quotation</span>
                      </button>
                    </li>
                    {/* Delivery Challan as sub-item under Billing */}
                    <li>
                      <button onClick={() => navigateToTab('deliveryChallan')}>
                        <span className="dropdown-text">Delivery Challan</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateToTab('billing_settings')}>
                        <span className="dropdown-text">Billing Settings</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* Settings */}
              <li className={activeTab === 'settings' ? 'active' : ''}>
                <button onClick={() => navigateToTab('settings')}>
                  <span className="nav-icon"><SettingsIcon /></span>
                  {sidebarOpen && <span className="nav-text">Settings</span>}
                </button>
              </li>

              {/* Company Branding */}
              <li className={activeTab === 'company-branding' ? 'active' : ''}>
                <button onClick={() => navigateToTab('company-branding')}>
                  <span className="nav-icon"><BsPersonCircle /></span>
                  {sidebarOpen && <span className="nav-text">Company Branding</span>}
                </button>
              </li>

              {/* Logout Button */}
              <li>
                <button onClick={handleLogout}>
                  <span className="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <p className="user-role">{getUserRole()}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeTab === 'dashboard' && <Dashboard user={user} navigateToTab={navigateToTab} />}
          {activeTab === 'attendance' && <AttendanceManagement />}
          {activeTab === 'leave' && <LeaveManagement />}
          {activeTab === 'shift' && <ShiftManagement />}
          {activeTab === 'employee' && <EmployeeManagement />}
          {activeTab === 'department' && <DepartmentManagement />}
          {activeTab === 'project' && <ProjectManagement />}
          {activeTab === 'salary' && <SalaryManagement />}
          {activeTab === 'client' && <ClientMangement />}
          {activeTab === 'services' && <ServiceManagement />}
          {/* Pass navigationState to Reports component */}
          {activeTab === 'reports' && <Reports navigationState={navigationState} />}
          {/* {activeTab === 'student' && <StudentManagement />}
          {activeTab === 'student-attendance' && <StudentAttendanceManagement />} */}
          {activeTab === 'courses' && <CourseManagement />}
          {activeTab === 'internship' && <InternshipManagement />}
          {activeTab === 'expenses' && <ExpenseManagement />}
          {activeTab === 'billing' && <BillingManagement />}
          {activeTab === 'quotation' && <QuotationManagement />}
          {activeTab === 'deliveryChallan' && <DeliveryChallan />}
          {activeTab === 'billing_settings' && <BillingSettings />}
          {activeTab === 'settings' && <Settings />}

          {/* Hiring manager module  */}
          {activeTab === 'hr' && <HRDashboard setActiveTab={navigateToTab} />}
          {activeTab === 'offer-letter' && <OfferLetter />}
          {activeTab === 'salary-slip' && <SalarySlip />}
          {activeTab === 'salary-history' && <SalaryHistory />}
          {activeTab === 'hr-employee-directory' && <EmployeeDirectory />}
          {activeTab === 'company-branding' && <CompanyBranding />}
          {activeTab === 'resignation' && <ResignationRequests />}
          {activeTab === 'experience-letter' && <ExperienceLetters />}
          {activeTab === 'increment-letter' && <IncrementLetters />}
       {activeTab === 'declaration-form' && <DeclarationForm />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;