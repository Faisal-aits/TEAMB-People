import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../../contexts/PortalContext';
import EmployeeLayout from './EmployeeLayout';
import OfferLetter from '../HRModule/EmployeeManagement/OfferLetter';
import ExperienceLetters from '../HRModule/EmployeeManagement/ExperienceLetters';
import IncrementLetters from '../HRModule/EmployeeManagement/IncrementLetters';
import DeclarationForm from '../HRModule/EmployeeManagement/DeclarationForm';
import ResignationRequests from '../HRModule/EmployeeManagement/ResignationRequests';
import SalarySlip from '../HRModule/EmployeeManagement/SalarySlip';
import EmployeeAttendance from './EmployeeAttendance';
const EmployeeApp = () => (
  <PortalProvider basePath="/dashboard">
    <Routes>
      <Route path="/" element={<EmployeeLayout />} />
      <Route path="/offer-letter" element={<OfferLetter />} />
      <Route path="/offer-letter/:employeeId" element={<OfferLetter />} />
      <Route path="/experience-letters" element={<ExperienceLetters />} />
      <Route path="/increment-letters" element={<IncrementLetters />} />
      <Route path="/declaration-form" element={<DeclarationForm />} />
      <Route path="/resignation-requests" element={<ResignationRequests />} />
      <Route path="/salary-slip" element={<SalarySlip />} />
      <Route path="/employee-attendance" element={<EmployeeAttendance />} />
      <Route path="*" element={<EmployeeLayout />} />
    </Routes>
  </PortalProvider>
);

export default EmployeeApp;
