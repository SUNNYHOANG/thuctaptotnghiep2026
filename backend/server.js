import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { initSocket } from './socket.js';
import activityRoutes from './routes/activityRoutes.js';
import studentActivityRoutes from './routes/studentActivityRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import classSectionRoutes from './routes/classSectionRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import lookupRoutes from './routes/lookupRoutes.js';
import gradesRoutes from './routes/gradesRoutes.js';
import phucKhaoRoutes from './routes/phucKhaoRoutes.js';
import khenThuongKyLuatRoutes from './routes/khenThuongKyLuatRoutes.js';
import hocBongRoutes from './routes/hocBongRoutes.js';
import dichVuRoutes from './routes/dichVuRoutes.js';
import thongBaoRoutes from './routes/thongBaoRoutes.js';
import drlSelfRoutes from './routes/drlSelfRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import nrlRoutes from './routes/nrlRoutes.js';
import { parseUser } from './middleware/parseUser.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(parseUser);

// Face login - đặt TRƯỚC auth router để đảm bảo match
app.post('/api/auth/face-login', async (req, res) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier) {
      return res.status(400).json({ error: 'Thiếu identifier (mssv hoặc username)' });
    }
    const [svRows] = await pool.execute(
      'SELECT mssv, hoten, malop, makhoa FROM sinhvien WHERE mssv = ?',
      [identifier]
    );
    if (svRows.length > 0) {
      const user = { ...svRows[0], role: 'sinhvien' };
      return res.json({
        user,
        message: 'Đăng nhập khuôn mặt (sinh viên) thành công',
        access_token: 'logged-in-' + svRows[0].mssv,
      });
    }
    let staffRows = [];
    try {
    const [rows] = await pool.execute(
      'SELECT id, username, hoten, role, magiaovien, status FROM users WHERE username = ? AND status = ?',
      [identifier, 'active']
    );
      staffRows = rows;
    } catch (error) {
      // Một số schema cũ không có cột `status`
      if (error && error.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await pool.execute(
          'SELECT id, username, hoten, role, magiaovien FROM users WHERE username = ?',
          [identifier]
        );
        staffRows = rows;
      } else {
        throw error;
      }
    }
    if (staffRows.length > 0) {
      const user = { ...staffRows[0], role: staffRows[0].role };
      return res.json({
        user,
        message: 'Đăng nhập khuôn mặt (staff) thành công',
        access_token: 'staff-' + staffRows[0].id + '-' + staffRows[0].role,
      });
    }
    return res.status(404).json({ error: 'Không tìm thấy người dùng tương ứng với khuôn mặt này' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/student-activities', studentActivityRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/class-sections', classSectionRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/phuc-khao', phucKhaoRoutes);
app.use('/api/khen-thuong-ky-luat', khenThuongKyLuatRoutes);
app.use('/api/hoc-bong', hocBongRoutes);
app.use('/api/dich-vu', dichVuRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/drl-self', drlSelfRoutes);
app.use('/api/nrl', nrlRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler - log để debug
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
