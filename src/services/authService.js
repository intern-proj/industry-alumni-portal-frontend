import api from '../lib/api';

export const authService = {
  // Multi-role login (Students direct auth, Staff & Partners trigger 2FA OTP)
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  // Admin portal login (Step 1 — returns session token + triggers 2FA OTP)
  adminLogin: (username, password) =>
    api.post('/auth/admin/login', { username, password }),

  // Backward compatibility alias for staff/admin login
  staffLogin: (username, password) =>
    api.post('/auth/admin/login', { username, password }),

  // Multi-role OTP verification (Step 2 — Staff, Partners, Admins)
  verifyOtp: (sessionToken, otpCode) =>
    api.post('/auth/verify-otp', { sessionToken, tempToken: sessionToken, otpCode }),

  adminVerifyOtp: (sessionToken, otpCode) =>
    api.post('/auth/admin/verify-otp', { sessionToken, tempToken: sessionToken, otpCode }),

  // Validate JWT token
  validateToken: (token) =>
    api.post('/auth/validate', null, { params: { token } }),

  // Get current user info
  getCurrentUser: () =>
    api.get('/auth/me'),

  // Admin directly creates another Administrator account
  createAdmin: (username, email, password) =>
    api.post('/auth/admin/create', { username, email, password }),

  // Admin deletes Administrator/Staff account credentials and invitations
  deleteAdmin: (identifier) =>
    api.delete(`/auth/user/${identifier}`),

  // Admin invites a new staff member
  inviteStaff: (email, role) =>
    api.post('/auth/staff/invite', { email, role }),

  // Admin revokes a pending staff invitation
  revokeStaffInvitation: (email) =>
    api.delete('/auth/staff/invite', { params: { email } }),

  // Staff completes registration via invitation token
  completeStaffRegistration: (invitationToken, username, password) =>
    api.post('/auth/staff/complete-registration', { invitationToken, username, password }),

  // Partner applies for registration (creates pending partner)
  createPendingPartner: (data) =>
    api.post('/auth/partner/pending', data),

  // Partner completes registration via approval token
  completePartnerRegistration: (registrationToken, username, password) =>
    api.post('/auth/partner/complete-registration', { registrationToken, username, password }),

  // Stage 1 Partner Approvals
  getPartnerProfile: () => api.get('/auth/partner/me'),

  // Stage 1 Partner Approvals
  getPendingPartners: () =>
    api.get('/admin/pending-partners'),

  approvePendingPartner: (id) =>
    api.post(`/admin/pending-partners/${id}/approve`),

  rejectPendingPartner: (id) =>
    api.post(`/admin/pending-partners/${id}/reject`),

  // Registered Industry Partners Management
  getIndustryPartners: () =>
    api.get('/admin/partners'),

  toggleIndustryPartnerStatus: (id) =>
    api.put(`/admin/partners/${id}/status`),

  deleteIndustryPartner: (id) =>
    api.delete(`/admin/partners/${id}`),

  // Password reset flows
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),
};
