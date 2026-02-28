import React, { useEffect, useState } from 'react';
import { drlSelfAPI, lookupAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const DrlClassReview = () => {
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
    diem_cvht: '',
    nhan_xet_cvht: '',
    diem_ctsv: '',
    nhan_xet_ctsv: '',
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
      const isCTSV = user?.role === 'ctsv';
      const payload = isCTSV
        ? {
            // CTSV duyệt cuối: dùng diem_ctsv/nhan_xet_ctsv
            trangthai: reviewForm.trangthai,
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
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv == null) return 'Chờ CTSV duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv != null) return 'Đã duyệt cuối';
    return String(row.trangthai);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            Duyệt tự đánh giá điểm rèn luyện ({user?.role === 'ctsv' ? 'CTSV' : user?.role === 'admin' ? 'Admin' : 'Giảng viên'})
          </h1>
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
                <option value="">{user?.role === 'admin' || user?.role === 'ctsv' ? 'Tất cả lớp' : '-- Chọn lớp --'}</option>
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
            Admin/CTSV: chọn học kỳ và &quot;Tất cả lớp&quot; để xem mọi phiếu sinh viên đã gửi. Giảng viên: chọn thêm lớp của sinh viên.
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
                    <td>{statusLabel(row)}</td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>
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
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select
                    name="trangthai"
                    className="form-control"
                    value={reviewForm.trangthai}
                    onChange={handleReviewChange}
                  >
                    <option value="daduyet">{user?.role === 'ctsv' ? 'Duyệt cuối' : 'Duyệt (chuyển CTSV)'}</option>
                    <option value="bituchoi">Từ chối</option>
                    <option value="choduyet">Chờ duyệt</option>
                  </select>
                </div>
                {user?.role === 'ctsv' ? (
                  <>
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
                <button className="btn btn-primary" type="submit">
                  Lưu duyệt phiếu
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

