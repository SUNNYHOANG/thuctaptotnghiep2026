import React, { useEffect, useState } from 'react';
import { drlSelfAPI, lookupAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const KhoaDrlReview = () => {
  const { user } = useAuth();
  const [malop, setMalop] = useState('');
  const [mahocky, setMahocky] = useState('');
  const [hockyList, setHockyList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    trangthai: 'daduyet',
    diem_khoa: '',
    nhan_xet_khoa: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || [])).catch(() => {});
    lookupAPI.getLop().then((r) => setLopList(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setMessage('');
  }, [malop, mahocky]);

  const loadData = async () => {
    if (!mahocky) {
      setMessage('Vui lòng chọn học kỳ.');
      return;
    }
    setLoading(true);
    setMessage('');
    setSelected(null);
    try {
      const res = await drlSelfAPI.getByClassAndSemester(malop || '', mahocky);
      // Chỉ hiển thị phiếu chokhoaduyet thuộc khoa mình
      const filtered = (res.data || []).filter(
        (r) => r.trangthai === 'chokhoaduyet'
      );
      setRows(filtered);
      if (filtered.length === 0) {
        setMessage('Không có phiếu nào đang chờ Khoa duyệt.');
      }
    } catch (error) {
      setRows([]);
      setMessage(error.response?.data?.error || 'Không tải được danh sách phiếu.');
    } finally {
      setLoading(false);
    }
  };

  const openRow = (row) => {
    setSelected(row);
    setReviewForm({
      trangthai: 'daduyet',
      diem_khoa: row.diem_khoa ?? '',
      nhan_xet_khoa: row.nhan_xet_khoa || '',
    });
    setMessage('');
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const payload = {
        trangthai: reviewForm.trangthai,
        diem_khoa: reviewForm.diem_khoa === '' ? null : Number(reviewForm.diem_khoa),
        nhan_xet_khoa: reviewForm.nhan_xet_khoa,
      };
      const res = await drlSelfAPI.review(selected.id, payload);
      setMessage('Đã cập nhật duyệt phiếu thành công.');
      // Xóa phiếu đã duyệt khỏi danh sách
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Không thể cập nhật phiếu.');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📋 Duyệt Phiếu DRL - Ban Quản Lý Khoa</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Khoa: <strong>{user?.makhoa || '-'}</strong>
          </p>
          <div className="d-flex gap-2 align-center flex-wrap">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Học kỳ *</label>
              <select
                className="form-control"
                style={{ width: 180 }}
                value={mahocky}
                onChange={(e) => setMahocky(e.target.value)}
              >
                <option value="">-- Chọn học kỳ --</option>
                {hockyList.map((h) => (
                  <option key={h.mahocky} value={h.mahocky}>
                    {h.tenhocky} - {h.namhoc}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Lớp (tùy chọn)</label>
              <select
                className="form-control"
                style={{ width: 160 }}
                value={malop}
                onChange={(e) => setMalop(e.target.value)}
              >
                <option value="">Tất cả lớp</option>
                {(Array.isArray(lopList) ? lopList : []).map((l) => (
                  <option key={typeof l === 'object' ? l.malop : l} value={typeof l === 'object' ? l.malop : l}>
                    {typeof l === 'object' ? (l.tenlop || l.malop) : l}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" type="button" onClick={loadData} disabled={loading}>
              {loading ? 'Đang tải...' : 'Tải danh sách'}
            </button>
          </div>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="grid grid-2 mt-2">
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ tên</th>
                  <th>Lớp</th>
                  <th>Tổng điểm SV</th>
                  <th>Điểm CVHT</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ cursor: 'pointer', background: selected?.id === row.id ? '#fff3cd' : undefined }}
                    onClick={() => openRow(row)}
                  >
                    <td>{row.mssv}</td>
                    <td>{row.hoten}</td>
                    <td>{row.malop}</td>
                    <td>{row.tong_diem}</td>
                    <td>{row.diem_cvht ?? '-'}</td>
                    <td>
                      <span style={{ background: '#f39c12', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        Chờ Khoa duyệt
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>
                      Chưa có phiếu nào chờ Khoa duyệt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            {selected ? (
              <form onSubmit={submitReview} className="card" style={{ padding: 16 }}>
                <h2 style={{ marginBottom: 8 }}>Phiếu của {selected.hoten}</h2>
                <p className="mb-2">
                  <strong>MSSV:</strong> {selected.mssv} •{' '}
                  <strong>Lớp:</strong> {selected.malop} •{' '}
                  <strong>Tổng điểm SV:</strong> {selected.tong_diem}
                </p>

                {/* Thông tin điểm từng mục */}
                <div style={{ background: '#f8f9fa', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <strong>Chi tiết điểm tự đánh giá:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8, fontSize: 13 }}>
                    <span>Ý thức học tập:</span><span>{selected.diem_ythuc_hoc_tap ?? '-'}</span>
                    <span>Chấp hành nội quy:</span><span>{selected.diem_noi_quy ?? '-'}</span>
                    <span>Tham gia hoạt động:</span><span>{selected.diem_hoat_dong ?? '-'}</span>
                    <span>Công tác cộng đồng:</span><span>{selected.diem_cong_dong ?? '-'}</span>
                    <span>Khen thưởng/Kỷ luật:</span><span>{selected.diem_khen_thuong_ky_luat ?? '-'}</span>
                  </div>
                  {selected.nhan_xet_sv && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Nhận xét SV:</strong> {selected.nhan_xet_sv}
                    </div>
                  )}
                </div>

                {/* Thông tin CVHT */}
                {(selected.diem_cvht != null || selected.nhan_xet_cvht) && (
                  <div style={{ background: '#e8f4fd', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                    <strong>Đánh giá của CVHT:</strong>
                    {selected.diem_cvht != null && (
                      <div style={{ marginTop: 4 }}>Điểm CVHT: <strong>{selected.diem_cvht}</strong></div>
                    )}
                    {selected.nhan_xet_cvht && (
                      <div style={{ marginTop: 4 }}>Nhận xét: {selected.nhan_xet_cvht}</div>
                    )}
                  </div>
                )}

                {/* Form duyệt của Khoa */}
                <div className="form-group">
                  <label className="form-label">Quyết định</label>
                  <select
                    name="trangthai"
                    className="form-control"
                    value={reviewForm.trangthai}
                    onChange={handleReviewChange}
                  >
                    <option value="daduyet">Duyệt (chuyển CTSV)</option>
                    <option value="bituchoi">Từ chối</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Điểm Khoa (0-100)</label>
                  <input
                    type="number"
                    name="diem_khoa"
                    className="form-control"
                    value={reviewForm.diem_khoa}
                    onChange={handleReviewChange}
                    min="0"
                    max="100"
                    placeholder="Nhập điểm Khoa chấm"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nhận xét của Khoa</label>
                  <textarea
                    name="nhan_xet_khoa"
                    className="form-control"
                    style={{ minHeight: 100 }}
                    value={reviewForm.nhan_xet_khoa}
                    onChange={handleReviewChange}
                    placeholder="Nhập nhận xét..."
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Lưu duyệt phiếu
                </button>
              </form>
            ) : (
              <div className="card" style={{ padding: 16 }}>
                <p>Chọn một phiếu bên trái để xem chi tiết và duyệt.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhoaDrlReview;
