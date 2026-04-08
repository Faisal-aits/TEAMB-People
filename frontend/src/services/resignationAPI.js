import api from './api';

export const resignationAPI = {
  submitRequest: (data) => api.post('/resignation-requests', data),
  getMyRequests: () => api.get('/resignation-requests/my'),
  getAllRequests: () => api.get('/resignation-requests'),
  getRequestById: (id) => api.get(`/resignation-requests/${id}`),
 acceptRequest: async (id, formData) => {
    return await api.put(`/resignation-requests/${id}/accept`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
},
  rejectRequest: (id, data) => api.put(`/resignation-requests/${id}/reject`, data)
};

export default resignationAPI;
