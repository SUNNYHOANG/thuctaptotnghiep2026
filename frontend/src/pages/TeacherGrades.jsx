import React, { useState, useEffect, useRef } from 'react';
import { gradeAPI, lookupAPI } from '../api/api';
import './TeacherGrades.css';

const MUC_COLOR = {
  'Xuất sắc': '#27ae60',
  'Giỏi': '#2980b9',
  'Khá': '#f39c12',
  'Trung bình': '#e67e22',
  'Yếu': '#e74c3c',
  'Chưa xếp loại': '#95a5a6',
};

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

function calcTongKet(cc, gk, ck) {
  const n = (v) => (v === '' || v === null || v === undefined) ? 0 : Number(v);
  return Math.round((n(cc) * 0.1 + n(gk) * 0.3 + n(ck) * 0.6) * 100) / 100;
}

function calcGPA(tongket) {
  if (tongket === null || tongket === undefined) return null;
  return Math.round((tongket / 10) * 4 * 100) / 100;
}

function xepLoai(tongket) {
  if (tongket === null || tongket === undefined) return 'Chưa xếp loại';
  if (tongket >= 9) return 'Xuất sắc';
  if (tongket >= 8) return 'Giỏi';
  if (tongket >= 7) return 'Khá';
  if (tongket >= 5) return 'Trung bình';
  return 'Yếu';
}

