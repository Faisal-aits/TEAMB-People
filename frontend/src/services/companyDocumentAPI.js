import api from './api';

export const companyDocumentAPI = {
  getAll: () => api.get('/company-documents'),
  create: (data) => api.post('/company-documents', data),
  delete: (id) => api.delete(`/company-documents/${id}`)
};

export default companyDocumentAPI;
