import React, { useEffect, useState } from 'react';
import { drlSelfAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const DrlSelfEvaluation = () => {
  const { user } = useAuth();
  const [mahocky, setMahocky] = useState('');
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

  useEffect(() => {
    if (user?.mssv && mahocky) {
      loadCurrent();
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
    current?.trangthai === 'daduyet' && current?.nguoi_duyet_ctsv != null;
  const canEdit = !isLocked;

  const statusLabel = (row) => {
    if (!row) return '';
    if (row.trangthai === 'bituchoi') return 'Bị từ chối (vui lòng chỉnh sửa và gửi lại)';
    if (row.trangthai === 'choduyet') return 'Chờ Giảng viên/CVHT duyệt';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv == null) return 'Chờ Phòng CTSV duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv != null) return 'Đã duyệt cuối (điểm chính thức đã ghi nhận)';
    return String(row.trangthai);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Tự đánh giá điểm rèn luyện</h1>
          <div className="d-flex gap-2 align-center">
            <label className="form-label" style={{ marginBottom: 0 }}>
              Mã học kỳ
            </label>
            <input
              className="form-control"
              style={{ width: 120 }}
              value={mahocky}
              onChange={(e) => setMahocky(e.target.value)}
              placeholder="vd: 1"
            />
          </div>
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
                  max="10"
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

              {current && (
                <div className="alert alert-info">
                  Trạng thái hiện tại: <strong>{statusLabel(current)}</strong>
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

