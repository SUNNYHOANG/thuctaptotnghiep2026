import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DichVu from '../models/DichVu.js';
import { requireRole } from '../middleware/requireRole.js';
import { emitDichVuStatus } from '../socket.js';

const router = express.Router();

// Cấu hình multer lưu file vào uploads/dichvu/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/dichvu';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `dichvu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file: PDF, Word, Excel, ảnh JPG/PNG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Lấy danh sách loại dịch vụ
router.get('/loai', async (req, res) => {
  try {
    const rows = await DichVu.getLoaiDichVu();
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên: tạo đơn (có thể kèm file)
router.post('/', upload.single('file_dinh_kem'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.file_dinh_kem = req.file.filename;
    }
    const row = await DichVu.create(data);
    res.status(201).json(row);
  } catch (err) {
    // Xóa file nếu lưu DB lỗi
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ error: err.message });
  }
});

// Admin/CTSV: danh sách tất cả đơn
router.get('/', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const rows = await DichVu.getAll(req.query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sinh viên: xem đơn của mình
router.get('/student/:mssv', async (req, res) => {
  try {
    const rows = await DichVu.getByStudent(req.params.mssv);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tải file đính kèm
router.get('/file/:filename', (req, res) => {
  const filePath = path.resolve('uploads/dichvu', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File không tồn tại' });
  }
  res.download(filePath);
});

// Chi tiết đơn
router.get('/:id', async (req, res) => {
  try {
    const row = await DichVu.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/CTSV: duyệt/từ chối đơn
router.put('/:id/status', requireRole(['admin', 'ctsv']), async (req, res) => {
  try {
    const { trangthai, ketqua, file_ketqua } = req.body;
    const row = await DichVu.updateStatus(
      req.params.id,
      trangthai,
      ketqua,
      req.user?.id || req.headers['x-user-id'],
      file_ketqua
    );
    // Emit realtime cho SV
    if (row?.mssv) emitDichVuStatus(row.mssv, row.id, trangthai, row.loai_dich_vu || row.ten_dich_vu || 'Dịch vụ');
    res.json(row);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: sửa đơn (có thể thay file)
router.put('/:id', upload.single('file_dinh_kem'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      // Xóa file cũ nếu có
      const old = await DichVu.getById(req.params.id);
      if (old?.file_dinh_kem) {
        const oldPath = path.resolve('uploads/dichvu', old.file_dinh_kem);
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
      }
      data.file_dinh_kem = req.file.filename;
    }
    const row = await DichVu.update(req.params.id, data);
    res.json(row);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ error: err.message });
  }
});

// Sinh viên: xóa đơn
router.delete('/:id', async (req, res) => {
  try {
    // Xóa file đính kèm nếu có
    const don = await DichVu.getById(req.params.id);
    if (don?.file_dinh_kem) {
      const filePath = path.resolve('uploads/dichvu', don.file_dinh_kem);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }
    const success = await DichVu.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File quá lớn, tối đa 10MB' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

export default router;
