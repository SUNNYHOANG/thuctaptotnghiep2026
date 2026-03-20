import React, { useEffect, useState } from 'react';
import { drlSelfAPI, lookupAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const DrlClassReview = () => {
  const { user } = useAuth();
  const isGV = user?.role === 'giangvien';
  const isCTSV = user?.role === 'ctsv';
  const [malop, setMalop] = useState('');
  const [mahocky, setMahocky] = useState('');
  const [hockyList, setHockyList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    trangthai: 'daduyet',
    diem_cvht: '',
    nhan_xet_cvht: '',
    diem_ctsv: '',
    nhan_xet_ctsv: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || [])).catch(() => {});
    // GV chỉ load lớp thuộc khoa mình; CTSV/admin load tất cả
    const makhoa = isGV ? user?.makhoa : null;
    lookupAPI.getLopByKhoa(makhoa)
      .then((r) => setLopList(r.data?.data || r.data || []))
      .catch(() => lookupAPI.getLop().then((r) => setLopList(r.data?.data || r.data || [])));
  }, [isGV, user?.makhoa]);

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
      setRows(res.data || []);
      if ((res.data || []).length === 0) {
        setMessage('Không có phiếu nào. Admin/CTSV: thử chọn "Tất cả lớp". Sinh viên cần gửi phiếu tự đánh giá đúng học kỳ.');
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
      trangthai: row.trangthai || 'daduyet',
      diem_cvht: row.diem_cvht ?? row.tong_diem ?? '',
      nhan_xet_cvht: row.nhan_xet_cvht || '',
      diem_ctsv: row.diem_ctsv ?? row.diem_cvht ?? row.tong_diem ?? '',
      nhan_xet_ctsv: row.nhan_xet_ctsv || '',
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
      const payload = isCTSV
        ? {
            // CTSV duyệt cuối: luôn daduyet, dùng diem_ctsv/nhan_xet_ctsv
            trangthai: 'daduyet',
            diem_ctsv: reviewForm.diem_ctsv === '' ? null : Number(reviewForm.diem_ctsv),
            nhan_xet_ctsv: reviewForm.nhan_xet_ctsv,
          }
        : {
            // GV/CVHT: dùng diem_cvht/nhan_xet_cvht
            trangthai: reviewForm.trangthai,
            diem_cvht: reviewForm.diem_cvht === '' ? null : Number(reviewForm.diem_cvht),
            nhan_xet_cvht: reviewForm.nhan_xet_cvht,
          };
      const res = await drlSelfAPI.review(selected.id, payload);
      setMessage('Đã cập nhật duyệt phiếu.');
      setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...res.data } : r)));
      setSelected(res.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Không thể cập nhật phiếu.');
    }
  };

  const statusLabel = (row) => {
    if (!row) return '';
    if (row.trangthai === 'bituchoi') return 'Bị từ chối';
    if (row.trangthai === 'choduyet') return 'Chờ GV duyệt';
    if (row.trangthai === 'chokhoaduyet') return 'Chờ Khoa duyệt';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv == null) return 'Chờ CTSV duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv != null) return 'Đã duyệt cuối';
    return String(row.trangthai);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            Duyệt tự đánh giá điểm rèn luyện ({isCTSV ? 'CTSV' : user?.role === 'admin' ? 'Admin' : 'Giảng viên'})
          </h1>
          {isGV && user?.makhoa && (
            <p style={{ color: '#2563eb', fontWeight: 500, marginBottom: 8, marginTop: 4 }}>
              🏛️ Khoa: <strong>{user.makhoa}</strong> — chỉ hiển thị sinh viên thuộc khoa này
            </p>
          )}
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
              <label className="form-label">{isGV ? 'Lọc theo lớp' : 'Lớp (tùy chọn)'}</label>
              <select
                className="form-control"
                style={{ width: 180 }}
                value={malop}
                onChange={(e) => setMalop(e.target.value)}
              >
                <option value="">{isCTSV || user?.role === 'admin' ? 'Tất cả lớp' : 'Tất cả lớp trong khoa'}</option>
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
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.9rem' }}>
            {isGV
              ? 'Chọn học kỳ và lớp để xem phiếu sinh viên cần duyệt. Chỉ hiển thị sinh viên thuộc khoa của bạn.'
              : 'Admin/CTSV: chọn học kỳ và "Tất cả lớp" để xem mọi phiếu sinh viên đã gửi.'}
          </p>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="grid grid-2 mt-2">
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ tên</th>
                  <th>Tổng điểm SV</th>
                  <th>Điểm CVHT</th>
                  {(isCTSV || user?.role === 'admin') && <th>Điểm Khoa</th>}
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ cursor: 'pointer', background: selected?.id === row.id ? '#eff6ff' : undefined }}
                    onClick={() => openRow(row)}
                  >
                    <td>{row.mssv}</td>
                    <td>{row.hoten}</td>
                    <td>{row.tong_diem}</td>
                    <td>{row.diem_cvht ?? '-'}</td>
                    {(isCTSV || user?.role === 'admin') && (
                      <td>{row.diem_khoa ?? '-'}</td>
                    )}
                    <td>{statusLabel(row)}</td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={(isCTSV || user?.role === 'admin') ? 6 : 5} style={{ textAlign: 'center', padding: 16 }}>
                      Chưa có phiếu tự đánh giá cho lớp/học kỳ này.
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
                  <strong>MSSV:</strong> {selected.mssv} • <strong>Tổng điểm SV:</strong>{' '}
                  {selected.tong_diem}
                </p>

                {/* Chi tiết điểm từng mục */}
                <div style={{ background: '#f8f9fa', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <strong>Chi tiết điểm tự đánh giá:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px', marginTop: 8, fontSize: 13 }}>
                    <span>1. Ý thức học tập (tối đa 20đ):</span><span><strong>{selected.diem_ythuc_hoc_tap ?? '-'}</strong></span>
                    <span>2. Chấp hành nội quy (tối đa 25đ):</span><span><strong>{selected.diem_noi_quy ?? '-'}</strong></span>
                    <span>3. Tham gia hoạt động (tối đa 20đ):</span><span><strong>{selected.diem_hoat_dong ?? '-'}</strong></span>
                    <span>4. Công tác cộng đồng (tối đa 25đ):</span><span><strong>{selected.diem_cong_dong ?? '-'}</strong></span>
                    <span>5. Khen thưởng / Kỷ luật (tối đa 10đ):</span><span><strong>{selected.diem_khen_thuong_ky_luat ?? '-'}</strong></span>
                  </div>
                  {selected.nhan_xet_sv && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #dee2e6', paddingTop: 8 }}>
                      <strong>Nhận xét của SV:</strong> {selected.nhan_xet_sv}
                    </div>
                  )}
                </div>

                {/* Thông tin duyệt của Khoa (CTSV xem) */}
                {isCTSV && (selected.diem_khoa != null || selected.nhan_xet_khoa) && (
                  <div style={{ background: '#fff3cd', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                    <strong>Đánh giá của Khoa:</strong>
                    {selected.diem_khoa != null && (
                      <div style={{ marginTop: 4 }}>Điểm Khoa: <strong>{selected.diem_khoa}</strong></div>
                    )}
                    {selected.nhan_xet_khoa && (
                      <div style={{ marginTop: 4 }}>Nhận xét: {selected.nhan_xet_khoa}</div>
                    )}
                  </div>
                )}
                {user?.role !== 'ctsv' && (
                  <div className="form-group">
                    <label className="form-label">Trạng thái</label>
                    <select
                      name="trangthai"
                      className="form-control"
                      value={reviewForm.trangthai}
                      onChange={handleReviewChange}
                    >
                      <option value="daduyet">Duyệt (chuyển CTSV)</option>
                      <option value="bituchoi">Từ chối</option>
                      <option value="choduyet">Chờ duyệt</option>
                    </select>
                  </div>
                )}
                {isCTSV ? (
                  <>
                    {/* Hiển thị thông tin duyệt của Khoa cho CTSV xem */}
                    {selected?.diem_khoa != null && (
                      <div className="form-group">
                        <label className="form-label" style={{ color: '#e67e22' }}>Điểm Khoa đã chấm</label>
                        <input type="number" className="form-control" value={selected.diem_khoa} readOnly style={{ background: '#fef9f0' }} />
                      </div>
                    )}
                    {selected?.nhan_xet_khoa && (
                      <div className="form-group">
                        <label className="form-label" style={{ color: '#e67e22' }}>Nhận xét của Khoa</label>
                        <textarea className="form-control" style={{ minHeight: 80, background: '#fef9f0' }} value={selected.nhan_xet_khoa} readOnly />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Điểm CTSV chốt (điểm chính thức)</label>
                      <input
                        type="number"
                        name="diem_ctsv"
                        className="form-control"
                        value={reviewForm.diem_ctsv}
                        onChange={handleReviewChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nhận xét của CTSV</label>
                      <textarea
                        name="nhan_xet_ctsv"
                        className="form-control"
                        style={{ minHeight: 120 }}
                        value={reviewForm.nhan_xet_ctsv}
                        onChange={handleReviewChange}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Điểm CVHT chấm</label>
                      <input
                        type="number"
                        name="diem_cvht"
                        className="form-control"
                        value={reviewForm.diem_cvht}
                        onChange={handleReviewChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nhận xét của CVHT</label>
                      <textarea
                        name="nhan_xet_cvht"
                        className="form-control"
                        style={{ minHeight: 120 }}
                        value={reviewForm.nhan_xet_cvht}
                        onChange={handleReviewChange}
                      />
                    </div>
                  </>
                )}
                <button className="btn btn-primary" type="submit" style={isCTSV ? { background: '#15803d', borderColor: '#15803d' } : {}}>
                  {isCTSV ? '✅ Duyệt & Chốt điểm rèn luyện' : 'Lưu duyệt phiếu'}
                </button>
              </form>
            ) : (
              <div className="card" style={{ padding: 16 }}>
                <p>Chọn một dòng bên trái để xem và duyệt phiếu tự đánh giá.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrlClassReview;

