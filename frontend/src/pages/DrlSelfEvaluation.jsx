import React, { useEffect, useState } from 'react';
import { drlSelfAPI, lookupAPI, scoreAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const BIEU_MAU_DRL_URL = import.meta.env.VITE_BIEU_MAU_DRL_URL || '/docs/bieu-mau-tu-danh-gia-DRL.xlsx';

const DrlSelfEvaluation = () => {
  const { user } = useAuth();
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [diemChinhThuc, setDiemChinhThuc] = useState(null);
  const [form, setForm] = useState({
    diem_ythuc_hoc_tap: '',
    diem_noi_quy: '',
    diem_hoat_dong: '',
    diem_cong_dong: '',
    diem_khen_thuong_ky_luat: '',
    nhan_xet_sv: '',
  });
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [parsing, setParsing] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || []));
  }, []);

  useEffect(() => {
    if (user?.mssv && mahocky) {
      loadCurrent();
      scoreAPI.getByStudentAndSemester(user.mssv, mahocky)
        .then((r) => setDiemChinhThuc(r.data))
        .catch(() => setDiemChinhThuc(null));
    } else {
      setCurrent(null);
      setDiemChinhThuc(null);
    }
  }, [user?.mssv, mahocky]);

  const loadCurrent = async () => {
    if (!user?.mssv || !mahocky) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await drlSelfAPI.getByStudentAndSemester(user.mssv, mahocky);
      setCurrent(res.data);
      setForm({
        diem_ythuc_hoc_tap: res.data.diem_ythuc_hoc_tap ?? '',
        diem_noi_quy: res.data.diem_noi_quy ?? '',
        diem_hoat_dong: res.data.diem_hoat_dong ?? '',
        diem_cong_dong: res.data.diem_cong_dong ?? '',
        diem_khen_thuong_ky_luat: res.data.diem_khen_thuong_ky_luat ?? '',
        nhan_xet_sv: res.data.nhan_xet_sv ?? '',
      });
    } catch (error) {
      setCurrent(null);
      setForm((prev) => ({ ...prev, nhan_xet_sv: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input để có thể upload lại cùng file
    e.target.value = '';
    setParsing(true);
    setMessage('');
    try {
      const res = await drlSelfAPI.parseExcel(file);
      const d = res.data;
      setForm((prev) => ({
        ...prev,
        diem_ythuc_hoc_tap: d.diem_ythuc_hoc_tap ?? prev.diem_ythuc_hoc_tap,
        diem_noi_quy: d.diem_noi_quy ?? prev.diem_noi_quy,
        diem_hoat_dong: d.diem_hoat_dong ?? prev.diem_hoat_dong,
        diem_cong_dong: d.diem_cong_dong ?? prev.diem_cong_dong,
        diem_khen_thuong_ky_luat: d.diem_khen_thuong_ky_luat ?? prev.diem_khen_thuong_ky_luat,
        nhan_xet_sv: d.nhan_xet_sv || prev.nhan_xet_sv,
      }));
      setMessage('✅ Đã đọc điểm từ file Excel. Kiểm tra lại rồi nhấn "Gửi phiếu tự đánh giá".');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Không thể đọc file Excel. Vui lòng kiểm tra đúng biểu mẫu.'));
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.mssv || !mahocky) {
      setMessage('Vui lòng chọn học kỳ.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        mssv: user.mssv,
        mahocky,
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [
            k,
            ['nhan_xet_sv'].includes(k) ? v : Number(v || 0),
          ])
        ),
      };
      const res = await drlSelfAPI.submit(payload);
      setCurrent(res.data);
      setMessage('Đã gửi phiếu tự đánh giá (chờ Giảng viên/CVHT duyệt).');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Không thể lưu phiếu.');
    } finally {
      setSaving(false);
    }
  };

  const total =
    (Number(form.diem_ythuc_hoc_tap) || 0) +
    (Number(form.diem_noi_quy) || 0) +
    (Number(form.diem_hoat_dong) || 0) +
    (Number(form.diem_cong_dong) || 0) +
    (Number(form.diem_khen_thuong_ky_luat) || 0);

  const isLocked =
    (current?.trangthai === 'daduyet' && current?.nguoi_duyet_ctsv != null) ||
    current?.trangthai === 'chokhoaduyet';
  const canEdit = !isLocked;

  const statusLabel = (row) => {
    if (!row) return '';
    if (row.trangthai === 'bituchoi' && row.nguoi_duyet_khoa != null) return 'Bị Khoa từ chối';
    if (row.trangthai === 'bituchoi') return 'Bị từ chối (vui lòng chỉnh sửa và gửi lại)';
    if (row.trangthai === 'choduyet') return 'Chờ Giảng viên/CVHT duyệt';
    if (row.trangthai === 'chokhoaduyet') return 'Chờ Khoa duyệt';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_khoa != null && row.nguoi_duyet_ctsv == null) return 'Chờ Phòng CTSV duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv == null) return 'Chờ Phòng CTSV duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv != null) return 'Đã duyệt cuối (điểm chính thức đã ghi nhận)';
    return String(row.trangthai);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <h1 className="card-title">Tự đánh giá điểm rèn luyện</h1>
          <div className="d-flex gap-2 align-center">
            <label className="form-label" style={{ marginBottom: 0 }}>Học kỳ</label>
            <select
              className="form-control"
              style={{ width: 180 }}
              value={mahocky}
              onChange={(e) => setMahocky(e.target.value)}
            >
              <option value="">-- Chọn học kỳ --</option>
              {hockyList.map((h) => (
                <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} (Mã: {h.mahocky})</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div>
            <strong>📎 Biểu mẫu tự đánh giá:</strong>{' '}
            <a href={BIEU_MAU_DRL_URL} target="_blank" rel="noopener noreferrer">Tải biểu mẫu (.xlsx)</a>
            {' '}→ điền điểm từng mục → upload lại bên dưới.
          </div>
          {canEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap' }}
                disabled={parsing || !mahocky}
                onClick={() => fileInputRef.current?.click()}
              >
                {parsing ? '⏳ Đang đọc...' : '📤 Upload biểu mẫu đã điền'}
              </button>
              {!mahocky && <span style={{ fontSize: '0.85em', color: '#888' }}>Chọn học kỳ trước</span>}
            </div>
          )}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">Ý thức học tập</label>
                <input
                  type="number"
                  name="diem_ythuc_hoc_tap"
                  className="form-control"
                  value={form.diem_ythuc_hoc_tap}
                  onChange={handleChange}
                  min="0"
                  max="30"
                  disabled={!canEdit}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chấp hành nội quy</label>
                <input
                  type="number"
                  name="diem_noi_quy"
                  className="form-control"
                  value={form.diem_noi_quy}
                  onChange={handleChange}
                  min="0"
                  max="25"
                  disabled={!canEdit}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tham gia hoạt động</label>
                <input
                  type="number"
                  name="diem_hoat_dong"
                  className="form-control"
                  value={form.diem_hoat_dong}
                  onChange={handleChange}
                  min="0"
                  max="25"
                  disabled={!canEdit}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Công tác xã hội & cộng đồng</label>
                <input
                  type="number"
                  name="diem_cong_dong"
                  className="form-control"
                  value={form.diem_cong_dong}
                  onChange={handleChange}
                  min="0"
                  max="25"
                  disabled={!canEdit}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Khen thưởng / Kỷ luật</label>
                <input
                  type="number"
                  name="diem_khen_thuong_ky_luat"
                  className="form-control"
                  value={form.diem_khen_thuong_ky_luat}
                  onChange={handleChange}
                  min="-10"
                  max="10"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div>
              <div className="form-group">
                <label className="form-label">Tự nhận xét</label>
                <textarea
                  name="nhan_xet_sv"
                  className="form-control"
                  style={{ minHeight: 140 }}
                  value={form.nhan_xet_sv}
                  onChange={handleChange}
                  placeholder="Mô tả quá trình rèn luyện, ý thức, tham gia hoạt động..."
                  disabled={!canEdit}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tổng điểm tự đánh giá</label>
                <input
                  className="form-control"
                  value={total}
                  readOnly
                  style={{ fontWeight: 'bold' }}
                />
              </div>

              {/* Khi CTSV đã chốt điểm chính thức, hiển thị diem_ctsv nổi bật */}
              {current?.trangthai === 'daduyet' && current?.nguoi_duyet_ctsv != null && current?.diem_ctsv != null && (
                <div className="alert alert-success" style={{ marginBottom: 12, border: '2px solid #27ae60' }}>
                  <strong>✅ Điểm rèn luyện chính thức (CTSV đã chốt):</strong>{' '}
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#27ae60' }}>
                    {current.diem_ctsv}
                  </span>
                  {current.nhan_xet_ctsv && (
                    <div style={{ marginTop: 6, color: '#555' }}>
                      <strong>Ghi chú:</strong> {current.nhan_xet_ctsv}
                    </div>
                  )}
                </div>
              )}

              {diemChinhThuc && (
                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                  <strong>Điểm rèn luyện đã được đánh giá (học kỳ này):</strong> {diemChinhThuc.diemtong} – Xếp loại: {diemChinhThuc.xeploai || '—'}
                </div>
              )}
              {current && (
                <div className="alert alert-info">
                  Trạng thái hiện tại: <strong>{statusLabel(current)}</strong>
                  {current.trangthai === 'bituchoi' && current.nguoi_duyet_khoa != null && current.nhan_xet_khoa && (
                    <div style={{ marginTop: 8, color: '#c0392b' }}>
                      <strong>Lý do Khoa từ chối:</strong> {current.nhan_xet_khoa}
                    </div>
                  )}
                  {current.diem_cvht != null && (
                    <>
                      {' – '}Điểm CVHT: <strong>{current.diem_cvht}</strong>
                    </>
                  )}
                  {current.nhan_xet_cvht && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Nhận xét CVHT:</strong> {current.nhan_xet_cvht}
                    </div>
                  )}
                  {current.diem_khoa != null && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Điểm Khoa:</strong> {current.diem_khoa}
                    </div>
                  )}
                  {current.nhan_xet_khoa && current.trangthai !== 'bituchoi' && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Nhận xét Khoa:</strong> {current.nhan_xet_khoa}
                    </div>
                  )}
                  {current.nhan_xet_ctsv && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Nhận xét CTSV:</strong> {current.nhan_xet_ctsv}
                    </div>
                  )}
                </div>
              )}

              {message && <div className="alert alert-info">{message}</div>}

              <button className="btn btn-primary" type="submit" disabled={saving || !canEdit}>
                {saving ? 'Đang gửi...' : isLocked ? 'Đã duyệt cuối' : 'Gửi phiếu tự đánh giá'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DrlSelfEvaluation;

