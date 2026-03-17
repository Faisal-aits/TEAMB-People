import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../../services/expenseAPI';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
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
      
      // Reset form
      setFormData({
        category_id: '',
        amount: '',
        description: '',
        receipt_url: ''
      });
      
      onExpenseAdded(); // Refresh the expense list
      onClose(); // Close modal
      
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#2d3748' }}>
            Submit New Expense
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Expense Category *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.limit_amount > 0 && `(Limit: ₹${category.limit_amount})`}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Amount (₹) *
            </label>
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
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the expense purpose..."
              rows="4"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Receipt URL (Optional) */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              Receipt URL (Optional)
            </label>
            <input
              type="url"
              name="receipt_url"
              value={formData.receipt_url}
              onChange={handleChange}
              placeholder="https://example.com/receipt.jpg"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#4a5568',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#cbd5e0' : '#6d6ab8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
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

export default AddExpenseModal;