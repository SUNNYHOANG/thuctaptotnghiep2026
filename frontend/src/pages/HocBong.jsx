import React, { useState, useEffect } from 'react';
import { hocBongAPI, scholarshipAPI, lookupAPI } from '../api/api';
import './HocBong.css';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const MUC_LABEL = {
  xuat_sac: 'Xuất sắc',
  gioi: 'Giỏi',
  kha: 'Khá',
  trung_binh: 'Trung bình',
  khong_du_dieu_kien: 'Không đủ điều kiện',
};

const MUC_COLOR = {
  xuat_sac: '#27ae60',
  gioi: '#2980b9',
  kha: '#f39c12',
  trung_binh: '#e67e22',
  khong_du_dieu_kien: '#95a5a6',
};

const HocBong = () => {
  const user = getUser();
  const isSinhVien = user.role === 'sinhvien';

  const [tab, setTab] = useState('danh_sach'); // 'danh_sach' | 'ket_qua'
  const [scholarships, setScholarships] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHK, setSelectedHK] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [recipients, setRecipients] = useState({});

  useEffect(() => {
    loadHocKy();
    loadScholarships();
    if (isSinhVien) loadMyResults();
  }, []);

  useEffect(() => {
    if (isSinhVien && selectedHK) loadMyResults(selectedHK);
  }, [selectedHK]);

  const loadHocKy = async () => {
    try {
      const res = await lookupAPI.getHocKy();
      setHocKyList(res.data || []);
      if (res.data?.length > 0) setSelectedHK(String(res.data[0].mahocky));
    } catch {}
  };

  const loadScholarships = async () => {
    try {
      setLoading(true);
      const res = await hocBongAPI.getAll();
      setScholarships(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyResults = async (mahocky = null) => {
    try {
      const res = await scholarshipAPI.getMy(mahocky);
      setMyResults(res.data || []);
    } catch {
      setMyResults([]);
    }
  };

  const loadRecipients = async (id) => {
    if (recipients[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    try {
      const res = await hocBongAPI.getRecipients(id);
      setRecipients(prev => ({ ...prev, [id]: res.data || [] }));
      setExpandedId(id);
    } catch {
      setRecipients(prev => ({ ...prev, [id]: [] }));
      setExpandedId(id);
    }
  };

  const getStatusLabel = (status) => {
    const map = { mo: '📋 Mở', dong: '🔒 Đóng', het: '❌ Hết' };
    return map[status] || status;
  };

  return (
    <div className="hocbong-container">
      <div className="hocbong-header">
        <h1>🎓 Học Bổng</h1>
        {isSinhVien && (
          <div className="hb-tabs">
            <button
              className={`hb-tab ${tab === 'danh_sach' ? 'active' : ''}`}
              onClick={() => setTab('danh_sach')}
            >
              Danh sách học bổng
            </button>
            <button
              className={`hb-tab ${tab === 'ket_qua' ? 'active' : ''}`}
              onClick={() => setTab('ket_qua')}
            >
              Kết quả xét học bổng
            </button>
          </div>
        )}
      </div>

      {/* Tab: Danh sách học bổng */}
      {tab === 'danh_sach' && (
        <>
          {loading ? (
            <div className="hb-loading">Đang tải...</div>
          ) : scholarships.length === 0 ? (
            <div className="hb-empty">Không có học bổng nào</div>
          ) : (
            <div className="hb-grid">
              {scholarships.map(s => (
                <div key={s.mahocbong} className="hb-card">
                  <div className="hb-card-header">
                    <h3>{s.tenhocbong}</h3>
                    <span className="hb-status">{getStatusLabel(s.trangthai)}</span>
                  </div>
                  <div className="hb-card-body">
                    <div className="hb-info-row">
                      <span className="hb-label">Giá trị:</span>
                      <span className="hb-value">{s.giatri?.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="hb-info-row">
                      <span className="hb-label">Số lượng:</span>
                      <span className="hb-value">{s.soluong}</span>
                    </div>
                    <div className="hb-info-row">
                      <span className="hb-label">Hạn chót:</span>
                      <span className="hb-value">
                        {s.hanchot ? new Date(s.hanchot).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </span>
                    </div>
                    <div className="hb-info-row">
                      <span className="hb-label">Học kỳ:</span>
                      <span className="hb-value">{s.tenhocky || '–'}</span>
                    </div>
                    {s.dieukien && (
                      <div className="hb-info-row">
                        <span className="hb-label">Điều kiện:</span>
                        <span className="hb-value">{s.dieukien}</span>
                      </div>
                    )}
                    <div className="hb-info-row">
                      <span className="hb-label">Đã nhận:</span>
                      <span className="hb-value">{s.soluong_nhan || 0} suất</span>
                    </div>
                    <button
                      className="hb-toggle-btn"
                      onClick={() => loadRecipients(s.mahocbong)}
                    >
                      {expandedId === s.mahocbong ? 'Ẩn danh sách' : 'Xem sinh viên đã nhận'}
                    </button>
                    {expandedId === s.mahocbong && (
                      <div className="hb-recipients">
                        {(recipients[s.mahocbong] || []).length === 0 ? (
                          <p className="hb-muted">Chưa có sinh viên nào được duyệt.</p>
                        ) : (
                          <ul>
                            {(recipients[s.mahocbong] || []).map(r => (
                              <li key={r.mssv}>{r.mssv} – {r.hoten}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Kết quả xét học bổng (chỉ sinh viên) */}
      {tab === 'ket_qua' && isSinhVien && (
        <div className="hb-results">
          <div className="hb-results-filter">
            <label>Học kỳ:</label>
            <select value={selectedHK} onChange={e => setSelectedHK(e.target.value)}>
              <option value="">Tất cả học kỳ</option>
              {hocKyList.map(hk => (
                <option key={hk.mahocky} value={String(hk.mahocky)}>
                  {hk.tenhocky} {hk.namhoc}
                </option>
              ))}
            </select>
          </div>

          {myResults.length === 0 ? (
            <div className="hb-empty">Chưa có kết quả xét học bổng nào.</div>
          ) : (
            <div className="hb-results-list">
              {myResults.map(r => (
                <div key={r.id || r.mahocbong} className={`hb-result-card hb-result-${r.trangthai}`}>
                  <div className="hb-result-top">
                    <div>
                      <div className="hb-result-name">{r.tenhocbong}</div>
                      <div className="hb-result-hk">{r.tenhocky} {r.namhoc}</div>
                    </div>
                    <div className="hb-result-badges">
                      {r.mucxeploai && (
                        <span
                          className="muc-badge"
                          style={{ background: MUC_COLOR[r.mucxeploai] || '#95a5a6' }}
                        >
                          {MUC_LABEL[r.mucxeploai] || r.mucxeploai}
                        </span>
                      )}
                      <span className={`tt-badge tt-${r.trangthai}`}>
                        {r.trangthai === 'duyet' ? '✓ Đã duyệt'
                          : r.trangthai === 'tuchoi' ? '✕ Từ chối'
                          : '⏳ Chờ duyệt'}
                      </span>
                    </div>
                  </div>
                  {r.trangthai === 'tuchoi' && r.ghichu && (
                    <div className="hb-reject-reason">
                      <strong>Lý do từ chối:</strong> {r.ghichu}
                    </div>
                  )}
                  {r.trangthai === 'duyet' && r.giatri > 0 && (
                    <div className="hb-reward">
                      💰 Giá trị: <strong>{r.giatri?.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HocBong;