const TeacherGrades = () => {
  const user = getUser();
  const isCtsv = user.role === 'ctsv' || user.role === 'admin';

  const [classSections, setClassSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
  const [editMap, setEditMap] = useState({}); // { mabangdiem: { cc, gk, ck } }
  const [logModal, setLogModal] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [khoaList, setKhoaList] = useState([]);
  const [filterKhoa, setFilterKhoa] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    loadClassSections();
    if (isCtsv) {
      lookupAPI.getKhoaList().then(r => setKhoaList(r.data?.data || r.data || [])).catch(() => {});
    }
  }, []);
  // Reload khi filter khoa thay đổi (chỉ cho CTSV)
  useEffect(() => {
    if (!isCtsv) return; // giảng viên không dùng filter này
    loadClassSections();
  }, [filterKhoa]);
  useEffect(() => { if (selectedClass) loadGrades(); }, [selectedClass]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadClassSections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterKhoa) params.set('makhoa', filterKhoa);
      // Giảng viên: lọc theo magiaovien ở backend
      if (!isCtsv && user.magiaovien) params.set('magiaovien', user.magiaovien);
      const csRes = await fetch(`http://localhost:5000/api/class-sections?${params.toString()}`, {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
          'x-user-makhoa': user.makhoa || '',
          'x-user-magiaovien': user.magiaovien || '',
        },
      });
      const csData = await csRes.json();
      const list = Array.isArray(csData) ? csData : (csData.data || []);
      // Giảng viên chỉ thấy lớp mình
      const filtered = isCtsv
        ? list
        : list.filter(c => String(c.magiaovien) === String(user.magiaovien || user.id));
      setClassSections(filtered);
      if (filtered.length > 0 && !selectedClass) {
        setSelectedClass(filtered[0].malophocphan);
      } else if (filtered.length === 0) {
        setSelectedClass('');
        setGrades([]);
      }
    } catch (err) {
      showMsg('error', 'Lỗi tải danh sách lớp: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      setEditMap({});
      const res = await gradeAPI.getByClass(selectedClass);
      setGrades(res.data || []);
    } catch (err) {
      showMsg('error', 'Lỗi tải bảng điểm: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (g) => {
    setEditMap(prev => ({
      ...prev,
      [g.mabangdiem]: {
        cc: g.diemchuyencan ?? '',
        gk: g.diemgiuaky ?? '',
        ck: g.diemcuoiky ?? '',
      },
    }));
  };

  const handleCancelEdit = (id) => {
    setEditMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSave = async (g) => {
    const e = editMap[g.mabangdiem];
    if (!e) return;
    try {
      setSaving(true);
      await gradeAPI.update(g.mabangdiem, {
        diemchuyencan: e.cc === '' ? null : Number(e.cc),
        diemgiuaky: e.gk === '' ? null : Number(e.gk),
        diemcuoiky: e.ck === '' ? null : Number(e.ck),
      });
      handleCancelEdit(g.mabangdiem);
      await loadGrades();
      showMsg('success', 'Đã lưu điểm');
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    if (!window.confirm('Khóa bảng điểm? Sau khi khóa không thể sửa.')) return;
    try {
      await gradeAPI.lock(selectedClass);
      await loadGrades();
      showMsg('success', 'Đã khóa bảng điểm');
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    }
  };

  const handleUnlock = async () => {
    if (!window.confirm('Mở khóa bảng điểm?')) return;
    try {
      await gradeAPI.unlock(selectedClass);
      await loadGrades();
      showMsg('success', 'Đã mở khóa bảng điểm');
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSaving(true);
      const res = await gradeAPI.importExcel(file);
      setImportResult(res.data);
      await loadGrades();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleViewLog = async (g) => {
    try {
      const res = await gradeAPI.getLog(g.mabangdiem);
      setLogModal({ grade: g, logs: res.data || [] });
    } catch (err) {
      showMsg('error', 'Lỗi tải log: ' + err.message);
    }
  };

  const isLocked = grades.length > 0 && grades.every(g => g.trangthai === 'dakhoa');
  const selectedInfo = classSections.find(c => c.malophocphan === selectedClass);

  return (
    <div className="teacher-grades-container">
      <div className="grades-header">
        <h1>📊 {isCtsv ? 'Quản lý điểm toàn trường' : 'Nhập điểm sinh viên'}</h1>
        <p className="subtitle">{isCtsv ? 'CTSV – Quản lý, import Excel, khóa/mở khóa bảng điểm' : `Giảng viên: ${user.hoten || user.username}`}</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>{msg.text}</div>
      )}

      {/* Chọn lớp */}
      <div className="class-selection-bar">
        {isCtsv && khoaList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>Khoa:</label>
            <select
              value={filterKhoa}
              onChange={e => { setFilterKhoa(e.target.value); setSelectedClass(''); setGrades([]); }}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 14 }}
            >
              <option value="">Tất cả khoa</option>
              {khoaList.map(k => (
                <option key={k.makhoa} value={k.makhoa}>{k.makhoa} – {k.tenkhoa}</option>
              ))}
            </select>
          </div>
        )}
        <label>Lớp học phần:</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">-- Chọn lớp --</option>
          {classSections.map(c => (
            <option key={c.malophocphan} value={c.malophocphan}>
              {c.tenmonhoc} – {c.malophocphan}
              {c.tenhocky ? ` (${c.tenhocky})` : ''}
            </option>
          ))}
        </select>
      </div>

      {!loading && classSections.length === 0 && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 6, padding: '14px 18px', color: '#795548', fontSize: 14, marginBottom: 16 }}>
          ⚠️ Chưa có lớp học phần nào được phân công cho học kỳ hiện tại.
          {!isCtsv && (
            <span> Vui lòng liên hệ Admin để được phân công lớp học phần.</span>
          )}
        </div>
      )}

      {selectedClass && (
        <>
          {/* Thông tin lớp + nút hành động */}
          <div className="class-action-bar">
            <div className="class-meta">
              {selectedInfo && (
                <>
                  <span className="meta-item">📚 {selectedInfo.tenmonhoc}</span>
                  {selectedInfo.tenhocky && <span className="meta-item">📅 {selectedInfo.tenhocky}</span>}
                  {selectedInfo.tenphong && <span className="meta-item">🏫 {selectedInfo.tenphong}</span>}
                </>
              )}
              <span className={`status-badge ${isLocked ? 'locked' : 'open'}`}>
                {isLocked ? '🔒 Đã khóa' : '✏️ Đang nhập'}
              </span>
            </div>
            <div className="action-buttons-bar">
              {!isLocked && (
                <button className="btn-lock" onClick={handleLock}>🔒 Khóa điểm</button>
              )}
              {isCtsv && isLocked && (
                <button className="btn-unlock" onClick={handleUnlock}>🔓 Mở khóa</button>
              )}
              {isCtsv && (
                <>
                  <button className="btn-import" onClick={() => fileRef.current?.click()} disabled={saving}>
                    📥 Import Excel
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleImportExcel}
                  />
                </>
              )}
            </div>
          </div>

          {/* Kết quả import */}
          {importResult && (
            <div className="import-result">
              <div className="import-summary">
                <span>Tổng: <strong>{importResult.total}</strong></span>
                <span className="success-count">✓ Thành công: <strong>{importResult.success}</strong></span>
                {importResult.errors?.length > 0 && (
                  <span className="error-count">✗ Lỗi: <strong>{importResult.errors.length}</strong></span>
                )}
                <button className="btn-close-import" onClick={() => setImportResult(null)}>✕</button>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="import-errors">
                  <strong>Chi tiết lỗi:</strong>
                  <ul>
                    {importResult.errors.map((e, i) => (
                      <li key={i}>Dòng {e.row} – MSSV {e.mssv}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Bảng điểm */}
          {loading ? (
            <div className="loading-spinner">Đang tải...</div>
          ) : grades.length === 0 ? (
            <div className="empty-state">Chưa có dữ liệu điểm cho lớp này</div>
          ) : (
            <div className="grades-table-wrapper">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Chuyên cần (10%)</th>
                    <th>Giữa kỳ (30%)</th>
                    <th>Cuối kỳ (60%)</th>
                    <th>Tổng kết</th>
                    <th>GPA</th>
                    <th>Xếp loại</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g, idx) => {
                    const e = editMap[g.mabangdiem];
                    const isEditing = !!e;
                    const locked = g.trangthai === 'dakhoa';

                    const cc = isEditing ? e.cc : g.diemchuyencan;
                    const gk = isEditing ? e.gk : g.diemgiuaky;
                    const ck = isEditing ? e.ck : g.diemcuoiky;
                    const tongket = isEditing ? calcTongKet(cc, gk, ck) : (g.diemtongket ?? calcTongKet(cc, gk, ck));
                    const gpa = isEditing ? calcGPA(tongket) : (g.gpa ?? calcGPA(tongket));
                    const xl = xepLoai(tongket);

                    return (
                      <tr key={g.mabangdiem} className={locked ? 'row-locked' : ''}>
                        <td>{idx + 1}</td>
                        <td>{g.mssv}</td>
                        <td>{g.hoten}</td>
                        {['cc', 'gk', 'ck'].map((field, fi) => {
                          const val = isEditing ? e[field] : [g.diemchuyencan, g.diemgiuaky, g.diemcuoiky][fi];
                          return (
                            <td key={field}>
                              {isEditing && !locked ? (
                                <input
                                  type="number"
                                  min="0" max="10" step="0.5"
                                  value={val ?? ''}
                                  onChange={ev => setEditMap(prev => ({
                                    ...prev,
                                    [g.mabangdiem]: { ...prev[g.mabangdiem], [field]: ev.target.value },
                                  }))}
                                  className="grade-input"
                                />
                              ) : (
                                <span>{val !== null && val !== undefined ? val : '–'}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="col-tongket"><strong>{tongket}</strong></td>
                        <td className="col-gpa">{gpa ?? '–'}</td>
                        <td>
                          <span className="xl-badge" style={{ background: MUC_COLOR[xl] || '#95a5a6' }}>
                            {xl}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${locked ? 'locked' : 'open'}`}>
                            {locked ? 'Đã khóa' : 'Đang nhập'}
                          </span>
                        </td>
                        <td className="col-actions">
                          {!locked && (
                            isEditing ? (
                              <>
                                <button className="btn-save-row" onClick={() => handleSave(g)} disabled={saving}>✓</button>
                                <button className="btn-cancel-row" onClick={() => handleCancelEdit(g.mabangdiem)}>✕</button>
                              </>
                            ) : (
                              <button className="btn-edit-row" onClick={() => handleEdit(g)}>✏️</button>
                            )
                          )}
                          <button className="btn-log-row" onClick={() => handleViewLog(g)} title="Xem lịch sử">📋</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal log */}
      {logModal && (
        <div className="modal-overlay" onClick={() => setLogModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>📋 Lịch sử sửa điểm – {logModal.grade.mssv} / {logModal.grade.hoten}</h3>
            {logModal.logs.length === 0 ? (
              <p className="muted">Chưa có lịch sử sửa điểm.</p>
            ) : (
              <table className="log-table">
                <thead>
                  <tr><th>Trường</th><th>Cũ</th><th>Mới</th><th>Người sửa</th><th>Thời gian</th></tr>
                </thead>
                <tbody>
                  {logModal.logs.map((l, i) => (
                    <tr key={i}>
                      <td>{l.loaidiem}</td>
                      <td>{l.giatricu ?? '–'}</td>
                      <td>{l.giatrimoi ?? '–'}</td>
                      <td>{l.nguoisua}</td>
                      <td>{new Date(l.ngaysua).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="btn-close-modal" onClick={() => setLogModal(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGrades;
