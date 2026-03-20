const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // Gửi makhoa và role trong header để backend phân quyền
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) headers['x-user-role'] = user.role;
      if (user.makhoa) headers['x-user-makhoa'] = user.makhoa;
    } catch {}
  }
  return headers;
}

export const adminAPIEndpoints = {
  // Users
  getUsers: (filters = {}) => fetch(`${API_BASE}/users?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getUserById: (id) => fetch(`${API_BASE}/users/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createUser: (data) => fetch(`${API_BASE}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateUser: (id, data) => fetch(`${API_BASE}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteUser: (id) => fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Courses
  getCourses: (filters = {}) => fetch(`${API_BASE}/courses?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getCourseById: (id) => fetch(`${API_BASE}/courses/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getAvailableCoursesForRegistration: (mahocky) => fetch(`${API_BASE}/courses/available-for-registration/${mahocky}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getCurrentRegistrationSemester: () => fetch(`${API_BASE}/courses/current-registration-semester`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  setCurrentRegistrationSemester: (mahocky) => fetch(`${API_BASE}/courses/set-current-registration-semester`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ mahocky }) }).then(r => r.json()),
  createCourse: (data) => fetch(`${API_BASE}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateCourse: (id, data) => fetch(`${API_BASE}/courses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteCourse: (id) => fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Activities
  getActivities: (filters = {}) => fetch(`${API_BASE}/activities?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getActivityById: (id) => fetch(`${API_BASE}/activities/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createActivity: (data) => fetch(`${API_BASE}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateActivity: (id, data) => fetch(`${API_BASE}/activities/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteActivity: (id) => fetch(`${API_BASE}/activities/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Scores (Điểm rèn luyện)
  getScores: (filters = {}) => fetch(`${API_BASE}/scores?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getScoreById: (id) => fetch(`${API_BASE}/scores/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createScore: (data) => fetch(`${API_BASE}/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateScore: (id, data) => fetch(`${API_BASE}/scores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteScore: (id) => fetch(`${API_BASE}/scores/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Scholarships (Học bổng)
  getScholarships: (filters = {}) => fetch(`${API_BASE}/hoc-bong?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getScholarshipById: (id) => fetch(`${API_BASE}/hoc-bong/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createScholarship: (data) => fetch(`${API_BASE}/hoc-bong`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateScholarship: (id, data) => fetch(`${API_BASE}/hoc-bong/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteScholarship: (id) => fetch(`${API_BASE}/hoc-bong/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Rewards (Khen thưởng & Kỷ luật)
  getRewards: (filters = {}) => fetch(`${API_BASE}/khen-thuong-ky-luat?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getRewardById: (id) => fetch(`${API_BASE}/khen-thuong-ky-luat/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createReward: (data) => fetch(`${API_BASE}/khen-thuong-ky-luat`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateReward: (id, data) => fetch(`${API_BASE}/khen-thuong-ky-luat/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteReward: (id) => fetch(`${API_BASE}/khen-thuong-ky-luat/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Students (danh sách sinh viên)
  getAllStudents: () =>
    fetch(`${API_BASE}/users/students/all`, { headers: { ...getAuthHeaders() } }).then((r) => r.json()),

  // Services (Dịch vụ)
  getServices: (filters = {}) => fetch(`${API_BASE}/dich-vu?${new URLSearchParams(filters)}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  getServiceById: (id) => fetch(`${API_BASE}/dich-vu/${id}`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
  createService: (data) => fetch(`${API_BASE}/dich-vu`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  updateService: (id, data) => fetch(`${API_BASE}/dich-vu/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteService: (id) => fetch(`${API_BASE}/dich-vu/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } }).then(r => r.json()),

  // Dashboard Stats
  getStats: () => fetch(`${API_BASE}/lookup/admin-stats`, { headers: { ...getAuthHeaders() } }).then(r => r.json()),
};

export { API_BASE, getAuthHeaders };
