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
  // Gửi makhoa và role trong header để backend có thể phân quyền
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) config.headers['x-user-role'] = user.role;
      if (user.makhoa) config.headers['x-user-makhoa'] = user.makhoa;
      if (user.id) config.headers['x-user-id'] = user.id;
      if (user.username) config.headers['x-user-username'] = user.username;
      if (user.mssv) config.headers['x-user-mssv'] = user.mssv;
      if (user.magiaovien) config.headers['x-user-magiaovien'] = user.magiaovien;
    } catch {}
  }
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
  getApprovedByActivity: (mahoatdong) => api.get(`/student-activities/activity/${mahoatdong}/approved`),
  exportApprovedList: (mahoatdong) => api.get(`/student-activities/activity/${mahoatdong}/export`, { responseType: 'blob' }),
  closeActivity: (mahoatdong) => api.post(`/student-activities/activity/${mahoatdong}/close`),
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
  // Khoa duyệt/từ chối đơn GV
  khoaApprove: (id) => api.post(`/khen-thuong-ky-luat/${id}/khoa-approve`),
  khoaReject: (id, lydo) => api.post(`/khen-thuong-ky-luat/${id}/khoa-reject`, { lydo }),
  // CTSV duyệt/từ chối đơn Khoa
  approve: (id) => api.post(`/khen-thuong-ky-luat/${id}/approve`),
  reject: (id, lydo) => api.post(`/khen-thuong-ky-luat/${id}/reject`, { lydo }),
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
  getLopByKhoa: (makhoa) => api.get('/lookup/lop-by-khoa', { params: makhoa ? { makhoa } : {} }),
  getHocKy: () => api.get('/lookup/hocky'),
  getHocKyDangMo: () => api.get('/lookup/hocky-dangmo'),
  getGiangVien: () => api.get('/lookup/giangvien'),
  getKhoaList: () => api.get('/lookup/khoa-list'),
  getStudentByMssv: (mssv) => api.get(`/lookup/student/${mssv}`),
  getStudentsByClass: (malop) => api.get('/lookup/students-by-class', { params: { malop } }),
  getReportStats: (group) => api.get('/lookup/report-stats', { params: { group } }),
  getReportAdvanced: (mahocky) => api.get('/lookup/report-advanced', { params: { mahocky } }),
  getAdminStats: () => api.get('/lookup/admin-stats'),
};

// Phúc Khảo API
export const phucKhaoAPI = {
  getAll: (filters = {}) => api.get('/phuc-khao', { params: filters }),
  getByStudent: (mssv) => api.get(`/phuc-khao/student/${mssv}`),
  getMonHocList: () => api.get('/phuc-khao/monhoc-list'),
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
  // Nhắc nhở có mục tiêu
  sendReminder: (data) => api.post('/thongbao/reminder', data),
  getReminderHistory: (filters = {}) => api.get('/thongbao/reminder-history', { params: filters }),
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
    api.get(`/drl-self/class/${malop || '_all_'}/semester/${mahocky}`),
  review: (id, data) => api.put(`/drl-self/${id}/review`, data),
  manage: (filters = {}) => api.get('/drl-self/manage', { params: filters }),
  getKhoaList: () => api.get('/drl-self/manage/khoa-list'),
  getStudentsByStatus: (params) => api.get('/drl-self/students-by-status', { params }),
  parseExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/drl-self/parse-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: (params = {}) => api.get('/drl-self/export-excel', {
    params,
    responseType: 'blob',
  }),
};

// Quản lý Khoa (Admin CRUD)
export const khoaAPI = {
  getAll: () => api.get('/khoa'),
  create: (data) => api.post('/khoa', data),
  update: (makhoa, data) => api.put(`/khoa/${makhoa}`, data),
  delete: (makhoa) => api.delete(`/khoa/${makhoa}`),
};

// Quản lý Lớp (Admin CRUD)
export const lopAPI = {
  getAll: (makhoa) => api.get('/khoa/lop', { params: makhoa ? { makhoa } : {} }),
  create: (data) => api.post('/khoa/lop', data),
  update: (malop, data) => api.put(`/khoa/lop/${malop}`, data),
  delete: (malop) => api.delete(`/khoa/lop/${malop}`),
};

