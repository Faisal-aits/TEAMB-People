import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useTableControls } from '../../../hooks/useTableControls';
import '../../../styles/tableControls.css';
import './SalaryManagement.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SALARY_SEARCH_FIELDS = [
    'employee_id',
    'first_name',
    'last_name',
    'department',
    'position',
    'basic_salary',
    'net_salary',
    'paid_amount',
    'payment_status'
];

const SalaryManagement = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSalaryDetailsModalOpen, setIsSalaryDetailsModalOpen] = useState(false);
    const [isAttendanceDetailsModalOpen, setIsAttendanceDetailsModalOpen] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
    const [selectedAttendanceData, setSelectedAttendanceData] = useState(null);
    const [customHolidays, setCustomHolidays] = useState([]);
    const [totals, setTotals] = useState({
        total_net: 0,
        total_paid: 0,
        total_balance: 0
    });
    const [generating, setGenerating] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [availableMonths, setAvailableMonths] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method: 'bank_transfer',
        transaction_id: '',
        notes: ''
    });

    const token = localStorage.getItem('token');

    const authHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        'x-tenant-id': '1'
    }), [token]);

    const getMonthName = (monthNumber) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthNumber - 1];
    };

    // Get Sundays count in a month
    const getSundaysCount = (month, year) => {
        let count = 0;
        const date = new Date(year, month - 1, 1);
        while (date.getMonth() === month - 1) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0) {
                count++;
            }
            date.setDate(date.getDate() + 1);
        }
        return count;
    };

    // Calculate net salary based on attendance
    const calculateNetSalary = (monthlySalary, presentDays, halfDays, lateDays, absentDays, holidayDays) => {
        const dailyRate = monthlySalary / 30;
        const effectiveDays = presentDays + (halfDays * 0.5) + (lateDays * 0.75) + holidayDays;
        return Math.round(dailyRate * effectiveDays);
    };
    const loadSalaries = useCallback(async () => {
        try {
            setLoading(true);

            // STEP 1: Fetch active employees (not deleted)
            const employeesResponse = await axios.get(`${API_URL}/api/employees`, {
                headers: authHeaders
            });

            const activeEmployees = (employeesResponse.data.employees || []).filter(emp => {

                const isActive = emp.is_active === true || emp.is_active === 1 || emp.is_active === '1';

                const notDeleted = emp.status !== 'inactive' && !emp.deleted_at;
                return isActive && notDeleted;
            });

            const activeEmployeeIds = new Set(activeEmployees.map(emp => emp.employee_id));

            const response = await axios.get(`${API_URL}/api/salary/records`, {
                params: { month: selectedMonth, year: selectedYear },
                headers: authHeaders
            });

            if (response.data.success) {
                let allSalaries = response.data.salaries || [];

                if (allSalaries.length === 0) {
                    setSalaries([]);
                    setTotals({ total_net: 0, total_paid: 0, total_balance: 0 });
                    setLoading(false);
                    return;
                }


                const activeSalaries = allSalaries.filter(salary => {
                    const employeeId = salary.employee_id;
                    const isEmployeeActive = activeEmployeeIds.has(employeeId);

                    return isEmployeeActive;
                });

                setSalaries(activeSalaries);

                // Recalculate totals based on active salaries
                const newTotals = activeSalaries.reduce((acc, salary) => {
                    acc.total_net += (salary.net_salary || 0);
                    acc.total_paid += (salary.paid_amount || 0);
                    acc.total_balance += (salary.balance_amount || 0);
                    return acc;
                }, { total_net: 0, total_paid: 0, total_balance: 0 });

                setTotals(newTotals);
                setCurrentPage(1);
            } else {
                console.error('Failed to load salaries:', response.data.message);
                setSalaries([]);
            }
        } catch (error) {
            console.error('Error loading salaries:', error);
            if (error.response?.status === 404) {
                setSalaries([]);
            } else {
                alert('Failed to load salaries: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear, authHeaders]);
    const loadAvailableMonths = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/salary/months`, {
                headers: authHeaders
            });
            if (response.data.success) {
                setAvailableMonths(response.data.months || []);
            }
        } catch (error) {
            console.error('Error loading months:', error);
        }
    }, [authHeaders]);

    // Load custom holidays from HolidayManagement
    useEffect(() => {
        const loadCustomHolidays = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/salary/holidays/year/${selectedYear}/month/${selectedMonth}`, {
                    headers: authHeaders
                });

                if (response.data.success) {
                    setCustomHolidays(response.data.holidays || []);
                } else {
                    setCustomHolidays([]);
                }
            } catch (error) {
                console.error('Error loading custom holidays:', error);
                setCustomHolidays([]);
            }
        };

        loadCustomHolidays();
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        loadSalaries();
        loadAvailableMonths();
    }, [selectedMonth, selectedYear, loadSalaries, loadAvailableMonths]);

    const loadAttendanceDetails = async (employeeId, month, year) => {
        try {
            setLoadingAttendance(true);

            const response = await axios.get(`${API_URL}/api/salary/calculation/${employeeId}`, {
                params: { month, year },
                headers: authHeaders
            });

            if (response.data.success) {
                const sundays = getSundaysCount(month, year);
                const totalHolidays = sundays + customHolidays.length;
                const monthlySalary = response.data.employee?.monthly_salary || 0;
                const presentDays = response.data.calculation?.present_days || 0;
                const halfDays = response.data.calculation?.half_days || 0;
                const lateDays = response.data.calculation?.late_days || 0;
                const absentDays = response.data.calculation?.absent_days || 0;

                const calculatedNetSalary = calculateNetSalary(
                    monthlySalary, presentDays, halfDays, lateDays, absentDays, totalHolidays
                );

                const enhancedData = {
                    ...response.data,
                    calculation: {
                        ...response.data.calculation,
                        sundays_count: sundays,
                        custom_holidays_count: customHolidays.length,
                        total_holidays: totalHolidays,
                        calculated_net_salary: calculatedNetSalary
                    }
                };
                setSelectedAttendanceData(enhancedData);
                setIsAttendanceDetailsModalOpen(true);
            } else {
                alert('Failed to load attendance details');
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            alert('Failed to load attendance details');
        } finally {
            setLoadingAttendance(false);
        }
    };

    const loadEmployeeSalaryHistory = async (employeeId) => {
        try {
            setLoadingDetails(true);
            const response = await axios.get(`${API_URL}/api/salary/history/${employeeId}`, {
                headers: authHeaders
            });

            if (response.data.success) {
                setSelectedEmployeeData({
                    employee: response.data.employee,
                    history: response.data.history,
                    summary: response.data.summary
                });
                setIsSalaryDetailsModalOpen(true);
            } else {
                alert('Failed to load salary history');
            }
        } catch (error) {
            console.error('Error loading employee salary history:', error);
            alert(error.response?.data?.message || 'Failed to load salary details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const getHolidayCountForMonth = async (year, month) => {
        try {
            const response = await axios.get(`${API_URL}/api/salary/holidays/year/${year}/month/${month}`, {
                headers: authHeaders
            });
            if (response.data.success) {
                return response.data.holidays.length;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching holiday count:', error);
            return 0;
        }
    };

    const handleGenerateAllSalaries = async () => {
        if (!window.confirm(`Generate salaries for all employees for ${getMonthName(selectedMonth)} ${selectedYear}?`)) {
            return;
        }

        try {
            setGenerating(true);
            const customCount = await getHolidayCountForMonth(selectedYear, selectedMonth);
            const sundays = getSundaysCount(selectedMonth, selectedYear);
            const totalHolidays = customCount + sundays;

            const response = await axios.post(`${API_URL}/api/salary/generate-all`, {
                month: selectedMonth,
                year: selectedYear,
                holiday_count: totalHolidays
            }, { headers: authHeaders });

            if (response.data.success) {
                alert(response.data.message);
                loadSalaries();
                loadAvailableMonths();
            } else {
                alert('Failed to generate salaries');
            }
        } catch (error) {
            console.error('Error generating salaries:', error);
            alert(error.response?.data?.message || 'Failed to generate salaries');
        } finally {
            setGenerating(false);
        }
    };

    // Update net salary manually (editable by clicking on net salary)
    const handleUpdateSalary = async (salaryRecordId, newAmount) => {
        try {
            const roundedAmount = Math.round(parseFloat(newAmount));
            const response = await axios.put(`${API_URL}/api/salary/update/${salaryRecordId}`, {
                amount: roundedAmount,
                reason: 'Manual adjustment by admin'
            }, { headers: authHeaders });

            if (response.data.success) {
                alert(`Net salary updated successfully to ${formatCurrency(roundedAmount)}`);
                await loadSalaries();
            } else {
                alert('Failed to update salary');
            }
        } catch (error) {
            console.error('Error updating salary:', error);
            alert(error.response?.data?.message || 'Failed to update salary');
        }
    };

    // Edit net salary manually (does NOT record payment)
    const handleInlineEdit = (salaryId, currentAmount) => {
        const newAmount = prompt('Edit Net Salary Amount:', currentAmount);
        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) >= 0) {
            const confirmUpdate = window.confirm(
                `Change net salary from ${formatCurrency(currentAmount)} to ${formatCurrency(parseFloat(newAmount))}?\n\n` +
                `Note: This will NOT record any payment. Use PAY button for payments.`
            );
            if (confirmUpdate) {
                handleUpdateSalary(salaryId, parseFloat(newAmount));
            }
        } else if (newAmount) {
            alert('Please enter a valid amount');
        }
    };

    // Record payment only (does NOT change net salary)
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedSalary) return;

        const roundedAmount = Math.round(parseFloat(paymentForm.amount));

        if (roundedAmount > selectedSalary.balance_amount) {
            alert(`Payment amount cannot exceed due amount of ${formatCurrency(selectedSalary.balance_amount)}`);
            return;
        }

        const paymentData = {
            amount: roundedAmount,
            payment_method: paymentForm.payment_method,
            transaction_id: paymentForm.transaction_id,
            notes: paymentForm.notes
        };

        try {
            const response = await axios.post(`${API_URL}/api/salary/payment/${selectedSalary.id}`, paymentData, {
                headers: authHeaders
            });

            if (response.data.success) {
                const newPaidAmount = selectedSalary.paid_amount + roundedAmount;
                const newBalance = selectedSalary.net_salary - newPaidAmount;
                const newStatus = newBalance <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending');

                alert(`Payment of ${formatCurrency(roundedAmount)} recorded successfully!\nStatus: ${newStatus.toUpperCase()}`);
                setIsPaymentModalOpen(false);
                setPaymentForm({ amount: '', payment_method: 'bank_transfer', transaction_id: '', notes: '' });
                await loadSalaries();
            } else {
                alert('Failed to record payment: ' + (response.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment: ' + (error.response?.data?.message || error.message));
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'paid': { class: 'status-paid', text: 'PAID' },
            'pending': { class: 'status-pending', text: 'PENDING' },
            'partial': { class: 'status-partial', text: 'PARTIAL' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <span className={`salary-status-badge ${config.class}`}>{config.text}</span>;
    };

    const formatCurrency = (amount) => {
        const roundedAmount = Math.round(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(roundedAmount);
    };

    // Apply status filter
    const filteredByStatus = statusFilter
        ? salaries.filter(s => s.payment_status === statusFilter)
        : salaries;

    const {
        controlledRows: visibleSalaries,
        searchTerm,
        setSearchTerm,
        requestSort,
        sortLabel,
    } = useTableControls(filteredByStatus, SALARY_SEARCH_FIELDS, { key: 'employee_id', accessor: 'employee_id', direction: 'asc' });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSalaries = visibleSalaries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(visibleSalaries.length / itemsPerPage);

    // Pagination functions
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    const currentMonthName = getMonthName(selectedMonth);
    const sundaysCount = getSundaysCount(selectedMonth, selectedYear);
    const totalHolidayCount = sundaysCount + customHolidays.length;

    return (
        <div className="salary-management">
            <div className="salary-header">
                <h2>Salary Management</h2>
            </div>



            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-label">Total Net Salary</div>
                    <div className="summary-value net">{formatCurrency(totals.total_net)}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Total Paid</div>
                    <div className="summary-value paid">{formatCurrency(totals.total_paid)}</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Total Balance</div>
                    <div className="summary-value balance">{formatCurrency(totals.total_balance)}</div>
                </div>
            </div>

            <div className="salary-table-container">

                <div className="filters-card">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label>Select Month</label>
                            <div className="month-year-select">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month}>{getMonthName(month)}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {[2023, 2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Payment Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Search</label>
                            <input
                                type="search"
                                className="table-search-input"
                                placeholder="Search salaries..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>


                        <button className="btn-generate-small" onClick={handleGenerateAllSalaries}>
                            Generate Salaries
                        </button>
                    </div>
                </div>


                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading">Loading salaries...</div>
                    ) : visibleSalaries.length === 0 ? (
                        <div className="no-data">
                            <p>No salary records found for {currentMonthName} {selectedYear}</p>

                        </div>
                    ) : (
                        <>
                            <table className="salary-table">
                                <thead>
                                    <tr>
                                        <th className="sortable-th" onClick={() => requestSort('employee_id', 'employee_id')}>Employee{sortLabel('employee_id')}</th>
                                        <th className="sortable-th" onClick={() => requestSort('department', (salary) => salary.department || salary.position || '')}>Department{sortLabel('department')}</th>
                                        <th className="sortable-th" onClick={() => requestSort('basic_salary', 'basic_salary')}>Monthly Salary{sortLabel('basic_salary')}</th>
                                        <th className="sortable-th" onClick={() => requestSort('net_salary', 'net_salary')}>Net Salary{sortLabel('net_salary')}</th>
                                        <th className="sortable-th" onClick={() => requestSort('paid_amount', 'paid_amount')}>Paid Amount{sortLabel('paid_amount')}</th>
                                        <th className="sortable-th" onClick={() => requestSort('payment_status', 'payment_status')}>Status{sortLabel('payment_status')}</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSalaries.map(salary => {
                                        const isFullyPaid = salary.payment_status === 'paid';
                                        const remainingAmount = Math.round(salary.net_salary - salary.paid_amount);

                                        return (
                                            <tr key={salary.id}>
                                                <td className="employee-cell">
                                                    <div
                                                        className="employee-name clickable"
                                                        onClick={() => loadAttendanceDetails(salary.employee_id, selectedMonth, selectedYear)}
                                                        style={{ cursor: 'pointer', color: '#007bff' }}
                                                        title="Click to view attendance details"
                                                    >
                                                        {salary.first_name} {salary.last_name}
                                                    </div>
                                                    <div className="employee-id">ID: {salary.employee_id}</div>
                                                </td>
                                                <td>{salary.department || salary.position || '-'}</td>
                                                <td className="monthly-salary-cell">
                                                    {formatCurrency(salary.basic_salary)}
                                                </td>
                                                <td className="net-salary-cell">
                                                    <div
                                                        className="editable-salary"
                                                        onClick={() => handleInlineEdit(salary.id, salary.net_salary)}
                                                        title="Click to edit net salary (Manual override)"
                                                    >
                                                        {formatCurrency(salary.net_salary)}
                                                    </div>
                                                    {salary.details && (
                                                        <div className="attendance-summary-below">
                                                            <span>P:{salary.details.present_days || 0}</span>
                                                            <span>H:{salary.details.half_days || 0}</span>
                                                            <span>L:{salary.details.late_days || 0}</span>
                                                            <span>A:{salary.details.absent_days || 0}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="paid-amount-cell">
                                                    {formatCurrency(salary.paid_amount)}
                                                    {!isFullyPaid && remainingAmount > 0 && (
                                                        <small className="remaining-hint">Due: {formatCurrency(remainingAmount)}</small>
                                                    )}
                                                </td>
                                                <td className="status-cell">{getStatusBadge(salary.payment_status)}</td>
                                                <td className="action-cell">
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-pay"
                                                            onClick={() => {
                                                                setSelectedSalary(salary);
                                                                setPaymentForm({
                                                                    amount: remainingAmount.toString(),
                                                                    payment_method: 'bank_transfer',
                                                                    transaction_id: '',
                                                                    notes: ''
                                                                });
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                            title="Record payment (Does NOT change net salary)"
                                                        >
                                                            <i className="fa-solid fa-indian-rupee-sign"></i>{remainingAmount > 0 ? formatCurrency(remainingAmount) : ''}
                                                        </button>

                                                        <button
                                                            className="btn-history"
                                                            onClick={() => loadEmployeeSalaryHistory(salary.employee_id)}
                                                            title="View Salary History"
                                                        >
                                                            <i className="fa-solid fa-clock-rotate-left"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        <i className="fas fa-chevron-left"></i> Previous
                                    </button>

                                    <div className="pagination-numbers">
                                        {getPageNumbers().map(number => (
                                            <button
                                                key={number}
                                                onClick={() => paginate(number)}
                                                className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                                            >
                                                {number}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Next <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}


                        </>
                    )}
                </div>
            </div>

            {/* Attendance Details Modal */}
            {isAttendanceDetailsModalOpen && selectedAttendanceData && (
                <div className="modal-overlay">
                    <div className="modal-content attendance-details-modal">
                        <div className="modal-header">
                            <h3>Salary Details</h3>
                            <button className="close-btn" onClick={() => setIsAttendanceDetailsModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {loadingAttendance ? (
                                <div className="loading">Loading attendance details...</div>
                            ) : (
                                <>
                                    <div className="details-section">
                                        <div className="details-row">
                                            <span className="details-label">Employee:</span>
                                            <span className="details-value">{selectedAttendanceData.employee?.first_name} {selectedAttendanceData.employee?.last_name}</span>
                                        </div>
                                        <div className="details-row">
                                            <span className="details-label">ID:</span>
                                            <span className="details-value">{selectedAttendanceData.employee?.id}</span>
                                        </div>
                                        <div className="details-row">
                                            <span className="details-label">Department:</span>
                                            <span className="details-value">{selectedAttendanceData.employee?.department || 'N/A'}</span>
                                        </div>
                                        <div className="details-row">
                                            <span className="details-label">Position:</span>
                                            <span className="details-value">{selectedAttendanceData.employee?.position || 'N/A'}</span>
                                        </div>
                                        <div className="details-row">
                                            <span className="details-label">Period:</span>
                                            <span className="details-value">{getMonthName(selectedMonth)} {selectedYear}</span>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4>Attendance Summary</h4>
                                        <div className="attendance-grid">
                                            <div className="attendance-item">
                                                <span className="attendance-label">Present Days</span>
                                                <span className="attendance-value">{selectedAttendanceData.calculation?.present_days || 0}</span>
                                            </div>
                                            <div className="attendance-item">
                                                <span className="attendance-label">Half Days</span>
                                                <span className="attendance-value">{selectedAttendanceData.calculation?.half_days || 0}</span>
                                            </div>
                                            <div className="attendance-item">
                                                <span className="attendance-label">Late Days</span>
                                                <span className="attendance-value">{selectedAttendanceData.calculation?.late_days || 0}</span>
                                            </div>
                                            <div className="attendance-item">
                                                <span className="attendance-label">Absent Days</span>
                                                <span className="attendance-value">{selectedAttendanceData.calculation?.absent_days || 0}</span>
                                            </div>
                                            <div className="attendance-item" style={{ backgroundColor: '#FFF3E0' }}>
                                                <span className="attendance-label">Total Paid Holidays</span>
                                                <span className="attendance-value" style={{ color: '#ff9800', fontWeight: 'bold' }}>
                                                    {totalHolidayCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4>Salary Calculation</h4>
                                        <div className="calculation-breakdown">
                                            <div className="calc-row">
                                                <span>Monthly Salary:</span>
                                                <span>{formatCurrency(selectedAttendanceData.employee?.monthly_salary)}</span>
                                            </div>
                                            <div className="calc-row">
                                                <span>Present Days:</span>
                                                <span>{selectedAttendanceData.calculation?.present_days || 0} days</span>
                                            </div>
                                            <div className="calc-row">
                                                <span>Half Days:</span>
                                                <span>{((selectedAttendanceData.calculation?.half_days || 0) * 0.5)} days</span>
                                            </div>
                                            <div className="calc-row">
                                                <span>Late Days :</span>
                                                <span>{((selectedAttendanceData.calculation?.late_days || 0) * 0.75)} days</span>
                                            </div>
                                            <div className="calc-row">
                                                <span>Paid Holidays:</span>
                                                <span>{totalHolidayCount} days</span>
                                            </div>
                                            <div className="calc-row total">
                                                <span>Effective Days:</span>
                                                <span>
                                                    {(selectedAttendanceData.calculation?.present_days || 0) +
                                                        ((selectedAttendanceData.calculation?.half_days || 0) * 0.5) +
                                                        ((selectedAttendanceData.calculation?.late_days || 0) * 0.75) +
                                                        totalHolidayCount} days
                                                </span>
                                            </div>
                                            <div className="calc-row grand-total">
                                                <span>Calculated Net Salary:</span>
                                                <span>{formatCurrency(selectedAttendanceData.calculation?.calculated_net_salary || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-close-modal" onClick={() => setIsAttendanceDetailsModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary History Modal */}
            {isSalaryDetailsModalOpen && selectedEmployeeData && (
                <div className="modal-overlay">
                    <div className="modal-content salary-details-modal">
                        <div className="modal-header">
                            <h3>Salary History - {selectedEmployeeData.employee?.first_name} {selectedEmployeeData.employee?.last_name}</h3>
                            <button className="close-btn" onClick={() => setIsSalaryDetailsModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {loadingDetails ? (
                                <div className="loading">Loading salary details...</div>
                            ) : (
                                <>
                                    <div className="employee-info-card">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <div>
                                                    <div className="info-label">Employee Name</div>
                                                    <div className="info-value">{selectedEmployeeData.employee?.first_name} {selectedEmployeeData.employee?.last_name}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div>
                                                    <div className="info-label">Employee ID</div>
                                                    <div className="info-value">{selectedEmployeeData.employee?.id}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div>
                                                    <div className="info-label">Position</div>
                                                    <div className="info-value">{selectedEmployeeData.employee?.position || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div>
                                                    <div className="info-label">Monthly Salary</div>
                                                    <div className="info-value">{formatCurrency(selectedEmployeeData.employee?.salary)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-stats">
                                        <div className="stat-card"><div className="stat-label">Total Records</div><div className="stat-value">{selectedEmployeeData.summary?.total_records || 0}</div></div>
                                        <div className="stat-card success"><div className="stat-label">Paid Records</div><div className="stat-value">{selectedEmployeeData.summary?.paid_records || 0}</div></div>
                                        <div className="stat-card warning"><div className="stat-label">Pending Records</div><div className="stat-value">{selectedEmployeeData.summary?.pending_records || 0}</div></div>
                                        <div className="stat-card info"><div className="stat-label">Total Paid</div><div className="stat-value">{formatCurrency(selectedEmployeeData.summary?.total_paid)}</div></div>
                                    </div>

                                    <div className="history-section">
                                        <h4>Salary Payment History</h4>
                                        <div className="table-responsive">
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Month/Year</th>
                                                        <th>Net Salary</th>
                                                        <th>Paid Amount</th>
                                                        <th>Balance</th>
                                                        <th>Status</th>
                                                        <th>Payment Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedEmployeeData.history?.map(record => (
                                                        <tr key={record.id}>
                                                            <td><strong>{record.month}</strong></td>
                                                            <td>{formatCurrency(record.net_salary)}</td>
                                                            <td className="text-success">{formatCurrency(record.paid_amount)}</td>
                                                            <td className={record.balance_amount > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(record.balance_amount)}</td>
                                                            <td>{getStatusBadge(record.payment_status)}</td>
                                                            <td>{record.payment_date ? new Date(record.payment_date).toLocaleDateString() : '-'}</td>
                                                            <td>
                                                                {record.balance_amount > 0 && (
                                                                    <button
                                                                        className="view-details-btn"
                                                                        onClick={() => {
                                                                            setSelectedSalary(record);
                                                                            setPaymentForm({
                                                                                amount: Math.round(record.balance_amount).toString(),
                                                                                payment_method: 'bank_transfer',
                                                                                transaction_id: '',
                                                                                notes: ''
                                                                            });
                                                                            setIsPaymentModalOpen(true);
                                                                            setIsSalaryDetailsModalOpen(false);
                                                                        }}
                                                                    >
                                                                        Pay
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-close-modal" onClick={() => setIsSalaryDetailsModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedSalary && (
                <div className="modal-overlay">
                    <div className="modal-content payment-modal">
                        <div className="modal-header">
                            <h3>Record Payment - {selectedSalary.first_name} {selectedSalary.last_name}</h3>
                            <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-group">
                                <label>Net Salary</label>
                                <div className="net-amount">{formatCurrency(selectedSalary.net_salary)}</div>
                            </div>
                            <div className="form-group">
                                <label>Already Paid</label>
                                <div className="paid-amount">{formatCurrency(selectedSalary.paid_amount)}</div>
                            </div>
                            <div className="form-group">
                                <label>Due Amount</label>
                                <div className="due-amount">{formatCurrency(selectedSalary.balance_amount)}</div>
                            </div>
                            <div className="form-group">
                                <label>Payment Amount *</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    max={Math.round(selectedSalary.balance_amount)}
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <div className="payment-method-options">
                                    <label className="payment-option-label">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="bank_transfer"
                                            checked={paymentForm.payment_method === 'bank_transfer'}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        />
                                        Bank Transfer
                                    </label>
                                    <label className="payment-option-label">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cheque"
                                            checked={paymentForm.payment_method === 'cheque'}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        />
                                        Cheque
                                    </label>
                                    <label className="payment-option-label">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="upi"
                                            checked={paymentForm.payment_method === 'upi'}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        />
                                        UPI
                                    </label>
                                    <label className="payment-option-label">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cash"
                                            checked={paymentForm.payment_method === 'cash'}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        />
                                        Cash
                                    </label>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryManagement;
