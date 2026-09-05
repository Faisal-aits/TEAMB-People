// Merged Expense Management Component - No role restrictions
import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../../services/expenseAPI';
import { useTableControls } from '../../hooks/useTableControls';
import './ExpenseManagement.css';
import '../../styles/tableControls.css';

import { API_BASE_URL as API_URL } from '../../services/api';

const getExpenseEmployeeName = (expense = {}) => {
  const fullName = expense.employee_name || `${expense.first_name || ''} ${expense.last_name || ''}`.trim();
  return fullName || expense.email || (expense.employee_id ? `User #${expense.employee_id}` : 'N/A');
};

const EXPENSE_SEARCH_FIELDS = [getExpenseEmployeeName, 'employee_code', 'category_name', 'description', 'payment_status', 'amount', 'submitted_at'];

// AddExpenseModal Component (integrated)
const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    limit_amount: '',
    description: ''
  });
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    receipt_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await expenseAPI.getCategories();
      const catList = response.data?.categories || [];
      setCategories(catList);
      const defaultCat = catList.find(c => String(c.name || '').trim().toLowerCase() === 'food') || catList[0];
      if (defaultCat) {
        setFormData(prev => ({
          ...prev,
          category_id: prev.category_id || defaultCat.id
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    setAddingCategory(true);
    try {
      const response = await expenseAPI.createCategory({
        name: newCategoryData.name.trim(),
        limit_amount: newCategoryData.limit_amount ? parseFloat(newCategoryData.limit_amount) : 0,
        description: newCategoryData.description.trim()
      });

      if (response.data.category) {
        setCategories([...categories, response.data.category]);
        setFormData(prev => ({
          ...prev,
          category_id: response.data.category.id
        }));

        setNewCategoryData({ name: '', limit_amount: '', description: '' });
        setShowAddCategory(false);
        alert('Category created successfully!');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.message || 'Failed to create category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategoryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      await expenseAPI.create(expenseData);
      
      setFormData({
        category_id: '',
        amount: '',
        description: '',
        receipt_url: ''
      });
      
      onExpenseAdded();
      onClose();
      
      alert('Expense submitted successfully!');
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert(error.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700', color: '#1e293b' }}>
              Submit New Expense
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Fill in the details below to claim your reimbursement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#334155'
              }}>
                Expense Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6d6ab8',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showAddCategory ? '✕ Cancel' : '+ Add Category'}
              </button>
            </div>

            {!showAddCategory ? (
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.925rem',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6d6ab8'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Select an expense category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} {category.limit_amount > 0 ? `(Limit: ₹${category.limit_amount})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.1rem',
                backgroundColor: '#f8fafc',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.35rem',
                    fontWeight: '600',
                    fontSize: '0.825rem',
                    color: '#475569'
                  }}>
                    Category Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategoryData.name}
                    onChange={handleNewCategoryChange}
                    placeholder="e.g. Travel, Food, Internet"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.35rem',
                    fontWeight: '600',
                    fontSize: '0.825rem',
                    color: '#475569'
                  }}>
                    Limit Amount (₹) <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="limit_amount"
                    value={newCategoryData.limit_amount}
                    onChange={handleNewCategoryChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.35rem',
                    fontWeight: '600',
                    fontSize: '0.825rem',
                    color: '#475569'
                  }}>
                    Description <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={newCategoryData.description}
                    onChange={handleNewCategoryChange}
                    placeholder="Brief description of this category..."
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCategory}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: addingCategory ? '#cbd5e1' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: addingCategory ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {addingCategory ? 'Creating...' : '✓ Create Category'}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#334155'
            }}>
              Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                ₹
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem 0.7rem 2rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6d6ab8'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#334155'
            }}>
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the expense purpose..."
              rows="3"
              required
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.925rem',
                color: '#1e293b',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6d6ab8'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: '#334155'
            }}>
              Receipt URL <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="url"
              name="receipt_url"
              value={formData.receipt_url}
              onChange={handleChange}
              placeholder="https://example.com/receipt.jpg"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.925rem',
                color: '#1e293b',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6d6ab8'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.4rem',
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.925rem',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.65rem 1.6rem',
                background: loading ? '#94a3b8' : '#6d6ab8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.925rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(109, 106, 184, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main ExpenseManagement Component
const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const {
    controlledRows: visibleExpenses,
    requestSort,
    searchTerm,
    setSearchTerm,
    sortLabel,
  } = useTableControls(expenses, EXPENSE_SEARCH_FIELDS, { key: 'submitted_at', accessor: 'submitted_at', direction: 'desc' });

  useEffect(() => {
    loadExpenses();
  }, [paymentFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (paymentFilter !== 'all') filters.payment_status = paymentFilter;
      
      const response = await expenseAPI.getAll(filters);
      const expensesData = response.data.expenses || [];
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (expenseId, paymentStatus) => {
    setUpdatingId(expenseId);
    
    try {
      await expenseAPI.updatePaymentStatus(expenseId, paymentStatus);
      await loadExpenses();
      alert(`Payment marked as ${paymentStatus.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update payment status';
      alert(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExpenseAdded = () => {
    loadExpenses();
  };

  const getPaymentBadge = (paymentStatus) => {
    const status = paymentStatus || 'pending';
    const paymentColors = {
      pending: { background: '#fef3c7', color: '#92400e'},
      paid: { background: '#d1fae5', color: '#065f46'},
      cancelled: { background: '#fee2e2', color: '#991b1b' }
    };
    
    const colors = paymentColors[status] || paymentColors.pending;
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        background: colors.background,
        color: colors.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {colors.icon} {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem' }}>Loading expenses...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <AddExpenseModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />

      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#2d3748' }}>
            Reimbursements
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="table-search-input"
              type="search"
              placeholder="Search employee, category, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                width: '260px',
                fontSize: '0.9rem'
              }}
            />

            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: 'white',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: '#e0e7ff',
                color: '#3730a3',
                border: '1px solid #c7d2fe',
                padding: '0.65rem 1.3rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#c7d2fe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e0e7ff'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Add Reimbursement
            </button>
          </div>
        </div>

        {visibleExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <div style={{ marginBottom: '1rem' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="#9CA3AF"/>
              </svg>
            </div>
            <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>No expenses found</p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {paymentFilter !== 'all' || searchTerm
                ? 'Try changing your filters to see more results.'
                : 'Get started by submitting your first expense.'}
            </p>
            {paymentFilter === 'all' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#6d6ab8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Submit First Expense
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f9fafb' }}>
                  <th className="sortable-th" onClick={() => requestSort('category_name', 'category_name')} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Category{sortLabel('category_name')}</th>
                  <th className="sortable-th" onClick={() => requestSort('employee_name', getExpenseEmployeeName)} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Employee{sortLabel('employee_name')}</th>
                  <th className="sortable-th" onClick={() => requestSort('amount', 'amount')} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Amount{sortLabel('amount')}</th>
                  <th className="sortable-th" onClick={() => requestSort('description', 'description')} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Description{sortLabel('description')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Receipt</th>
                  <th className="sortable-th" onClick={() => requestSort('payment_status', 'payment_status')} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Payment Status{sortLabel('payment_status')}</th>
                  <th className="sortable-th" onClick={() => requestSort('submitted_at', 'submitted_at')} style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Date{sortLabel('submitted_at')}</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((expense, index) => (
                  <tr key={expense.id || index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', color: '#4a5568' }}>{expense.category_name || 'N/A'}</td>
                    <td style={{ padding: '1rem', color: '#4a5568' }}>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{getExpenseEmployeeName(expense)}</div>
                      {expense.employee_code && (
                        <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.2rem' }}>ID: {expense.employee_code}</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#2d3748' }}>
                      &#8377;{parseFloat(expense.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', color: '#4a5568', maxWidth: '250px', wordWrap: 'break-word' }}>
                      {expense.description || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {expense.image ? (
                        <a 
                          href={`${API_URL}${expense.image}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#6d6ab8',
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                          }}
                        >
                          <span>View Receipt</span>
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No receipt</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getPaymentBadge(expense.payment_status)}
                    </td>
                    <td style={{ padding: '1rem', color: '#718096', fontSize: '0.875rem' }}>
                      {expense.submitted_at ? new Date(expense.submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handlePaymentUpdate(expense.id, 'paid')}
                          disabled={updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled'}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: (expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 'not-allowed' : 'pointer',
                            opacity: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 0.6 : 1
                          }}
                        >
                          {updatingId === expense.id ? '...' : 'Paid'}
                        </button>
                        <button
                          onClick={() => handlePaymentUpdate(expense.id, 'pending')}
                          disabled={updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled'}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: (expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? '#9ca3af' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 'not-allowed' : 'pointer',
                            opacity: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 0.6 : 1
                          }}
                        >
                          {updatingId === expense.id ? '...' : ' Pending'}
                        </button>
                        <button
                          onClick={() => handlePaymentUpdate(expense.id, 'cancelled')}
                          disabled={updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled'}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: (expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? '#9ca3af' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 'not-allowed' : 'pointer',
                            opacity: (updatingId === expense.id || expense.payment_status === 'paid' || expense.payment_status === 'cancelled') ? 0.6 : 1
                          }}
                        >
                          {updatingId === expense.id ? '...' : ' Cancel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
