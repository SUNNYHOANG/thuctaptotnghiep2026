import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
    path: '/socket.io',
  });
  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    socket.on('join-student', (mssv) => {
      if (mssv) socket.join(`student:${mssv}`);
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

/** Gửi thông báo đến sinh viên (mssv) */
export function emitToStudent(mssv, event, data) {
  if (io) {
    io.to(`student:${mssv}`).emit(event, data);
  }
}

/** Gửi thông báo duyệt hoạt động */
export function emitActivityApproval(mssv, status, tenhoatdong) {
  emitToStudent(mssv, 'activity_approval', {
    mssv,
    status, // 'duocduyet' | 'tuchoi'
    tenhoatdong,
    message:
      status === 'duocduyet'
        ? `Đăng ký tham gia "${tenhoatdong}" đã được duyệt.`
        : `Đăng ký tham gia "${tenhoatdong}" bị từ chối.`,
  });
}

/** Gửi thông báo điểm DRL đã nhập */
export function emitDrlScore(mssv, diemtong, xeploai) {
  emitToStudent(mssv, 'drl_score', {
    mssv,
    diemtong,
    xeploai,
    message: `Điểm rèn luyện đã được cập nhật: ${diemtong} - Xếp loại: ${xeploai || '—'}`,
  });
}

/** Gửi thông báo khen thưởng / kỷ luật */
export function emitRewardDiscipline(mssv, loai, noidung) {
  const isReward = loai === 'khenthuong';
  const isWarning = loai === 'canhcao';

  const title = isReward ? 'Khen thưởng' : isWarning ? 'Cảnh cáo' : 'Kỷ luật';

  emitToStudent(mssv, 'reward_discipline', {
    mssv,
    loai,
    noidung,
    message: `${title}: ${noidung}`,
  });
}
