import React, { useState, useEffect } from 'react';
import offerLetterAPI from '../../../services/offerLetterAPI';
import { salaryAPI } from '../../../services/salaryAPI';
import { offerLetterPDFService } from '../../../services/offerLetterPDFService';
import { salarySlipPDFService } from '../../../services/salarySlipPDFService';
import { HiOutlineDocumentText, HiOutlineArrowDownTray, HiOutlineEye, HiOutlineCurrencyDollar } from "react-icons/hi2";
import './MyDocuments.css';

const MyDocuments = () => {
  const [letters, setLetters] = useState([]);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offer'); // 'offer' or 'salary'
  const [slipFilters, setSlipFilters] = useState({ month: '', year: '' });

  const fetchDocs = async () => {
    try {
      const [letterRes, slipRes] = await Promise.all([
        offerLetterAPI.getMyOfferLetters(),
        salaryAPI.getMySalaryRecords(slipFilters)
      ]);
      setLetters(letterRes.data.letters || []);
      setSlips(slipRes.data.salaryRecords || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [slipFilters]);

  const mapRecordToFormData = (record) => ({
    fullName: record.employee_name,
    designation: record.designation,
    monthYear: `${record.month} ${record.year}`,
    paymentMode: record.payment_mode || "Bank Transfer",
    earnings: {
      basic: record.basic_salary,
      hra: record.allowances?.hra || 0,
      conveyance: record.allowances?.transport || 0,
      medical: record.allowances?.medical || 0,
      special: record.allowances?.special || 0
    },
    deductions: {
      pf: record.deductions?.provident_fund || 0,
      pt: record.deductions?.professional_tax || 0,
      tds: record.deductions?.tax || 0
    }
  });

  const handleDocAction = async (type, action, doc) => {
    try {
      if (type === 'offer') {
        if (action === 'view') await offerLetterPDFService.viewOfferLetter(doc.form_data);
        else await offerLetterPDFService.downloadOfferLetter(doc.form_data);
      } else {
        const formData = mapRecordToFormData(doc);
        if (action === 'view') await salarySlipPDFService.viewSalarySlip(formData);
        else await salarySlipPDFService.downloadSalarySlip(formData);
      }
    } catch (err) {
      alert("Failed to process document. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="docs-loading">
        <div className="spinner"></div>
        <p>Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="my-docs-container">
      <div className="docs-header">
        <h1>My Documents</h1>
        <p>View and download your official company documents.</p>
      </div>

      <div className="docs-tabs">
        <button 
          className={`tab-btn ${activeTab === 'offer' ? 'active' : ''}`}
          onClick={() => setActiveTab('offer')}
        >
          <HiOutlineDocumentText /> Offer Letters
        </button>
        <button 
          className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          <HiOutlineCurrencyDollar /> Salary Slips
        </button>
      </div>

      <div className="docs-list">
        {activeTab === 'offer' ? (
          letters.length > 0 ? (
            letters.map((letter) => (
              <div key={letter.id} className="doc-card">
                <div className="doc-icon-container">
                  <HiOutlineDocumentText className="doc-icon" />
                </div>
                <div className="doc-info">
                  <h3>Offer Letter</h3>
                  <p>Issued on: {new Date(letter.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="doc-actions">
                  <button className="doc-view-btn" onClick={() => handleDocAction('offer', 'view', letter)} title="View PDF">
                    <HiOutlineEye size={20} /> <span>View</span>
                  </button>
                  <button className="doc-download-btn" onClick={() => handleDocAction('offer', 'download', letter)} title="Download PDF">
                    <HiOutlineArrowDownTray size={20} /> <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-docs">
              <HiOutlineDocumentText size={48} />
              <h3>No offer letters found</h3>
            </div>
          )
        ) : (
          <>
            <div className="slips-filter-bar">
              <select 
                value={slipFilters.month} 
                onChange={(e) => setSlipFilters({ ...slipFilters, month: e.target.value })}
                className="filter-select"
              >
                <option value="">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select 
                value={slipFilters.year} 
                onChange={(e) => setSlipFilters({ ...slipFilters, year: e.target.value })}
                className="filter-select"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {slips.length > 0 ? (
              slips.map((slip) => (
                <div key={slip.id} className="doc-card">
                  <div className="doc-icon-container salary-icon-bg">
                    <HiOutlineCurrencyDollar className="doc-icon" />
                  </div>
                  <div className="doc-info">
                    <h3>Salary Slip</h3>
                    <p>Period: {slip.month} {slip.year}</p>
                  </div>
                  <div className="doc-actions">
                    <button className="doc-view-btn" onClick={() => handleDocAction('salary', 'view', slip)} title="View PDF">
                      <HiOutlineEye size={20} /> <span>View</span>
                    </button>
                    <button className="doc-download-btn" onClick={() => handleDocAction('salary', 'download', slip)} title="Download PDF">
                      <HiOutlineArrowDownTray size={20} /> <span>Download</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-docs">
                <HiOutlineCurrencyDollar size={48} />
                <h3>No salary slips found</h3>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyDocuments;
