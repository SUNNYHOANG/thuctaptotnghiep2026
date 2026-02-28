import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const enrollmentAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
enrollmentAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const enrollmentAPIEndpoints = {
  // Register for a class section
  register: (data) => 
    enrollmentAPI.post('/enrollments/register', data),

  // Get student's enrollments
  getByStudent: (mssv, mahocky) => 
    enrollmentAPI.get(`/enrollments/student/${mssv}`, { params: { mahocky } }),

  // Get timetable for student in a semester
  getTimetable: (mssv, mahocky) => 
    enrollmentAPI.get(`/enrollments/student/${mssv}/timetable/${mahocky}`),

  // Cancel enrollment
  cancel: (madangky) => 
    enrollmentAPI.post(`/enrollments/${madangky}/cancel`),

  // Get enrollments for a class section
  getByClassSection: (malophoc) => 
    enrollmentAPI.get(`/enrollments/class-section/${malophoc}`),
};
