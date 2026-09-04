import api from '../lib/api';

export const storageService = {
  // Upload a file (resume, document, etc.)
  uploadFile: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return api.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // List uploaded files
  getFiles: (params) => api.get('/storage', { params }),

  // Get file metadata
  getFileById: (id) => api.get(`/storage/${id}`),

  // Download file
  downloadFile: (id) =>
    api.get(`/storage/download/${id}`, { responseType: 'blob' }),

  // Generate file URL for image src
  getFileUrl: (id) => id ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/storage/download/${id}` : null,

  // Delete file
  deleteFile: (id) => api.delete(`/storage/${id}`),

  // Query audit logs alias
  getAuditLogs: (params) => api.get('/audit/logs', { params }),
};

export const auditService = {
  // Create audit log entry
  createLog: (data) => api.post('/audit/log', data),

  // Query audit logs
  getLogs: (params) => api.get('/audit/logs', { params }),
};