// Quản lý Học kỳ (Admin CRUD)
export const hocKyAPI = {
  getAll: () => api.get('/hocky'),
  create: (data) => api.post('/hocky', data),
  update: (mahocky, data) => api.put(`/hocky/${mahocky}`, data),
  updateTrangthai: (mahocky, trangthai) => api.patch(`/hocky/${mahocky}/trangthai`, { trangthai }),
  delete: (mahocky) => api.delete(`/hocky/${mahocky}`),
};

// Audit Log (Admin)
export const auditLogAPI = {
  getAll: (params = {}) => api.get('/audit-log', { params }),
  clear: (days) => api.delete('/audit-log/clear', { params: { days } }),
};

// Đơn trực tuyến (Sinh viên nộp, CTSV/Admin duyệt)
export const donOnlineAPI = {
  // Sinh viên
  getMyDon: () => api.get('/don-online/my'),
  create: (data) => api.post('/don-online', data),
  cancel: (id) => api.delete(`/don-online/${id}`),
  // CTSV / Admin
  getAll: (filters = {}) => api.get('/don-online', { params: filters }),
  getById: (id) => api.get(`/don-online/${id}`),
  approve: (id, data) => api.put(`/don-online/${id}/approve`, data),
  reject: (id, data) => api.put(`/don-online/${id}/reject`, data),
  exportCSV: (filters = {}) => api.get('/don-online/export', { params: filters, responseType: 'blob' }),
};

// Hồ sơ người dùng (Giảng viên, CTSV, Admin)
export const userProfileAPI = {
  getMe: () => api.get('/users/profile/me'),
  updateMe: (data) => api.put('/users/profile/me', data),
};

// Tiêu chí DRL (Admin cấu hình)
export const tieuChiDrlAPI = {
  getAll: () => api.get('/lookup/tieu-chi-drl'),
  update: (id, data) => api.put(`/tieu-chi-drl/${id}`, data),
  create: (data) => api.post('/tieu-chi-drl', data),
  delete: (id) => api.delete(`/tieu-chi-drl/${id}`),
};

// Tiêu chí chi tiết (con) của từng mục DRL
export const tieuChiChiTietAPI = {
  getByMuc: (matieuchi) => api.get('/tieu-chi-chitiet', { params: { matieuchi } }),
  getAllGrouped: () => api.get('/tieu-chi-chitiet/all-grouped'),
  create: (data) => api.post('/tieu-chi-chitiet', data),
  update: (id, data) => api.put(`/tieu-chi-chitiet/${id}`, data),
  delete: (id) => api.delete(`/tieu-chi-chitiet/${id}`),
};

// Grade API (nhập điểm, import Excel, khóa/mở khóa)
export const gradeAPI = {
  getByClass: (malophocphan) => api.get(`/grades/class/${malophocphan}`),
  getByStudent: (mssv, mahocky = null) => api.get(`/grades/student/${mssv}`, { params: mahocky ? { mahocky } : {} }),
  getById: (id) => api.get(`/grades/${id}`),
  getLog: (id) => api.get(`/grades/${id}/log`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/grades/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  lock: (malophocphan) => api.post(`/grades/lock/${malophocphan}`),
  unlock: (malophocphan) => api.post(`/grades/unlock/${malophocphan}`),
  getStats: (mahocky) => api.get(`/grades/stats/${mahocky}`),
  // Khoa read-only
  getByKhoa: (params = {}) => api.get('/grades/by-khoa', { params }),
  getLopHocPhanByKhoa: (params = {}) => api.get('/grades/lophocphan-by-khoa', { params }),
};

// Scholarship API (xét học bổng, duyệt, xuất Excel)
export const scholarshipAPI = {
  // Khoa: xét + duyệt bước 1
  evaluate: (mahocky) => api.post(`/scholarship/evaluate/${mahocky}`),
  getKhoaResults: (mahocky) => api.get(`/scholarship/khoa-results/${mahocky}`),
  khoaApprove: (id, data) => api.put(`/scholarship/khoa-approve/${id}`, data),
  // CTSV: xem + duyệt cuối
  getResults: (mahocky) => api.get(`/scholarship/results/${mahocky}`),
  approve: (id, data) => api.put(`/scholarship/approve/${id}`, data),
  // Sinh viên
  getMy: (mahocky) => mahocky
    ? api.get(`/scholarship/my/${mahocky}`)
    : api.get('/scholarship/my'),
  exportExcel: (mahocky) => api.get(`/scholarship/export/${mahocky}`, { responseType: 'blob' }),
};

export default api;
