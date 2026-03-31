import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../../../services/expenseAPI';
import { useAuth } from '../../../contexts/AuthContext';
import AddExpenseModal from '../../../components/expenses/AddExpenseModal';
import './Employee.css';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadExpenses();
  }, [filter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};
      const response = await expenseAPI.getAll(filters);
      setExpenses(response.data.expenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (expenseId, status) => {
    try {
      await expenseAPI.updateStatus(expenseId, status);
      loadExpenses(); // Reload expenses
    } catch (error) {
      console.error('Error updating expense status:', error);
      alert('Failed to update expense status');
    }
  };

  const handleExpenseAdded = () => {
    loadExpenses(); // Refresh the list after adding
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: { background: '#fef3c7', color: '#92400e' },
      approved: { background: '#d1fae5', color: '#065f46' },
      rejected: { background: '#fee2e2', color: '#991b1b' }
    };
    
    const colors = statusColors[status] || { background: '#f3f4f6', color: '#374151' };
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        background: colors.background,
        color: colors.color
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      Loading expenses...
    </div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Add Expense Modal */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#2d3748' }}>
            Expense Management
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Add Expense Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
           style={{
  background: 'linear-gradient(135deg, #8a87c9 0%, #d4a3d2 33%, #e893c0 66%, #f8d1e8 100%)',
  border: 'none',
  color: 'white',
  padding: '0.75rem 1.5rem',
  borderRadius: '10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(138, 135, 201, 0.3)',
}}

            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6V12M12 12V18M12 12H18M12 12H6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Expense
            </button>

            {/* Status Filter */}
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Rest of your expense table code remains the same */}
        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <div style={{ marginBottom: '1rem' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="#9CA3AF"/>
              </svg>
            </div>
            <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>No expenses found</p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {filter === 'all' 
                ? 'Get started by submitting your first expense.'
                : `No ${filter} expenses found.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#6d6ab8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Submit Your First Expense
              </button>
            )}
          </div>
        ) : (
          // Your existing expense table code here
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              {/* Table headers and rows remain the same */}
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Employee</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#2d3748' }}>
                          {expense.first_name} {expense.last_name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                          {expense.user_role}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#4a5568' }}>{expense.category_name}</td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: '#2d3748' }}>
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', color: '#4a5568', maxWidth: '200px' }}>
                      {expense.description}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(expense.status)}
                    </td>
                    <td style={{ padding: '1rem', color: '#718096', fontSize: '0.875rem' }}>
                      {new Date(expense.submitted_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {expense.status === 'pending' && (user.role === 'admin' || user.role === 'hr') && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStatusUpdate(expense.id, 'approved')}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#48bb78',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(expense.id, 'rejected')}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#f56565',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
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