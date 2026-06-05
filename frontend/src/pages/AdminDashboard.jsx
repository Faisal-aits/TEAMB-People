// src/pages/dashboard/AdminDashboard.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../contexts/PortalContext';
import AdminLayout from './admin/AdminLayout';
import EmployeeManagement from './HRModule/EmployeeManagement/EmployeeManagement';
import HrDashboard from './HRModule/HRDashboard/HRDashboard';
import BillingManagement from '../pages/Accounts/BillingManagement';
import BrandingSettings from './Settings/BrandingSettings';
import DeliveryManagement from '../pages/Accounts/DeliveryChallan';
import ExpenseManagement from '../pages/Accounts/ExpenseManagement';
import QuotationManagement from '../pages/Accounts/QuotationManagement';
import SalaryManagement from './HRModule/Payroll&Finance/SalaryManagement';
import HolidayManagement from './HRModule/Payroll&Finance/HolidayManagement';
import ExperienceLetters from './HRModule/EmployeeManagement/ExperienceLetters';
import IncrementLetters from './HRModule/EmployeeManagement/IncrementLetters';
import DeclarationForm from './HRModule/EmployeeManagement/DeclarationForm';
import ResignationRequests from './HRModule/EmployeeManagement/ResignationRequests';
import SalarySlip from './HRModule/EmployeeManagement/SalarySlip';

const AdminDashboard = () => {
      return (
            <PortalProvider basePath="/admin">
            <Routes>
                  <Route path="/" element={<AdminLayout />} />
                  <Route path="/offer-letter" element={<AdminLayout initialTab="offerletter" />} />
                  <Route path="/offer-letter/:employeeId" element={<AdminLayout initialTab="offerletter" />} />
                  <Route path="/hr-dashboard" element={<HrDashboard />} />
                  <Route path="/billing-management" element={<BillingManagement />} />
                  <Route path="/billing-settings" element={<BrandingSettings initialTab="billing" />} />
                  <Route path="/delivery-management" element={<DeliveryManagement />} />
                  <Route path="/expense-management" element={<ExpenseManagement />} />
                  <Route path="/quotation-management" element={<QuotationManagement />} />
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
                  <Route path="/salary-slip" element={<AdminLayout initialTab="salaryslip" />} />
                  <Route path="/salary-slip/:employeeId" element={<AdminLayout initialTab="salaryslip" />} />
            </Routes>
            </PortalProvider>
      );
}


export default AdminDashboard;
