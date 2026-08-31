// src/pages/dashboard/AdminDashboard.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../contexts/PortalContext';
import AdminLayout from './admin/AdminLayout';
import EmployeeManagement from './HRModule/EmployeeManagement/EmployeeManagement';
import HrDashboard from './HRModule/HRDashboard/HRDashboard';
import BrandingSettings from './Settings/BrandingSettings';
import SalaryManagement from './HRModule/Payroll&Finance/SalaryManagement';
import HolidayManagement from './HRModule/Payroll&Finance/HolidayManagement';
import BreakManagement from './HRModule/BreakManagement/BreakManagement';
import ExperienceLetters from './HRModule/EmployeeManagement/ExperienceLetters';
import IncrementLetters from './HRModule/EmployeeManagement/IncrementLetters';
import DeclarationForm from './HRModule/EmployeeManagement/DeclarationForm';
import ResignationRequests from './HRModule/EmployeeManagement/ResignationRequests';
import RegularizationManagement from './HRModule/AttendanceManagement/RegularizationManagement';

const AdminDashboard = () => {
      return (
            <PortalProvider basePath="/admin">
            <Routes>
                  <Route path="/" element={<AdminLayout />} />
                  <Route path="/offer-letter" element={<AdminLayout initialTab="offerletter" />} />
                  <Route path="/offer-letter/:employeeId" element={<AdminLayout initialTab="offerletter" />} />
                  <Route path="/hr-dashboard" element={<HrDashboard />} />
                  <Route path="/billing-settings" element={<BrandingSettings initialTab="billing" />} />
                  <Route path="/salary-management" element={<SalaryManagement />} />
                  <Route path="/holiday-management" element={<HolidayManagement />} />
                  <Route path="/experience-letters" element={<AdminLayout initialTab="experienceletters" />} />
                  <Route path="/experience-letters/:employeeId" element={<AdminLayout initialTab="experienceletters" />} />
                  <Route path="/increment-letters" element={<AdminLayout initialTab="incrementletters" />} />
                  <Route path="/increment-letters/:employeeId" element={<AdminLayout initialTab="incrementletters" />} />
                  <Route path="/declaration-form" element={<AdminLayout initialTab="declaration" />} />
                  <Route path="/declaration-form/:employeeId" element={<AdminLayout initialTab="declaration" />} />
                  <Route path="/resignation-requests" element={<AdminLayout initialTab="resignation" />} />
                  <Route path="/resignation-requests/:employeeId" element={<AdminLayout initialTab="resignation" />} />
                  <Route path="/salary-slip-record" element={<AdminLayout initialTab="salaryslip" />} />
                  <Route path="/salary-slip-record/:employeeId" element={<AdminLayout initialTab="salaryslip" />} />
                  <Route path="/regularization-management" element={<RegularizationManagement />} />
                  <Route path="/break-management" element={<BreakManagement />} />
            </Routes>
            </PortalProvider>
      );
}


export default AdminDashboard;
