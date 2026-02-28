import axios from 'axios';

// Gọi trực tiếp backend (proxy có thể gây 404)
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authAPIEndpoints = {
  register: (data) => authAPI.post('/auth/register', data),
  login: (data) => authAPI.post('/auth/login', data),
  loginStaff: (data) => authAPI.post('/auth/login-staff', data),
  faceLogin: (identifier) => authAPI.post('/auth/face-login', { identifier }),
  logout: (refreshToken) => authAPI.post('/auth/logout', { refresh_token: refreshToken }),
  getCurrentUser: () => authAPI.get('/auth/me'),
  refreshToken: (refreshToken) => authAPI.post('/auth/token/refresh', { refresh: refreshToken }),
  getAdminDashboard: () => authAPI.get('/admin/dashboard'),
  getGiangVienDashboard: () => authAPI.get('/giangvien/dashboard'),
  getSinhVienDashboard: () => authAPI.get('/sinhvien/dashboard'),
};

export { authAPIEndpoints };
export default authAPIEndpoints;
