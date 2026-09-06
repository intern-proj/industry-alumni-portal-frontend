import api, { getApiBaseUrl } from '../lib/api';

/**
 * Resolves a file ID or existing URL to a fully-qualified dynamic download URL.
 * Automatically rewrites legacy localhost:8080 URLs stored in the database to the active API base URL.
 */
export const resolveFileUrl = (idOrUrl, inline = true) => {
  if (!idOrUrl) return null;
  const str = String(idOrUrl).trim();
  if (!str || str === '#') return null;

  // Blob or Data URLs (client previews)
  if (str.startsWith('blob:') || str.startsWith('data:')) {
    return str;
  }

  // If it's a storage download URL (including legacy localhost:8080 or relative path)
  if (str.includes('/storage/download/')) {
    const fileIdMatch = str.match(/\/storage\/download\/([^?&#]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      const hasInline = str.includes('inline=true') || inline;
      return `${getApiBaseUrl()}/storage/download/${fileId}${hasInline ? '?inline=true' : ''}`;
    }
  }

  // If it's a UUID or simple file ID (no slashes, typical storage ID)
  if (!str.includes('/') && /^[0-9a-fA-F-]{10,}$/.test(str)) {
    return `${getApiBaseUrl()}/storage/download/${str}${inline ? '?inline=true' : ''}`;
  }

  // If it's already an external absolute URL (e.g. ui-avatars.com, randomuser.me, s3)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If it contains localhost:8080 anywhere, replace it with active api base url
    if (str.includes('localhost:8080/api/v1')) {
      return str.replace('http://localhost:8080/api/v1', getApiBaseUrl());
    }
    return str;
  }

  // If it's a relative path starting with /api/v1
  if (str.startsWith('/api/v1')) {
    const prefix = getApiBaseUrl().replace(/\/api\/v1$/, '');
    return `${prefix}${str}`;
  }

  // Fallback as file ID
  return `${getApiBaseUrl()}/storage/download/${str}${inline ? '?inline=true' : ''}`;
};

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

  // Generate file URL for image src or inline display
  getFileUrl: (idOrUrl) => resolveFileUrl(idOrUrl, true),

  // Generate download URL for anchor tags or preview
  getFileDownloadUrl: (idOrUrl, inline = false) => resolveFileUrl(idOrUrl, inline),

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
