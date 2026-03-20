/**
 * Middleware phân quyền: kiểm tra role của người dùng
 * Đặt req.user = { role, id, makhoa } từ JWT sau khi có auth thật
 * Hiện tại: đọc X-User-Role từ header (để dev/test) hoặc req.user từ auth middleware
 */
export const requireRole = (roles = ['admin', 'giangvien']) => {
  return (req, res, next) => {
    const user = req.user || {};
    const role = user.role || req.headers['x-user-role'] || '';
    const makhoa = user.makhoa || req.headers['x-user-makhoa'] || null;

    if (!role) {
      return res.status(401).json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập với tài khoản hợp lệ.' });
    }
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này.' });
    }
    req.userRole = role;
    // Expose makhoa vào req.user để các route handler sử dụng
    if (!req.user) req.user = {};
    req.user.role = role;
    req.user.makhoa = makhoa;
    next();
  };
};
