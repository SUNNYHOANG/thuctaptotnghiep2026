/**
 * Đặt req.user từ Authorization header hoặc X-User-Role
 * Token format: "staff-{id}-{role}" (ví dụ: staff-1-admin)
 * Hoặc header X-User-Role: admin|giangvien, X-User-Id: 1
 */
export const parseUser = (req, res, next) => {
  const auth = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'];
  const idHeader = req.headers['x-user-id'];
  const makhoaHeader = req.headers['x-user-makhoa'];
  const usernameHeader = req.headers['x-user-username'];

  if (roleHeader) {
    req.user = {
      role: roleHeader,
      id: idHeader || null,
      username: usernameHeader || idHeader || roleHeader,
      makhoa: makhoaHeader || null,
      mssv: req.headers['x-user-mssv'] || null,
    };
    return next();
  }

  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const parts = token.split('-');
    if (parts[0] === 'staff' && parts.length >= 3) {
      req.user = {
        id: parts[1],
        username: usernameHeader || parts[1],
        role: parts[2],
        makhoa: makhoaHeader || null,
      };
    } else if (parts[0] === 'logged-in') {
      req.user = { mssv: parts.slice(1).join('-'), role: 'sinhvien', makhoa: null };
    }
  }

  next();
};
