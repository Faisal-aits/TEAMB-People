// src/services/expenseAPI.js
import api from './api';

export const expenseAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    return api.get(`/expenses?${params.toString()}`);
  },

  getCategories: () => {
    return api.get('/expenses/categories');
  },

  getMyExpenses: () => api.get('/expenses/my'),

  getById: (id) => api.get(`/expenses/${id}`),

  create: (expenseData) => {
    // If expenseData is FormData, send with multipart header
    if (expenseData instanceof FormData) {
      return api.post('/expenses', expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/expenses', expenseData);
  },

  updateStatus: (id, status) => api.put(`/expenses/${id}/status`, { status }),
  
  updatePaymentStatus: (id, paymentStatus) => api.put(`/expenses/${id}/payment-status`, { payment_status: paymentStatus }),
};