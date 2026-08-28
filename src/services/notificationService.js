import api from '../lib/api';

export const notificationService = {
  // Get all email templates
  getTemplates: () => api.get('/templates'),

  // Get template by ID
  getTemplateById: (id) => api.get(`/templates/${id}`),

  // Get template by code (e.g., 'OTP_EMAIL')
  getTemplateByCode: (code) => api.get(`/templates/code/${code}`),

  // Create new template
  createTemplate: (data) => api.post('/templates', data),

  // Update template
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),

  // Delete template
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
};
