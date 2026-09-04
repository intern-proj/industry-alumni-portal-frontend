import api from '../lib/api';

const BASE_URL = '/banners';

export const bannerService = {
  // Public endpoint
  getActiveBanners: async () => {
    const response = await api.get(`${BASE_URL}/active`);
    return response.data;
  },

  // Admin endpoints
  getAllBanners: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  createBanner: async (bannerData) => {
    const response = await api.post(BASE_URL, bannerData);
    return response.data;
  },

  updateBanner: async (id, bannerData) => {
    const response = await api.put(`${BASE_URL}/${id}`, bannerData);
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }
};

export default bannerService;
