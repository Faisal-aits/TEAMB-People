// src/services/expenseAPI.js
import api from './api';

export const expenseAPI = {
  // Get all expenses
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_id) params.append('category_id', filters.category_id);
    return api.get(`/expenses?${params.toString()}`);
  },

  // Get expense categories
  getCategories: () => api.get('/expenses/categories'),

  // Get my expenses
  getMyExpenses: () => api.get('/expenses/my'),

  // Get expense by ID
  getById: (id) => api.get(`/expenses/${id}`),

  // Submit new expense
  create: (expenseData) => api.post('/expenses', expenseData),

  // Update expense status
  updateStatus: (id, status) => api.put(`/expenses/${id}/status`, { status }),
};