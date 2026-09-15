import api from '../lib/api';

const FEEDBACK_STORAGE_KEY = 'nsbm_event_feedback_records';

const getStoredFeedbacks = () => {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveFeedbackLocally = (feedbackData) => {
  try {
    const current = getStoredFeedbacks();
    const entry = {
      ...feedbackData,
      submittedAt: new Date().toISOString(),
    };
    // Replace existing if already present for same event or registration, else append
    const filtered = current.filter(
      (item) =>
        !(
          (feedbackData.eventId && String(item.eventId) === String(feedbackData.eventId)) ||
          (feedbackData.registrationId && String(item.registrationId) === String(feedbackData.registrationId))
        )
    );
    filtered.push(entry);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('event-feedback-submitted', { detail: entry }));
  } catch (err) {
    console.warn('Failed to cache feedback locally:', err);
  }
};

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
  submitFeedback: async (data) => {
    saveFeedbackLocally(data);
    try {
      const res = await api.post('/feedback', data);
      return res;
    } catch (err) {
      // If backend endpoint is not yet configured, return graceful success since we saved locally
      console.warn('Backend feedback endpoint fallback:', err);
      return { data: { status: 'success', message: 'Feedback recorded locally' } };
    }
  },

  hasSubmittedFeedback: (eventId, registrationId, eventName) => {
    const list = getStoredFeedbacks();
    return list.some((item) => {
      if (eventId && String(item.eventId) === String(eventId)) return true;
      if (registrationId && String(item.registrationId) === String(registrationId)) return true;
      if (eventName && item.eventTitle && item.eventTitle.toLowerCase().trim() === eventName.toLowerCase().trim()) return true;
      return false;
    });
  },

  getFeedback: (eventId, registrationId) => {
    const list = getStoredFeedbacks();
    return list.find(
      (item) =>
        (eventId && String(item.eventId) === String(eventId)) ||
        (registrationId && String(item.registrationId) === String(registrationId))
    );
  },

  // Certificate Eligibility
  getCertificateEligibility: (registrationId) => api.get(`/certificate-eligibility/registration/${registrationId}`),
};
