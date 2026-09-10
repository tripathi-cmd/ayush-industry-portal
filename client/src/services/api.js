import axios from 'axios';

// Default to same-origin /api so Vite proxy works in development and reverse-proxy works in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Include HttpOnly session cookies
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
  logout: async () => {
    const res = await api.post('/auth/logout');
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
  getMentorship: async () => {
    const res = await api.get('/student/mentorship');
    return res.data;
  },
  getLearningGoals: async (assignmentId) => {
    const res = await api.get(`/learning-goals/${assignmentId}`);
    return res.data;
  },
  updateGoalStatus: async (goalId, status) => {
    const res = await api.patch(`/learning-goals/${goalId}/status`, { status });
    return res.data;
  },
  getFeedback: async (assignmentId) => {
    const res = await api.get(`/mentor/feedback/${assignmentId}`);
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
  getAll: async () => {
    const res = await api.get('/assessments');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/assessments/${id}`);
    return res.data;
  },
  submit: async (id, answers) => {
    const res = await api.post(`/assessments/${id}/submit`, { answers });
    return res.data;
  },
  getMyAttempts: async () => {
    const res = await api.get('/assessments/attempts/me');
    return res.data;
  }
};

// Mentor API
export const mentorService = {
  getStudents: async () => {
    const res = await api.get('/mentor/students');
    return res.data;
  },
  addFeedback: async (assignmentId, feedback) => {
    const res = await api.post('/mentor/feedback', { assignmentId, feedback });
    return res.data;
  },
  getFeedback: async (assignmentId) => {
    const res = await api.get(`/mentor/feedback/${assignmentId}`);
    return res.data;
  },
  addLearningGoal: async (assignmentId, title, description) => {
    const res = await api.post('/mentor/learning-goals', { assignmentId, title, description });
    return res.data;
  },
  getLearningGoals: async (assignmentId) => {
    const res = await api.get(`/learning-goals/${assignmentId}`);
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
  getUsers: async (role) => {
    const res = await api.get('/admin/users', { params: role ? { role } : {} });
    return res.data;
  },
  updateUserApproval: async (id, approval) => {
    const res = await api.patch(`/admin/users/${id}/approval`, { approval });
    return res.data;
  },
  updateOpportunityStatus: async (id, status) => {
    const res = await api.patch(`/admin/opportunities/${id}/status`, { status });
    return res.data;
  },
  assignMentorship: async (mentorId, studentId) => {
    const res = await api.post('/admin/mentorship/assign', { mentorId, studentId });
    return res.data;
  },
  getMentorshipAssignments: async () => {
    const res = await api.get('/admin/mentorship');
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
