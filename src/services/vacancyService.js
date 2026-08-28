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
};
