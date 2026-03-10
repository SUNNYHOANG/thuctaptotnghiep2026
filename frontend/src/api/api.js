import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Activities API
export const activitiesAPI = {
  getAll: (filters = {}) => api.get('/activities', { params: filters }),
  getById: (id) => api.get(`/activities/${id}`),
  getTypes: () => api.get('/activities/types'),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
};

// Student Activities API
export const studentActivitiesAPI = {
  register: (data) => api.post('/student-activities/register', data),
  getByStudent: (mssv) => api.get(`/student-activities/student/${mssv}`),
  getByActivity: (mahoatdong) => api.get(`/student-activities/activity/${mahoatdong}`),
  getPendingForCTSV: () => api.get('/student-activities/ctsv/pending'),
  exportApprovedList: (mahoatdong) => api.get(`/student-activities/activity/${mahoatdong}/export`, { responseType: 'blob' }),
  approve: (id, data) => api.post(`/student-activities/${id}/approve`, data),
  reject: (id, data) => api.post(`/student-activities/${id}/reject`, data),
  complete: (id, data) => api.post(`/student-activities/${id}/complete`, data),
  cancel: (id) => api.delete(`/student-activities/${id}`),
};

// Scores API
export const scoresAPI = {
  calculate: (data) => api.post('/scores/calculate', data),
  getByStudentAndSemester: (mssv, mahocky) => 
    api.get(`/scores/student/${mssv}/semester/${mahocky}`),
  getByStudent: (mssv) => api.get(`/scores/student/${mssv}`),
  getBySemester: (mahocky) => api.get(`/scores/semester/${mahocky}`),
  update: (data) => api.put('/scores/update', data),
};

// Khen Thưởng/Kỷ Luật API
export const khenThuongKyLuatAPI = {
  getAll: (filters = {}) => api.get('/khen-thuong-ky-luat', { params: filters }),
  getByStudent: (mssv, mahocky = null) => 
    api.get(`/khen-thuong-ky-luat/student/${mssv}`, { params: { mahocky } }),
  getById: (id) => api.get(`/khen-thuong-ky-luat/${id}`),
  create: (data) => api.post('/khen-thuong-ky-luat', data),
  update: (id, data) => api.put(`/khen-thuong-ky-luat/${id}`, data),
  delete: (id) => api.delete(`/khen-thuong-ky-luat/${id}`),
};

// Dịch Vụ API
export const dichVuAPI = {
  getLoai: () => api.get('/dich-vu/loai'),
  getAll: (filters = {}) => api.get('/dich-vu', { params: filters }),
  getByStudent: (mssv) => api.get(`/dich-vu/student/${mssv}`),
  getById: (id) => api.get(`/dich-vu/${id}`),
  create: (data) => api.post('/dich-vu', data),
  update: (id, data) => api.put(`/dich-vu/${id}`, data),
  delete: (id) => api.delete(`/dich-vu/${id}`),
  updateStatus: (id, data) => api.put(`/dich-vu/${id}/status`, data),
};

// Học Bổng API
export const hocBongAPI = {
  getAll: (mahocky = null) => api.get('/hoc-bong', { params: { mahocky } }),
  getById: (id) => api.get(`/hoc-bong/${id}`),
  getRecipients: (id) => api.get(`/hoc-bong/${id}/recipients`),
  getStudentHistory: (mssv) => api.get(`/hoc-bong/student/${mssv}/history`),
  getStudents: (id) => api.get(`/hoc-bong/${id}/students`),
  create: (data) => api.post('/hoc-bong', data),
  update: (id, data) => api.put(`/hoc-bong/${id}`, data),
  addStudent: (id, data) => api.post(`/hoc-bong/${id}/students`, data),
  removeStudent: (id, mssv) => api.delete(`/hoc-bong/${id}/students/${mssv}`),
};

// Hồ sơ sinh viên (xem/sửa)
export const studentProfileAPI = {
  get: (mssv) => api.get(`/users/students/profile/${mssv}`),
  update: (mssv, data) => api.put(`/users/students/profile/${mssv}`, data),
};

// Lookup: tiêu chí DRL, lớp, SV theo lớp, báo cáo
export const lookupAPI = {
  getTieuChiDRL: () => api.get('/lookup/tieu-chi-drl'),
  getLop: () => api.get('/lookup/lop'),
  getHocKy: () => api.get('/lookup/hocky'),
  getGiangVien: () => api.get('/lookup/giangvien'),
  getStudentByMssv: (mssv) => api.get(`/lookup/student/${mssv}`),
  getStudentsByClass: (malop) => api.get('/lookup/students-by-class', { params: { malop } }),
  getReportStats: (group) => api.get('/lookup/report-stats', { params: { group } }),
  getReportAdvanced: (mahocky) => api.get('/lookup/report-advanced', { params: { mahocky } }),
  getAdminStats: () => api.get('/lookup/admin-stats'),
};

// Phúc Khảo API
export const phucKhaoAPI = {
  getAll: (filters = {}) =>
    api.get('/phuc-khao', { params: filters }),
  getByStudent: (mssv) => api.get(`/phuc-khao/student/${mssv}`),
  getByClassSection: (malophocphan) => api.get(`/phuc-khao/class-section/${malophocphan}`),
  getById: (id) => api.get(`/phuc-khao/${id}`),
  create: (data) => api.post('/phuc-khao', data),
  update: (id, data) => api.put(`/phuc-khao/${id}`, data),
  delete: (id) => api.delete(`/phuc-khao/${id}`),
  updateStatus: (id, data) => api.put(`/phuc-khao/${id}/status`, data),
};

// Thông Báo API
export const thongBaoAPI = {
  getAll: (filters = {}) => api.get('/thong-bao', { params: filters }),
  getById: (id) => api.get(`/thong-bao/${id}`),
  create: (data) => api.post('/thong-bao', data),
  update: (id, data) => api.put(`/thong-bao/${id}`, data),
  delete: (id) => api.delete(`/thong-bao/${id}`),
};

// Score (Điểm Rèn Luyện) API
export const scoreAPI = {
  calculate: (data) => api.post('/scores/calculate', data),
  getByStudentAndSemester: (mssv, mahocky) => 
    api.get(`/scores/student/${mssv}/semester/${mahocky}`),
  getByStudent: (mssv) => api.get(`/scores/student/${mssv}`),
  getBySemester: (mahocky) => api.get(`/scores/semester/${mahocky}`),
  update: (data) => api.put('/scores/update', data),
};

// NRL Tracker API (tra cứu ngày rèn luyện từ file JSON)
export const nrlAPI = {
  search: (query) => api.get('/nrl/search', { params: { q: query } }),
};

// Tự đánh giá điểm rèn luyện (Sinh viên & CVHT)
export const drlSelfAPI = {
  submit: (data) => api.post('/drl-self', data),
  getByStudent: (mssv) => api.get(`/drl-self/student/${mssv}`),
  getByStudentAndSemester: (mssv, mahocky) =>
    api.get(`/drl-self/student/${mssv}/semester/${mahocky}`),
  getByClassAndSemester: (malop, mahocky) =>
    api.get(`/drl-self/class/${malop}/semester/${mahocky}`),
  review: (id, data) => api.put(`/drl-self/${id}/review`, data),
};

export default api;
