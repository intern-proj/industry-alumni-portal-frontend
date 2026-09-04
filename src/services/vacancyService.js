import api from '../lib/api';

export const vacancyService = {
  // Public Vacancies
  getPublicVacancies: (params) =>
    api.get('/vacancies/public', { params }).catch(() => api.get('/vacancies', { params })),

  getVacancyById: (id) =>
    api.get(`/vacancies/public/${id}`).catch(() => api.get(`/vacancies/${id}`)),

  // Partner Vacancy Operations
  getMyVacancies: (partnerId, params) =>
    api.get(`/vacancies/partner/${partnerId}`, { params }),

  getPartnerVacancies: (partnerId, params) =>
    api.get(`/vacancies/partner/${partnerId}`, { params }),

  createVacancy: (data) =>
    api.post('/vacancies/partner', data).catch(() => api.post('/vacancies', data)),

  updateVacancy: (id, data) =>
    api.put(`/vacancies/partner/${id}`, data).catch(() => api.put(`/vacancies/${id}`, data)),

  deleteVacancy: (id) =>
    api.delete(`/vacancies/partner/${id}`).catch(() => api.delete(`/vacancies/${id}`)),

  closeVacancy: (id) =>
    api.patch(`/vacancies/partner/${id}/close`).catch(() => api.patch(`/vacancies/admin/${id}/close`)),

  reopenVacancy: (id) =>
    api.patch(`/vacancies/partner/${id}/reopen`).catch(() => api.patch(`/vacancies/admin/${id}/reopen`)),

  // Admin & Staff Operations (Direct Vacancy Service)
  getAdminVacancies: (params) =>
    api.get('/vacancies/admin', { params }),

  getAdminVacancyById: (id) =>
    api.get(`/vacancies/admin/${id}`).catch(() => api.get(`/vacancies/public/${id}`)),

  reviewAdminVacancy: (id, data) =>
    api.put(`/vacancies/admin/${id}/approval`, data),

  getAdminVacancyStats: () =>
    api.get('/vacancies/admin/stats'),

  reprocessAdminVacancy: (id) =>
    api.post(`/vacancies/admin/${id}/reprocess`),
};


