import api from '../lib/api';

export const certificateService = {
  // Student - get earned certificates
  getStudentCertificates: (studentId) =>
    api.get(`/certificates/student/${studentId}`),

  // Public - verify certificate by QR hash
  verifyCertificate: (qrHash) =>
    api.get(`/certificates/verify/${qrHash}`),

  // Download certificate PDF file
  downloadCertificatePdf: (id) =>
    api.get(`/certificates/${id}/download`, { responseType: 'blob' }),

  // Get certificate by ID
  getCertificateById: (id) =>
    api.get(`/certificates/${id}`),

  // Get verification audit logs for a certificate
  getVerificationLogs: (id) =>
    api.get(`/certificates/${id}/verification-logs`),

  // Admin / Staff - Get all background templates
  getAllTemplates: (activeOnly = false) =>
    api.get('/certificates/templates', { params: { activeOnly } }),

  // Admin / Staff - Create/upload background template
  createTemplate: (data) =>
    api.post('/certificates/templates', data),

  // Admin / Staff - Generate single certificate
  generateCertificate: (data) =>
    api.post('/certificates/generate', data),

  // Admin / Staff - Bulk generate certificates
  bulkGenerateCertificates: (data) =>
    api.post('/certificates/batch-generate', data),

  // Admin / Staff - Update certificate status
  updateStatus: (id, status) =>
    api.patch(`/certificates/${id}/status`, null, { params: { status } }),

  // System stats
  getStats: () =>
    api.get('/certificates/stats'),
};
