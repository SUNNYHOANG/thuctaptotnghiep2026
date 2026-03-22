import React, { useEffect, useState } from 'react';
import { drlSelfAPI, lookupAPI, scoreAPI, tieuChiChiTietAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';

const BIEU_MAU_DRL_URL = import.meta.env.VITE_BIEU_MAU_DRL_URL || '/docs/bieu-mau-tu-danh-gia-DRL.xlsx';

const initItemScores = (mucs = []) => {
  const scores = {};
  mucs.forEach(muc => (muc.items || []).forEach(item => { scores[`item_${item.id}`] = ''; }));
  return scores;
};

// Map index mục → field backend
const MUC_FIELDS = [
  'diem_ythuc_hoc_tap',
  'diem_noi_quy',
  'diem_hoat_dong',
  'diem_cong_dong',
  'diem_khen_thuong_ky_luat',
];

const DrlSelfEvaluation = () => {
  const { user } = useAuth();
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [diemChinhThuc, setDiemChinhThuc] = useState(null);
  const [mucList, setMucList] = useState([]);
  const [itemScores, setItemScores] = useState({});
  const [nhanXet, setNhanXet] = useState('');
  const [openMuc, setOpenMuc] = useState({});
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [parsing, setParsing] = useState(false);
  // excelData: điểm tổng mục — từ file Excel hoặc từ phiếu đã gửi trước
  const [excelData, setExcelData] = useState(null);
  const [excelSource, setExcelSource] = useState(null); // 'file' | 'saved'
  const fileInputRef = React.useRef(null);

  // Tính điểm mục: nếu có excelData thì dùng thẳng, không thì tính từ itemScores
  const calcMuc = (muc, idx) => {
    if (excelData != null) {
      const field = MUC_FIELDS[idx];
      const val = field ? (Number(excelData[field]) || 0) : 0;
      return Math.min(Math.max(val, -muc.max), muc.max);
    }
    const items = muc.items || [];
    const raw = items.reduce((s, item) => s + (Number(itemScores[`item_${item.id}`]) || 0), 0);
    return Math.min(Math.max(raw, -muc.max), muc.max);
  };

  const total = mucList.reduce((s, muc, idx) => s + calcMuc(muc, idx), 0);

  useEffect(() => {
    lookupAPI.getHocKyDangMo().then((r) => setHockyList(r.data || []));
    tieuChiChiTietAPI.getAllGrouped().then((r) => {
      const data = r.data?.data || [];
      setMucList(data);
      setItemScores(initItemScores(data));
      if (data.length > 0) setOpenMuc({ [data[0].id]: true });
    }).catch(() => {});
  }, []);

  // Realtime: khi admin thay đổi trạng thái học kỳ → reload danh sách học kỳ đang mở
  useSocketEvent('hocky:updated', () => {
    lookupAPI.getHocKyDangMo().then((r) => setHockyList(r.data || []));
  });

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
      const d = res.data;
      setCurrent(d);
      setNhanXet(d.nhan_xet_sv ?? '');
      // Nếu có bất kỳ điểm mục nào đã lưu → dùng excelData mode để hiển thị trực tiếp
      const hasAnyScore = MUC_FIELDS.some(f => d[f] != null && d[f] !== 0);
      if (hasAnyScore) {
        setExcelData({
          diem_ythuc_hoc_tap: d.diem_ythuc_hoc_tap ?? 0,
          diem_noi_quy: d.diem_noi_quy ?? 0,
          diem_hoat_dong: d.diem_hoat_dong ?? 0,
          diem_cong_dong: d.diem_cong_dong ?? 0,
          diem_khen_thuong_ky_luat: d.diem_khen_thuong_ky_luat ?? 0,
        });
        setExcelSource('saved');
      } else {
        setExcelData(null);
        setExcelSource(null);
        setItemScores(initItemScores(mucList));
      }
    } catch {
      setCurrent(null);
      setExcelData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (key, value) => {
    setItemScores(s => ({ ...s, [key]: value }));
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setParsing(true);
    setMessage('');
    try {
      const res = await drlSelfAPI.parseExcel(file);
      const d = res.data;
      setExcelData(d);
      setExcelSource('file');
      if (d.nhan_xet_sv) setNhanXet(d.nhan_xet_sv);
      setMessage('Đã đọc điểm từ file Excel. Kiểm tra điểm từng mục rồi nhấn Gửi.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Không thể đọc file Excel. Vui lòng kiểm tra đúng biểu mẫu.');
    } finally {
      setParsing(false);
    }
  };

  const handleClearExcel = () => {
    setExcelData(null);
    setExcelSource(null);
    setItemScores(initItemScores(mucList));
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.mssv || !mahocky) { setMessage('Vui lòng chọn học kỳ.'); return; }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        mssv: user.mssv,
        mahocky,
        diem_ythuc_hoc_tap: calcMuc(mucList[0] || { items: [], max: 20 }, 0),
        diem_noi_quy: calcMuc(mucList[1] || { items: [], max: 25 }, 1),
        diem_hoat_dong: calcMuc(mucList[2] || { items: [], max: 20 }, 2),
        diem_cong_dong: calcMuc(mucList[3] || { items: [], max: 25 }, 3),
        diem_khen_thuong_ky_luat: calcMuc(mucList[4] || { items: [], max: 10 }, 4),
        nhan_xet_sv: nhanXet,
      };
      await drlSelfAPI.submit(payload);
      setMessage('Đã gửi phiếu tự đánh giá thành công.');
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Không thể lưu phiếu.');
    } finally {
      setSaving(false);
    }
  };

  const isLocked =
    (current?.trangthai === 'daduyet' && current?.nguoi_duyet_ctsv != null) ||
    current?.trangthai === 'chokhoaduyet';
  const canEdit = !isLocked;

  const statusLabel = (row) => {
    if (!row) return '';
    if (row.trangthai === 'bituchoi' && row.nguoi_duyet_khoa != null) return 'Bị Khoa từ chối';
    if (row.trangthai === 'bituchoi') return 'Bị từ chối (vui lòng chỉnh sửa và gửi lại)';
    if (row.trangthai === 'choduyet') return 'Chờ duyệt';
    if (row.trangthai === 'chokhoaduyet') return 'Chờ Khoa duyệt';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv == null) return 'Chờ Phòng duyệt cuối';
    if (row.trangthai === 'daduyet' && row.nguoi_duyet_ctsv != null) return 'Đã duyệt cuối';
    return String(row.trangthai);
  };

  const xepLoai = (d) => {
    if (d >= 90) return { label: 'Xuất sắc', color: '#1b5e20' };
    if (d >= 80) return { label: 'Tốt', color: '#2e7d32' };
    if (d >= 65) return { label: 'Khá', color: '#1565c0' };
    if (d >= 50) return { label: 'Trung bình', color: '#e65100' };
    return { label: 'Yếu', color: '#c62828' };
  };

  // Realtime: khi phiếu được duyệt → reload tự động
  useSocketEvent(['drl:reviewed', 'drl_score'], () => {
    if (user?.mssv && mahocky) {
      loadCurrent();
      scoreAPI.getByStudentAndSemester(user.mssv, mahocky)
        .then((r) => setDiemChinhThuc(r.data))
        .catch(() => {});
    }
  });

  return (
    <div className="container">
      <div className="card">
        {/* Header */}
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <h1 className="card-title">Tự đánh giá điểm rèn luyện</h1>
          <div className="d-flex gap-2 align-center">
            <label className="form-label" style={{ marginBottom: 0 }}>Học kỳ</label>
            <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={(e) => setMahocky(e.target.value)}>
              <option value="">-- Chọn học kỳ --</option>
              {hockyList.map((h) => (
                <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} ({h.mahocky})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Biểu mẫu Excel */}
        <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13 }}>
            <strong>📎 Biểu mẫu:</strong>{' '}
            <a href={BIEU_MAU_DRL_URL} target="_blank" rel="noopener noreferrer">Tải biểu mẫu (.xlsx)</a>
            {' '}— hoặc điền trực tiếp từng tiêu chí bên dưới.
          </div>
          {canEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
              <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: 13 }}
                disabled={parsing || !mahocky} onClick={() => fileInputRef.current?.click()}>
                {parsing ? 'Đang đọc...' : 'Upload biểu mẫu đã điền'}
              </button>
            </div>
          )}
        </div>

        {/* Banner Excel/Saved mode */}
        {excelData && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#e8f5e9', borderRadius: 8, border: '1px solid #a5d6a7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#2e7d32' }}>
              {excelSource === 'file'
                ? '✅ Đang hiển thị điểm từ file Excel vừa upload.'
                : '📋 Đang hiển thị điểm từ phiếu đã gửi trước đó.'}
              {' '}Nhấn "Chỉnh sửa chi tiết" để điền lại từng tiêu chí.
            </span>
            <button type="button" onClick={handleClearExcel}
              style={{ fontSize: 12, padding: '3px 10px', background: '#fff', border: '1px solid #a5d6a7', borderRadius: 4, cursor: 'pointer', color: '#555' }}>
              Chỉnh sửa chi tiết
            </button>
          </div>
        )}

        {/* Trạng thái */}
        {current && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Trạng thái: <strong>{statusLabel(current)}</strong>
            {current.trangthai === 'bituchoi' && current.nhan_xet_khoa && (
              <div style={{ marginTop: 4, color: '#c0392b' }}><strong>Lý do:</strong> {current.nhan_xet_khoa}</div>
            )}
            {current.diem_cvht != null && <span> – Điểm CVHT: <strong>{current.diem_cvht}</strong></span>}
            {current.nhan_xet_cvht && <div style={{ marginTop: 4 }}><strong>Nhận xét CVHT:</strong> {current.nhan_xet_cvht}</div>}
            {current.diem_khoa != null && <div style={{ marginTop: 4 }}><strong>Điểm Khoa:</strong> {current.diem_khoa}</div>}
            {current.nhan_xet_ctsv && <div style={{ marginTop: 4 }}><strong>Nhận xét CTSV:</strong> {current.nhan_xet_ctsv}</div>}
          </div>
        )}
        {current?.trangthai === 'daduyet' && current?.nguoi_duyet_ctsv != null && current?.diem_ctsv != null && (
          <div className="alert alert-success" style={{ marginBottom: 12, border: '2px solid #27ae60' }}>
            <strong>Điểm rèn luyện chính thức:</strong>{' '}
            <span style={{ fontSize: '1.3em', fontWeight: 800, color: '#27ae60' }}>{current.diem_ctsv}</span>
            {current.nhan_xet_ctsv && <div style={{ marginTop: 4, color: '#555' }}>{current.nhan_xet_ctsv}</div>}
          </div>
        )}
        {diemChinhThuc && (
          <div className="alert alert-success" style={{ marginBottom: 12 }}>
            <strong>Điểm rèn luyện đã đánh giá:</strong> {diemChinhThuc.diemtong} – {diemChinhThuc.xeploai || '—'}
          </div>
        )}

        {loading ? <div className="spinner" /> : (
          <form onSubmit={handleSubmit}>
            {mucList.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>
                Chưa có tiêu chí DRL. Admin cần cấu hình tiêu chí trước.
              </div>
            )}
            {mucList.map((muc, mucIdx) => {
              const mucDiem = calcMuc(muc, mucIdx);
              // rawDiem chỉ dùng để check overMax khi nhập tay
              const rawDiem = excelData != null
                ? mucDiem
                : (muc.items || []).reduce((s, item) => s + (Number(itemScores[`item_${item.id}`]) || 0), 0);
              const overMax = rawDiem > muc.max;
              const isOpen = openMuc[muc.id];

              return (
                <div key={muc.id} style={{ marginBottom: 10, border: `1px solid ${overMax ? '#f44336' : '#e0e0e0'}`, borderRadius: 8, overflow: 'hidden' }}>
                  {/* Header accordion */}
                  <div onClick={() => setOpenMuc(o => ({ ...o, [muc.id]: !o[muc.id] }))}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: isOpen ? '#e3f2fd' : '#f5f7fa', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>{isOpen ? '▾' : '▸'}</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{muc.ten}</span>
                      <span style={{ fontSize: 12, color: '#999' }}>(tối đa {muc.max}đ)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {overMax && <span style={{ color: '#f44336', fontSize: 12 }}>⚠ Vượt khung → tính {muc.max}đ</span>}
                      {excelData && <span style={{ fontSize: 11, color: '#2e7d32', background: '#e8f5e9', borderRadius: 4, padding: '1px 6px' }}>📄 Excel</span>}
                      <span style={{ fontWeight: 800, fontSize: 18, color: overMax ? '#f44336' : '#1976d2' }}>{mucDiem}</span>
                      <span style={{ color: '#999', fontSize: 13 }}>/{muc.max}</span>
                    </div>
                  </div>

                  {/* Body */}
                  {isOpen && (
                    <div style={{ padding: '0 0 12px' }}>
                      {/* Khi có Excel: hiển thị điểm tổng mục, ẩn form tiêu chí con */}
                      {excelData ? (
                        <div style={{ padding: '16px 20px', textAlign: 'center', color: '#555', fontSize: 14 }}>
                          <div style={{ fontSize: 32, fontWeight: 900, color: '#1976d2', marginBottom: 4 }}>{mucDiem}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            {excelSource === 'file' ? 'điểm từ file Excel' : 'điểm đã lưu'} (tối đa {muc.max}đ)
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                            Nhấn "Chỉnh sửa chi tiết" ở trên để điền lại từng tiêu chí.
                          </div>
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                              <th style={thStyle}>Tiêu chí</th>
                              <th style={{ ...thStyle, textAlign: 'center', width: 90 }}>Khung điểm</th>
                              <th style={{ ...thStyle, textAlign: 'center', width: 110 }}>Điểm tự đánh giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(muc.items || []).some(i => !i.la_diem_tru) && (
                              <tr><td colSpan={3} style={{ padding: '6px 14px 2px', fontSize: 12, fontWeight: 700, color: '#2e7d32', background: '#f9fbe7' }}>✅ Điểm cộng</td></tr>
                            )}
                            {(muc.items || []).filter(i => !i.la_diem_tru).map(item => {
                              const val = Number(itemScores[`item_${item.id}`]) || 0;
                              const over = val > item.diemtoida;
                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                  <td style={tdStyle}>
                                    {item.noidung}
                                    {item.ghichu && <span style={{ marginLeft: 6, fontSize: 11, color: '#888', background: '#f0f0f0', borderRadius: 4, padding: '1px 5px' }}>{item.ghichu}</span>}
                                  </td>
                                  <td style={{ ...tdStyle, textAlign: 'center', color: '#2e7d32', fontWeight: 600, fontSize: 13 }}>0 – {item.diemtoida}đ</td>
                                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <input type="number" min={0} max={item.diemtoida}
                                      value={itemScores[`item_${item.id}`]}
                                      onChange={e => handleItemChange(`item_${item.id}`, e.target.value)}
                                      disabled={!canEdit}
                                      style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: `1px solid ${over ? '#f44336' : '#ccc'}`, textAlign: 'center', fontSize: 14 }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}

                            {(muc.items || []).some(i => i.la_diem_tru) && (
                              <>
                                <tr><td colSpan={3} style={{ padding: '6px 14px 2px', fontSize: 12, fontWeight: 700, color: '#c62828', background: '#fff8f8' }}>❌ Điểm trừ (nhập số âm hoặc 0)</td></tr>
                                {(muc.items || []).filter(i => i.la_diem_tru).map(item => {
                                  const val = Number(itemScores[`item_${item.id}`]) || 0;
                                  const under = val < item.diemtoithieu;
                                  return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5', background: '#fffafa' }}>
                                      <td style={tdStyle}>
                                        <span style={{ color: '#c62828' }}>{item.noidung}</span>
                                        {item.ghichu && <span style={{ marginLeft: 6, fontSize: 11, color: '#888', background: '#f0f0f0', borderRadius: 4, padding: '1px 5px' }}>{item.ghichu}</span>}
                                      </td>
                                      <td style={{ ...tdStyle, textAlign: 'center', color: '#c62828', fontWeight: 600, fontSize: 13 }}>{item.diemtoithieu} – 0đ</td>
                                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                                        <input type="number" min={item.diemtoithieu} max={0}
                                          value={itemScores[`item_${item.id}`]}
                                          onChange={e => handleItemChange(`item_${item.id}`, e.target.value)}
                                          disabled={!canEdit}
                                          style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: `1px solid ${under ? '#f44336' : '#ccc'}`, textAlign: 'center', fontSize: 14, color: val < 0 ? '#c62828' : undefined }}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            )}

                            <tr style={{ background: '#f0f4ff', borderTop: '2px solid #e0e0e0' }}>
                              <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>Tổng {muc.ten}</td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 16, color: overMax ? '#f44336' : '#1976d2' }}>
                                {mucDiem}
                                {overMax && <span style={{ fontSize: 11, color: '#f44336', display: 'block' }}>tính tối đa {muc.max}đ</span>}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tổng điểm */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: '#f5f7fa', borderRadius: 8, marginBottom: 16, border: '2px solid #e0e0e0' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng điểm tự đánh giá:</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: xepLoai(total).color }}>{total}</span>
              <span style={{ color: '#999' }}>/100</span>
              {total > 0 && (
                <span style={{ fontWeight: 700, fontSize: 14, color: xepLoai(total).color, background: '#f0f0f0', borderRadius: 12, padding: '3px 12px' }}>
                  {xepLoai(total).label}
                </span>
              )}
            </div>

            {/* Tự nhận xét */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Tự nhận xét chung</label>
              <textarea className="form-control" style={{ minHeight: 90 }}
                value={nhanXet} onChange={e => setNhanXet(e.target.value)}
                placeholder="Mô tả quá trình rèn luyện, ý thức, tham gia hoạt động trong học kỳ..."
                disabled={!canEdit}
              />
            </div>

            {message && (
              <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-info'}`} style={{ marginBottom: 12 }}>
                {message}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={saving || !canEdit || !mahocky}>
              {saving ? 'Đang gửi...' : isLocked ? 'Đã duyệt cuối' : 'Gửi phiếu tự đánh giá'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const thStyle = { padding: '8px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#555' };
const tdStyle = { padding: '8px 14px', fontSize: 13 };

export default DrlSelfEvaluation;
