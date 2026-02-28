import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const classSectionAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
classSectionAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const classSectionAPIEndpoints = {
  // Get all class sections (optionally filtered)
  getAll: (filters = {}) => 
    classSectionAPI.get('/class-sections', { params: filters }),

  // Get class section by ID
  getById: (malophocphan) => 
    classSectionAPI.get(`/class-sections/${malophocphan}`),

  // Get class sections by teacher
  getByTeacher: (magiangvien) => 
    classSectionAPI.get(`/class-sections/teacher/${magiangvien}`),

  // Get class sections by semester
  getBySemester: (mahocky) => 
    classSectionAPI.get(`/class-sections/semester/${mahocky}`),

  // Create class section
  create: (data) => 
    classSectionAPI.post('/class-sections', data),

  // Update class section
  update: (malophocphan, data) => 
    classSectionAPI.put(`/class-sections/${malophocphan}`, data),

  // Delete class section
  delete: (malophocphan) => 
    classSectionAPI.delete(`/class-sections/${malophocphan}`),

  // Get enrolled students
  getStudents: (malophocphan) => 
    classSectionAPI.get(`/class-sections/${malophocphan}/students`),
};

export default classSectionAPIEndpoints;
