import axios from 'axios';

// Default to the Vite dev proxy to avoid CORS issues during local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on expired / invalid token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  signup: async (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    phone: string;
  }) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  confirmEmail: async (data: { email: string; otp: string }) => {
    const response = await api.patch('/auth/confirm-email', data);
    return response.data;
  },

  resendEmailOtp: async (data: { email: string }) => {
    const response = await api.post('/auth/resend-email-otp', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout', { flag: 'logout' });
    return response.data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.get('/auth/refresh-token', {
      headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : undefined,
    });
    return response.data;
  },

  forgetPassword: async (data: { email: string }) => {
    const response = await api.patch('/auth/forget-password', data);
    return response.data;
  },

  resetPassword: async (data: { email: string; otp: string; password: string }) => {
    const response = await api.patch('/auth/reset-password', data);
    return response.data;
  },

  resendForgotPasswordOtp: async (data: { email: string }) => {
    const response = await api.post('/auth/resend-forgot-password-otp', data);
    return response.data;
  },
};

export const gaitAPI = {
  uploadVideo: async (
    data: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ) => {
    const response = await api.post('/gait/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 5 * 60 * 1000, // 5 min — waits for AI model to extract feature vector
    });
    return response.data;
  },

  listProfiles: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/gait', { params });
    return response.data;
  },

  getProfile: async (profileId: string) => {
    const response = await api.get(`/gait/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, data: { description?: string }) => {
    const response = await api.patch(`/gait/${profileId}`, data);
    return response.data;
  },

  deleteProfile: async (profileId: string) => {
    const response = await api.delete(`/gait/${profileId}`);
    return response.data;
  },
};

export const analysisAPI = {
  runAnalysis: async (data: { gait_profile_id: string }) => {
    const response = await api.post('/analysis/run', data);
    return response.data;
  },

  listHistory: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/analysis', { params });
    return response.data;
  },

  getResult: async (analysisId: string) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  },

  getProfileHistory: async (profileId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/analysis/profile/${profileId}/history`, { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/analysis/stats/summary');
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getAccuracyChart: async () => {
    const response = await api.get('/dashboard/accuracy-chart');
    return response.data;
  },

  getSystemStatus: async () => {
    const response = await api.get('/dashboard/system-status');
    return response.data;
  },

  getRecentUploads: async () => {
    const response = await api.get('/dashboard/recent-uploads');
    return response.data;
  },
};

export const reportsAPI = {
  getSummary: async (params?: { from?: string; to?: string }) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },

  getAccuracyByCondition: async (params?: { from?: string; to?: string }) => {
    const response = await api.get('/reports/accuracy-by-condition', { params });
    return response.data;
  },

  getDatasetDistribution: async (params?: { from?: string; to?: string }) => {
    const response = await api.get('/reports/dataset-distribution', { params });
    return response.data;
  },

  exportReports: async (params?: { from?: string; to?: string }) => {
    const response = await api.get('/reports/export', { params });
    return response.data;
  },
};

export const settingsAPI = {
  getProfile: async () => {
    const response = await api.get('/settings/profile');
    return response.data;
  },

  updateProfile: async (data: { fullName?: string; institution?: string }) => {
    const response = await api.patch('/settings/profile', data);
    return response.data;
  },

  getModel: async () => {
    const response = await api.get('/settings/model');
    return response.data;
  },

  updateModel: async (data: { similarityThreshold: number; frameSamplingRate: number }) => {
    const response = await api.patch('/settings/model', data);
    return response.data;
  },
};

// ─── Admin API (Admin-only endpoints) ───────────────────────────────
export const adminAPI = {
  getAllUsers: async () => {
    const response = await api.get('/user/all');
    return response.data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await api.patch(`/user/${userId}/role`, { role });
    return response.data;
  },

  toggleFreezeUser: async (userId: string) => {
    const response = await api.patch(`/user/${userId}/freeze`);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/user/${userId}`);
    return response.data;
  },
};

export const predictAPI = {
  /**
   * Send a file (image or video) to the backend to be forwarded to the Hugging Face AI Space.
   * @param formData FormData containing a 'file' field.
   * @param onUploadProgress Optional progress callback.
   */
  getPrediction: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ) => {
    const response = await api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 5 * 60 * 1000, // 5 minutes — HF Space can be slow to wake
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Register an unknown gait signature detected during prediction.
   * Stores the person name linked to the extracted feature vector in the database.
   * @param personName  Human-readable name for the new person.
   * @param featureVector  The raw feature vector returned by the AI model.
   */
  registerUnknownGait: async (personName: string, featureVector: number[]) => {
    const response = await api.post('/predict/register', {
      person_name: personName,
      feature_vector: featureVector,
    });
    return response.data;
  },
};

// Test API connection

export const testAPI = {
  healthCheck: async () => {
    const response = await axios.get(`${SERVER_BASE_URL}/`);
    return response.data;
  },
};

export default api;
