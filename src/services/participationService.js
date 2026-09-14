import api from '../lib/api';

export const participationService = {
  // Event Registrations
  registerForEvent: (data) => api.post('/registrations', data),
  getRegistrations: (params) => api.get('/registrations', { params }),
  getRegistrationById: (id) => api.get(`/registrations/${id}`),
  updateRegistrationStatus: (id, status) =>
    api.patch(`/registrations/${id}/status`, typeof status === 'string' ? { status } : status),
  deleteRegistration: (id) => api.delete(`/registrations/${id}`),

  // QR Attendance Sessions
  createQrSession: (eventId, data) => api.post(`/events/${eventId}/qr-sessions`, data),
  getQrSession: (qrId) => api.get(`/qr-sessions/${qrId}`),
  getQrSessionsByEvent: (eventId) => api.get(`/events/${eventId}/qr-sessions`),
  verifyQrCode: (qrCodeValue) => api.get(`/qr-sessions/${qrCodeValue}/verify`),
  deactivateQrSession: (qrId) => api.delete(`/qr-sessions/${qrId}`),

  // Attendance
  checkinAttendance: (data) => api.post('/attendance/checkin', data),
  getAttendanceByRegistration: (registrationId) => api.get(`/attendance/registration/${registrationId}`),

  // Feedback
  submitFeedback: (data) => api.post('/feedback', data),

  // Certificate Eligibility
  getCertificateEligibility: (registrationId) => api.get(`/certificate-eligibility/registration/${registrationId}`),
};
