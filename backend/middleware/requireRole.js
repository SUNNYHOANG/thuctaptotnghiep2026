/**
 * Middleware phân quyền: chỉ admin hoặc giảng viên được phép
 * Đặt req.user = { role, id } từ JWT sau khi có auth thật
 * Hiện tại: đọc X-User-Role từ header (để dev/test) hoặc req.user từ auth middleware
 */
export const requireRole = (roles = ['admin', 'giangvien']) => {
  return (req, res, next) => {
    const user = req.user || {};
    const role = user.role || req.headers['x-user-role'] || '';
    if (!role) {
      return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập với tài khoản admin/giảng viên.' });
    }
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này.' });
    }
    req.userRole = role;
    next();
  };
};
