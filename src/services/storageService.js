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
