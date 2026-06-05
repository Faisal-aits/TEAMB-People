// src/services/expenseAPI.js
import api from './api';

export const expenseAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.payment_status) params.append('payment_status', filters.payment_status);
    
    const queryString = params.toString();
    const url = queryString ? `/expenses?${queryString}` : '/expenses';
    console.log('GET expenses URL:', url);
    return api.get(url);
  },

  getCategories: () => {
    console.log('Fetching categories');
    return api.get('/expenses/categories');
  },

  createCategory: (categoryData) => {
    console.log('Creating category:', categoryData);
    return api.post('/expenses/categories', categoryData);
  },

  getMyExpenses: () => api.get('/expenses/my'),

  getById: (id) => api.get(`/expenses/${id}`),

  create: (expenseData) => {
    // Log the data being sent
    if (expenseData instanceof FormData) {
      console.log('Sending FormData:');
      for (let pair of expenseData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'image' ? pair[1].name : pair[1]));
      }
      return api.post('/expenses', expenseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    console.log('Sending expense data:', expenseData);
    return api.post('/expenses', expenseData);
  },

  updateStatus: (id, status) => api.put(`/expenses/${id}/status`, { status }),
  
  updatePaymentStatus: (id, paymentStatus) => {
    console.log('Updating payment status:', id, paymentStatus);
    return api.put(`/expenses/${id}/payment-status`, { payment_status: paymentStatus });
  },
};