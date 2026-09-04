import api from '../lib/api';

export const platformService = {
  // ═══════════════════════════════════════════════
  // Partner Verifications (Admin / Staff)
  // ═══════════════════════════════════════════════
  getPartnerVerifications: (status, params) =>
    api.get('/admin/partner-verifications', { params: { status, ...params } }),

  getPartnerVerificationById: (id) =>
    api.get(`/admin/partner-verifications/${id}`),

  getPartnerVerificationHistory: (id) =>
    api.get(`/admin/partner-verifications/${id}/history`),

  claimPartnerVerification: (id, reviewerId) =>
    api.post(`/admin/partner-verifications/${id}/claim`, null, { params: { reviewerId } }),

  submitPartnerDecision: (id, data) =>
    api.post(`/admin/partner-verifications/${id}/decision`, data),

  adminEditPartnerVerification: (id, data) =>
    api.patch(`/admin/partner-verifications/${id}`, data),

  getMyVerificationStatus: () =>
    api.get('/partner-verifications/me'),

  reapplyPartnerVerification: () =>
    api.post('/partner-verifications/me/reapply'),

  uploadFileToStorage: (file, uploaderId, fileType = 'OTHER') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', uploaderId);
    formData.append('fileType', fileType);
    return api.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ═══════════════════════════════════════════════
  // Partner Documents (Partner-facing)
  // ═══════════════════════════════════════════════
  listPartnerDocuments: (verificationId) =>
    api.get(`/partner-verifications/${verificationId}/documents`),

  uploadPartnerDocument: (verificationId, data) =>
    api.post(`/partner-verifications/${verificationId}/documents`, data),

  deletePartnerDocument: (verificationId, documentId) =>
    api.delete(`/partner-verifications/${verificationId}/documents/${documentId}`),

  submitForReview: (verificationId) =>
    api.post(`/partner-verifications/${verificationId}/submit-for-review`),

  // ═══════════════════════════════════════════════
  // Vacancy Approvals (Admin / Staff)
  // ═══════════════════════════════════════════════
  getVacancyApprovals: (status, params) =>
    api.get('/admin/vacancy-approvals', { params: { status, ...params } }),

  getVacancyApprovalById: (id) =>
    api.get(`/admin/vacancy-approvals/${id}`),

  getVacancyApprovalHistory: (id) =>
    api.get(`/admin/vacancy-approvals/${id}/history`),

  submitVacancyApproval: (data) =>
    api.post('/internal/vacancy-approvals', data),

  claimVacancyApproval: (id, reviewerId) =>
    api.post(`/admin/vacancy-approvals/${id}/claim`, null, { params: { reviewerId } }),

  submitVacancyDecision: (id, data) =>
    api.post(`/admin/vacancy-approvals/${id}/decision`, data),

  reviewVacancyApproval: (id, data) =>
    api.post(`/admin/vacancy-approvals/${id}/decision`, data),

  adminEditVacancyApproval: (id, data) =>
    api.patch(`/admin/vacancy-approvals/${id}`, data),
};

