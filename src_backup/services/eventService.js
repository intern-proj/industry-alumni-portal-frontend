import api from '../lib/api';

export const eventService = {
  // Events CRUD
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  updateEventStatus: (id, data) => api.patch(`/events/${id}/status`, typeof data === 'string' ? { status: data } : data),
  rescheduleEvent: (id, data) => api.patch(`/events/${id}/reschedule`, data),
  cancelEvent: (id) => api.patch(`/events/${id}/cancel`),
  assignCoordinator: (id, data) => api.post(`/events/${id}/coordinator`, data),
  removeCoordinator: (id) => api.delete(`/events/${id}/coordinator`),

  // Eligibility Criteria
  getEligibilityCriteria: (eventId) => api.get(`/events/${eventId}/eligibility-criteria`),
  setEligibilityCriteria: (eventId, data) => api.put(`/events/${eventId}/eligibility-criteria`, data),
  deleteEligibilityCriteria: (eventId) => api.delete(`/events/${eventId}/eligibility-criteria`),

  // Venues CRUD
  getVenues: (params) => api.get('/venues', { params }),
  getVenueById: (id) => api.get(`/venues/${id}`),
  createVenue: (data) => api.post('/venues', data),
  updateVenue: (id, data) => api.put(`/venues/${id}`, data),
  deleteVenue: (id) => api.delete(`/venues/${id}`),

  // Guest Speakers CRUD
  getSpeakers: (params) => api.get('/guest-speakers', { params }),
  getSpeakerById: (id) => api.get(`/guest-speakers/${id}`),
  createSpeaker: (data) => api.post('/guest-speakers', data),
  updateSpeaker: (id, data) => api.put(`/guest-speakers/${id}`, data),
  deleteSpeaker: (id) => api.delete(`/guest-speakers/${id}`),
  sendInvite: (id) => api.post(`/guest-speakers/${id}/invite`),
  getMe: () => api.get('/guest-speakers/me'),
  getAssignedEvents: (speakerId) => api.get(`/events/speaker/${speakerId}`),

  // Agendas CRUD
  getAgendas: (params) => api.get('/agendas', { params }),
  getAgendaById: (id) => api.get(`/agendas/${id}`),
  createAgenda: (data) => api.post('/agendas', data),
  updateAgenda: (id, data) => api.put(`/agendas/${id}`, data),
  deleteAgenda: (id) => api.delete(`/agendas/${id}`),

  // QR and Attendance
  getQrToken: (agendaId) => api.get(`/events/agendas/${agendaId}/qr-token`),
  scanAttendance: (data) => api.post('/events/attendance/scan', data),
};
