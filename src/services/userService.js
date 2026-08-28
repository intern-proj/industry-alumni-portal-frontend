import api from '../lib/api';

export const userService = {
  // ═══════════════════════════════════════════════
  // User Profiles
  // ═══════════════════════════════════════════════
  createProfile: (data) => api.post('/user-profiles', data),
  getProfileByUserId: (userId) => api.get(`/user-profiles/${userId}`),
  updateProfile: (userId, data) => api.put(`/user-profiles/${userId}`, data),
  toggleAvailability: (userId, isActivelyLooking) =>
    api.patch(`/user-profiles/${userId}/availability`, null, { params: { isActivelyLooking } }),
  updateJobPreference: (userId, data) => api.put(`/user-profiles/${userId}/job-preferences`, data),
  getJobPreference: (userId) => api.get(`/user-profiles/${userId}/job-preferences`),
  searchUsersBySkills: (skills) =>
    api.get('/user-profiles/search/skills', { params: { skills: Array.isArray(skills) ? skills.join(',') : skills } }),

  // ═══════════════════════════════════════════════
  // Resumes
  // ═══════════════════════════════════════════════
  addResume: (userId, data) => api.post(`/user-profiles/${userId}/resumes`, data),
  getResumesByUserId: (userId) => api.get(`/user-profiles/${userId}/resumes`),
  setPrimaryResume: (userId, resumeId) =>
    api.patch(`/user-profiles/${userId}/resumes/${resumeId}/primary`),
  deleteResume: (userId, resumeId) =>
    api.delete(`/user-profiles/${userId}/resumes/${resumeId}`),

  // ═══════════════════════════════════════════════
  // Admin User Management
  // ═══════════════════════════════════════════════
  createManagementOrAdminUser: (data) => api.post('/admin/users', data),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateAccountStatus: (userId, status) =>
    api.patch(`/admin/users/${userId}/status`, null, { params: { status } }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // ═══════════════════════════════════════════════
  // Academic Records
  // ═══════════════════════════════════════════════
  saveAcademicRecord: (userId, data) =>
    api.post(`/user-profiles/${userId}/academic-records`, data),
  getAcademicRecord: (userId) =>
    api.get(`/user-profiles/${userId}/academic-records`),
  deleteAcademicRecord: (userId) =>
    api.delete(`/user-profiles/${userId}/academic-records`),

  // ═══════════════════════════════════════════════
  // Academic Config (Faculties & Departments)
  // ═══════════════════════════════════════════════
  createFaculty: (data) => api.post('/academic-config/faculties', data),
  getAllFaculties: () => api.get('/academic-config/faculties'),
  getFacultyById: (facultyId) => api.get(`/academic-config/faculties/${facultyId}`),
  addDepartment: (facultyId, data) =>
    api.post(`/academic-config/faculties/${facultyId}/departments`, data),
  getDepartmentsByFaculty: (facultyId) =>
    api.get(`/academic-config/faculties/${facultyId}/departments`),
  deleteFaculty: (facultyId) =>
    api.delete(`/academic-config/faculties/${facultyId}`),
  deleteDepartment: (departmentId) =>
    api.delete(`/academic-config/departments/${departmentId}`),

  // ═══════════════════════════════════════════════
  // Skills
  // ═══════════════════════════════════════════════
  addSkill: (userId, data) => api.post(`/user-profiles/${userId}/skills`, data),
  getSkillsByUserId: (userId) => api.get(`/user-profiles/${userId}/skills`),
  deleteSkill: (userId, skillId) => api.delete(`/user-profiles/${userId}/skills/${skillId}`),

  // ═══════════════════════════════════════════════
  // Speaker Profiles
  // ═══════════════════════════════════════════════
  createSpeakerProfile: (data) => api.post('/speakers', data),
  getSpeakerById: (speakerId) => api.get(`/speakers/${speakerId}`),
  getSpeakerByUserId: (userId) => api.get(`/speakers/user/${userId}`),
  searchSpeakers: (params) => api.get('/speakers', { params }),
  updateSpeakerProfile: (speakerId, data) => api.put(`/speakers/${speakerId}`, data),
  deleteSpeakerProfile: (speakerId) => api.delete(`/speakers/${speakerId}`),
};
