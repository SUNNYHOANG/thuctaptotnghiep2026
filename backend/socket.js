import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
  const allowedOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? true : 'http://localhost:5173');

  io = new Server(httpServer, {
    cors: { origin: allowedOrigin },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // SV join room cá nhân
    socket.on('join-student', (mssv) => {
      if (mssv) {
        socket.join(`student:${mssv}`);
        console.log(`[Socket] ${socket.id} joined student:${mssv}`);
      }
    });

    // Tất cả role join room theo role
    socket.on('join-role', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        console.log(`[Socket] ${socket.id} joined role:${role}`);
      }
    });

    // Join room theo khoa (cho role khoa/giangvien)
    socket.on('join-khoa', (makhoa) => {
      if (makhoa) {
        socket.join(`khoa:${makhoa}`);
        console.log(`[Socket] ${socket.id} joined khoa:${makhoa}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

// ── Helpers gửi event ────────────────────────────────────────────

/** Gửi đến sinh viên cụ thể */
export function emitToStudent(mssv, event, data) {
  if (io) io.to(`student:${mssv}`).emit(event, data);
}

/** Gửi đến tất cả client có role cụ thể */
export function emitToRole(role, event, data) {
  if (io) io.to(`role:${role}`).emit(event, data);
}

/** Gửi đến tất cả client trong khoa */
export function emitToKhoa(makhoa, event, data) {
  if (io) io.to(`khoa:${makhoa}`).emit(event, data);
}

/** Gửi đến tất cả client đang kết nối */
export function emitToAll(event, data) {
  if (io) io.emit(event, data);
}

// ── Domain events ────────────────────────────────────────────────

/** DRL: SV gửi phiếu → thông báo CVHT/Khoa/CTSV */
export function emitDrlSubmitted(mssv, malop, makhoa) {
  emitToRole('giangvien', 'drl:submitted', { mssv, malop, makhoa });
  emitToRole('ctsv', 'drl:submitted', { mssv, malop, makhoa });
  if (makhoa) emitToKhoa(makhoa, 'drl:submitted', { mssv, malop, makhoa });
}

/** DRL: CVHT/Khoa/CTSV duyệt → thông báo SV */
export function emitDrlReviewed(mssv, trangthai, diem, nhanXet) {
  emitToStudent(mssv, 'drl:reviewed', {
    mssv, trangthai, diem, nhanXet,
    message: trangthai === 'daduyet'
      ? `Phiếu DRL của bạn đã được duyệt. Điểm: ${diem ?? '—'}`
      : trangthai === 'bituchoi'
        ? `Phiếu DRL của bạn bị từ chối. Lý do: ${nhanXet || '—'}`
        : `Phiếu DRL của bạn đã được cập nhật trạng thái: ${trangthai}`,
  });
}

/** DRL: điểm chính thức được chốt */
export function emitDrlScore(mssv, diemtong, xeploai) {
  emitToStudent(mssv, 'drl_score', {
    mssv, diemtong, xeploai,
    message: `Điểm rèn luyện đã được cập nhật: ${diemtong} - Xếp loại: ${xeploai || '—'}`,
  });
}

/** Thông báo mới được tạo → broadcast tất cả */
export function emitThongBaoMoi(thongBao) {
  emitToAll('thongbao:new', thongBao);
}

/** Dịch vụ: cập nhật trạng thái → thông báo SV */
export function emitDichVuStatus(mssv, id, trangthai, tenDichVu) {
  const labels = { duyet: 'đã được duyệt', tuchoi: 'bị từ chối', dangxuly: 'đang được xử lý' };
  emitToStudent(mssv, 'dichvu:status', {
    id, trangthai, tenDichVu,
    message: `Yêu cầu dịch vụ "${tenDichVu}" ${labels[trangthai] || trangthai}.`,
  });
}

/** Phúc khảo: cập nhật trạng thái → thông báo SV */
export function emitPhucKhaoStatus(mssv, id, trangthai, tenMonHoc) {
  const labels = { duyet: 'đã được duyệt', tuchoi: 'bị từ chối', dangxuly: 'đang xử lý' };
  emitToStudent(mssv, 'phuckhao:status', {
    id, trangthai, tenMonHoc,
    message: `Đơn phúc khảo môn "${tenMonHoc}" ${labels[trangthai] || trangthai}.`,
  });
}

/** Khen thưởng / kỷ luật */
export function emitRewardDiscipline(mssv, loai, noidung) {
  const title = loai === 'khenthuong' ? 'Khen thưởng' : loai === 'canhcao' ? 'Cảnh cáo' : 'Kỷ luật';
  emitToStudent(mssv, 'reward_discipline', { mssv, loai, noidung, message: `${title}: ${noidung}` });
}

/** Hoạt động: duyệt đăng ký */
export function emitActivityApproval(mssv, status, tenhoatdong) {
  emitToStudent(mssv, 'activity_approval', {
    mssv, status, tenhoatdong,
    message: status === 'duocduyet'
      ? `Đăng ký tham gia "${tenhoatdong}" đã được duyệt.`
      : `Đăng ký tham gia "${tenhoatdong}" bị từ chối.`,
  });
}

/** Đơn trực tuyến: cập nhật trạng thái */
export function emitDonOnlineStatus(mssv, id, trangthai, loaiDon) {
  const labels = { duyet: 'đã được duyệt', tuchoi: 'bị từ chối', dangxuly: 'đang xử lý' };
  emitToStudent(mssv, 'don-online:status', {
    id, trangthai, loaiDon,
    message: `Đơn "${loaiDon}" ${labels[trangthai] || trangthai}.`,
  });
}

/** Học kỳ: admin thay đổi trạng thái → broadcast tất cả để reload danh sách */
export function emitHocKyUpdated(hocky) {
  emitToAll('hocky:updated', hocky);
}
