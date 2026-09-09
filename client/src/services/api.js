import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ayush_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

// Student API
export const studentService = {
  updateProfile: async (profileData) => {
    const res = await api.put('/students/profile', profileData);
    return res.data;
  },
  getRecommendations: async () => {
    const res = await api.get('/students/recommendations');
    return res.data;
  },
  uploadDocument: async (docData) => {
    const res = await api.post('/students/upload-document', docData);
    return res.data;
  }
};

// Opportunities API
export const opportunityService = {
  getAll: async (params) => {
    const res = await api.get('/opportunities', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/opportunities/${id}`);
    return res.data;
  },
  create: async (oppData) => {
    const res = await api.post('/opportunities', oppData);
    return res.data;
  }
};

// Applications API
export const applicationService = {
  getAll: async () => {
    const res = await api.get('/applications');
    return res.data;
  },
  apply: async (opportunityId) => {
    const res = await api.post('/applications', { opportunityId });
    return res.data;
  },
  updateStatus: async (id, payload) => {
    const res = await api.patch(`/applications/${id}/status`, payload);
    return res.data;
  }
};

// Assessments API
export const assessmentService = {
  getAll: async (stream) => {
    const res = await api.get('/assessments', { params: { stream } });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/assessments/${id}`);
    return res.data;
  },
  submit: async (id, answers) => {
    const res = await api.post(`/assessments/${id}/submit`, { answers });
    return res.data;
  }
};

// Admin API
export const adminService = {
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res.data;
  },
  getPending: async () => {
    const res = await api.get('/admin/pending');
    return res.data;
  },
  verifyPartner: async (id, status) => {
    const res = await api.post(`/admin/verify-partner/${id}`, { status });
    return res.data;
  },
  approveOpportunity: async (id, status) => {
    const res = await api.post(`/admin/approve-opportunity/${id}`, { status });
    return res.data;
  }
};

// Notifications API
export const notificationService = {
  getAll: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  }
};

// Taxonomy API
export const getTaxonomy = async () => {
  const res = await api.get('/taxonomy');
  return res.data;
};

export default api;
