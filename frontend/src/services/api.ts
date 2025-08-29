import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  verify: () =>
    api.get('/api/auth/verify'),
};

// Staff API methods
export const staffAPI = {
  getAll: (params?: { department?: string; page?: number; limit?: number }) =>
    api.get('/api/staff', { params }),
  
  getById: (id: number) =>
    api.get(`/api/staff/${id}`),
  
  create: (staff: { name: string; email: string; department: string; role: string; hire_date: string }) =>
    api.post('/api/staff', staff),
  
  update: (id: number, staff: { name: string; email: string; department: string; role: string }) =>
    api.put(`/api/staff/${id}`, staff),
  
  delete: (id: number) =>
    api.delete(`/api/staff/${id}`),
};

// Work Hours API methods
export const workHoursAPI = {
  create: (workHour: { staff_id: number; date: string; hours_worked: number; overtime_hours: number }) =>
    api.post('/api/work-hours', workHour),
  
  getByStaffId: (staffId: number, params?: { start_date?: string; end_date?: string }) =>
    api.get(`/api/work-hours/${staffId}`, { params }),
  
  update: (id: number, workHour: { hours_worked: number; overtime_hours: number }) =>
    api.put(`/api/work-hours/${id}`, workHour),
};

// Dashboard API methods
export const dashboardAPI = {
  getOverview: () =>
    api.get('/api/dashboard/overview'),
  
  getRiskDistribution: () =>
    api.get('/api/dashboard/risk-distribution'),
  
  getTopRiskStaff: (limit?: number) =>
    api.get('/api/dashboard/top-risk-staff', { params: { limit } }),
  
  getRiskTrends: (days?: number) =>
    api.get('/api/dashboard/risk-trends', { params: { days } }),
  
  getAlerts: (params?: { resolved?: string; limit?: number; offset?: number }) =>
    api.get('/api/dashboard/alerts', { params }),
};

// Risk Scores API methods
export const riskAPI = {
  getByStaffId: (staffId: number, params?: { days?: number }) =>
    api.get(`/api/risk-scores/${staffId}`, { params }),
};

// Alerts API methods
export const alertsAPI = {
  getAll: (params?: { resolved?: string; page?: number; limit?: number }) =>
    api.get('/api/alerts', { params }),
  
  getActive: () =>
    api.get('/api/alerts/active'),
  
  resolve: (id: number) =>
    api.put(`/api/alerts/${id}/resolve`),
  
  getStats: () =>
    api.get('/api/alerts/stats'),
};

export default api;