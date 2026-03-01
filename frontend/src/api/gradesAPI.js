import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const gradesAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
gradesAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const gradesAPIEndpoints = {
  // Lấy điểm của sinh viên
  getStudentGrades: (mssv, mahocky) => 
    gradesAPI.get(`/grades/student/${mssv}`, { params: { mahocky } }),

  // Lấy điểm theo lớp học phần
  getClassGrades: (malophocphan) => 
    gradesAPI.get(`/grades/class/${malophocphan}`),

  // Tạo bảng điểm từ danh sách đăng ký
  initGrades: (malophocphan) => 
    gradesAPI.post(`/grades/init/${malophocphan}`),

  // Nhập/cập nhật điểm
  createGrade: (data) => 
    gradesAPI.post('/grades', data),

  // Cập nhật điểm
  updateGrade: (mabangdiem, data) => 
    gradesAPI.put(`/grades/${mabangdiem}`, data),

  // Lấy log sửa điểm
  getGradeLog: (mabangdiem) => 
    gradesAPI.get(`/grades/${mabangdiem}/log`),

  // Khóa điểm
  lockGrades: (malophocphan, ngaykhoa) => 
    gradesAPI.post(`/grades/lock/${malophocphan}`, { ngaykhoa }),

  // Mở khóa điểm
  unlockGrades: (malophocphan) => 
    gradesAPI.post(`/grades/unlock/${malophocphan}`),

  // Xuất bảng điểm
  exportGrades: (malophocphan) => 
    gradesAPI.get(`/grades/export/${malophocphan}`),

  // Thống kê
  getStats: (mahocky) => 
    gradesAPI.get(`/grades/stats/${mahocky}`),
};

export default gradesAPIEndpoints;
