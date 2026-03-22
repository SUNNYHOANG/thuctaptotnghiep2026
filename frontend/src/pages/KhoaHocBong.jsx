import React, { useState, useEffect } from 'react';
import { scholarshipAPI, lookupAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './ScholarshipEvaluator.css';

const MUC_LABEL = {
  xuat_sac: 'Xuất sắc', gioi: 'Giỏi', kha: 'Khá',
  trung_binh: 'Trung bình', khong_du_dieu_kien: 'Không đủ điều kiện',
};
const MUC_COLOR = {
  xuat_sac: '#27ae60', gioi: '#2980b9', kha: '#f39c12',
  trung_binh: '#e67e22', khong_du_dieu_kien: '#95a5a6',
};
const MUC_ORDER = ['xuat_sac', 'gioi', 'kha', 'trung_binh', 'khong_du_dieu_kien'];
const TRANG_THAI_LABEL = {
  cho_khoa_duyet: 'Chờ duyệt',
  khoa_da_duyet: 'Đã duyệt',
  khoa_tuchoi: 'Từ chối',
};
const TRANG_THAI_COLOR = {
  cho_khoa_duyet: '#f39c12',
  khoa_da_duyet: '#27ae60',
  khoa_tuchoi: '#e74c3c',
};

const KhoaHocBong = () => {
  const { user } = useAuth();
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHK, setSelectedHK] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('xuat_sac');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadHocKy(); }, []);
  useEffect(() => { if (selectedHK) loadResults(); }, [selectedHK]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const loadHocKy = async () => {
    try {
      const res = await lookupAPI.getHocKy();
      const list = res.data || [];
      setHocKyList(list);
      const dangMo = list.find(hk => hk.trangthai === 'dangmo');
      if (dangMo || list[0]) setSelectedHK(String((dangMo || list[0]).mahocky));
    } catch {}
  };

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await scholarshipAPI.getKhoaResults(selectedHK);
      setResults(res.data);
      const firstTab = MUC_ORDER.find(m => (res.data?.grouped?.[m]?.length || 0) > 0);
      setActiveTab(firstTab || 'xuat_sac');
    } catch (err) {
      if (err.response?.status !== 404) showMsg('error', 'Lỗi tải kết quả: ' + (err.response?.data?.error || err.message));
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedHK) return;
    if (!window.confirm('Chạy xét học bổng cho học kỳ này? Kết quả cũ sẽ được cập nhật.')) return;
    try {
      setEvaluating(true);
      const res = await scholarshipAPI.evaluate(selectedHK);
      if (res.data.total === 0) {
        showMsg('error', res.data.message || 'Không có sinh viên nào có điểm đã khóa thuộc khoa này');
      } else {
        showMsg('success', `Đã xét ${res.data.total} sinh viên`);
      }
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setApproving(true);
      await scholarshipAPI.khoaApprove(id, { trangthai: 'khoa_da_duyet' });
      showMsg('success', 'Đã duyệt — chuyển sang CTSV xét duyệt cuối');
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleApproveAll = async () => {
    const pending = (results?.grouped?.[activeTab] || []).filter(r => r.trangthai === 'cho_khoa_duyet');
    if (!pending.length) return;
    if (!window.confirm(`Duyệt tất cả ${pending.length} sinh viên trong mục "${MUC_LABEL[activeTab]}"?`)) return;
    try {
      setApproving(true);
      for (const r of pending) {
        await scholarshipAPI.khoaApprove(r.id, { trangthai: 'khoa_da_duyet' });
      }
      showMsg('success', `Đã duyệt ${pending.length} sinh viên`);
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) { showMsg('error', 'Vui lòng nhập lý do'); return; }
    try {
      setApproving(true);
      await scholarshipAPI.khoaApprove(rejectModal.id, { trangthai: 'khoa_tuchoi', ghichu: rejectReason });
      setRejectModal(null);
      showMsg('success', 'Đã từ chối');
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally {
      setApproving(false);
    }
  };

  const currentList = results?.grouped?.[activeTab] || [];
  const pendingCount = results
    ? Object.values(results.grouped || {}).flat().filter(r => r.trangthai === 'cho_khoa_duyet').length
    : 0;

  return (
    <div className="se-container">
      <div className="se-header">
        <h1>🎓 Xét học bổng — Khoa {user?.makhoa}</h1>
        <p>Xét và duyệt học bổng cho sinh viên thuộc khoa. Sau khi duyệt, CTSV sẽ kiểm tra và duyệt cuối.</p>
      </div>

      {msg && <div className={`se-alert se-alert-${msg.type}`}>{msg.text}</div>}

      {pendingCount > 0 && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '10px 16px', marginBottom: 16, color: '#856404', fontSize: 14 }}>
          Có <strong>{pendingCount}</strong> sinh viên đang chờ khoa duyệt
        </div>
      )}

      <div className="se-criteria">
        <strong>Tiêu chí xét:</strong>
        <span className="criteria-item" style={{ background: MUC_COLOR.xuat_sac }}>Xuất sắc: GPA ≥ 3.6 & DRL ≥ 80</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.gioi }}>Giỏi: GPA ≥ 3.2 & DRL ≥ 80</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.kha }}>Khá: GPA ≥ 3.2 & DRL ≥ 65</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.trung_binh }}>Trung bình: GPA ≥ 2.5 & DRL ≥ 50</span>
      </div>

      <div className="se-toolbar">
        <div className="se-toolbar-left">
          <label>Học kỳ:</label>
          <select value={selectedHK} onChange={e => setSelectedHK(e.target.value)}>
            <option value="">-- Chọn học kỳ --</option>
            {hocKyList.map(hk => (
              <option key={hk.mahocky} value={String(hk.mahocky)}>
                {hk.tenhocky} {hk.namhoc}{hk.trangthai === 'dangmo' ? ' 🟢' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="se-toolbar-right">
          <button className="se-btn se-btn-primary" onClick={handleEvaluate} disabled={!selectedHK || evaluating}>
            {evaluating ? '⏳ Đang xét...' : '⚡ Xét học bổng'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="se-loading">Đang tải...</div>
      ) : !results ? (
        <div className="se-empty">Chưa có kết quả xét học bổng. Nhấn "Xét học bổng" để bắt đầu.</div>
      ) : (
        <>
          <div className="se-summary">
            {MUC_ORDER.map(m => (
              <div key={m} className="se-sum-card" style={{ borderTop: `4px solid ${MUC_COLOR[m]}` }}>
                <div className="se-sum-label">{MUC_LABEL[m]}</div>
                <div className="se-sum-count">{results.grouped?.[m]?.length || 0}</div>
              </div>
            ))}
            <div className="se-sum-card" style={{ borderTop: '4px solid #2c3e50' }}>
              <div className="se-sum-label">Tổng</div>
              <div className="se-sum-count">{results.total}</div>
            </div>
          </div>

          <div className="se-tabs">
            {MUC_ORDER.filter(m => (results.grouped?.[m]?.length || 0) > 0).map(m => (
              <button key={m} className={`se-tab ${activeTab === m ? 'active' : ''}`}
                style={activeTab === m ? { borderBottom: `3px solid ${MUC_COLOR[m]}`, color: MUC_COLOR[m] } : {}}
                onClick={() => setActiveTab(m)}>
                {MUC_LABEL[m]} ({results.grouped[m].length})
              </button>
            ))}
          </div>

          {currentList.some(r => r.trangthai === 'cho_khoa_duyet') && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="se-btn se-btn-primary" onClick={handleApproveAll} disabled={approving}>
                ✓ Duyệt tất cả ({currentList.filter(r => r.trangthai === 'cho_khoa_duyet').length})
              </button>
            </div>
          )}

          <div className="se-table-wrapper">
            <table className="se-table">
              <thead>
                <tr>
                  <th>STT</th><th>MSSV</th><th>Họ tên</th><th>Lớp</th>
                  <th>GPA ↓</th><th>DRL</th><th>Mức học bổng</th>
                  <th>Trạng thái</th><th>Ghi chú</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentList.length === 0 ? (
                  <tr><td colSpan={10} className="se-empty-row">Không có sinh viên</td></tr>
                ) : currentList.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.mssv}</td>
                    <td>{r.hoten}</td>
                    <td>{r.malop}</td>
                    <td><strong>{r.gpa ?? '–'}</strong></td>
                    <td>{r.drl ?? '–'}</td>
                    <td>
                      <span className="muc-badge" style={{ background: MUC_COLOR[r.mucxeploai] || '#95a5a6' }}>
                        {MUC_LABEL[r.mucxeploai] || r.mucxeploai}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: TRANG_THAI_COLOR[r.trangthai] || '#95a5a6', color: 'white', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>
                        {TRANG_THAI_LABEL[r.trangthai] || r.trangthai}
                      </span>
                    </td>
                    <td className="se-ghichu">{r.ghichu_khoa || '–'}</td>
                    <td className="se-actions">
                      {r.trangthai === 'cho_khoa_duyet' ? (
                        <>
                          <button className="se-btn-approve" onClick={() => handleApprove(r.id)} disabled={approving}>✓ Duyệt</button>
                          <button className="se-btn-reject" onClick={() => { setRejectModal(r); setRejectReason(''); }} disabled={approving}>✕ Từ chối</button>
                        </>
                      ) : (
                        <span className="se-done">{r.trangthai === 'khoa_da_duyet' ? 'Đã duyệt' : 'Đã từ chối'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rejectModal && (
        <div className="se-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="se-modal" onClick={e => e.stopPropagation()}>
            <h3>Từ chối học bổng</h3>
            <p>Sinh viên: <strong>{rejectModal.hoten}</strong> ({rejectModal.mssv})</p>
            <label>Lý do từ chối <span style={{ color: 'red' }}>*</span></label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={4} placeholder="Nhập lý do..." className="se-textarea" />
            <div className="se-modal-actions">
              <button className="se-btn se-btn-danger" onClick={handleRejectConfirm} disabled={approving}>Xác nhận từ chối</button>
              <button className="se-btn se-btn-secondary" onClick={() => setRejectModal(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhoaHocBong;
