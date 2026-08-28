import api from '../lib/api';

export const applicationService = {
  // Submit a new application
  submitApplication: (data) => api.post('/applications', data),

  // Get applications with filters
  getApplications: (params) => api.get('/applications', { params }),

  // Get single application
  getApplicationById: (id) => api.get(`/applications/${id}`),

  // Get applications by vacancy
  getApplicationsByVacancy: (vacancyId, params) =>
    api.get(`/applications/vacancy/${vacancyId}`, { params }),

  // Get applications by student/alumni
  getApplicationsByAlumni: (alumniId, params) =>
    api.get(`/applications/alumni/${alumniId}`, { params }),

  // Update application status
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),

  // Recruitment stages
  addStage: (id, data) => api.post(`/applications/${id}/stages`, data),
  updateStage: (id, stageId, data) => api.put(`/applications/${id}/stages/${stageId}`, data),
  getStages: (id) => api.get(`/applications/${id}/stages`),

  // Status audit trail
  getAuditTrail: (id) => api.get(`/applications/${id}/audits`),
};
