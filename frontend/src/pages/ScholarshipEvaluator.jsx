import React, { useState, useEffect } from 'react';
import { scholarshipAPI, lookupAPI } from '../api/api';
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
  khoa_da_duyet: 'Chờ duyệt', cho_ctsv_duyet: 'Chờ duyệt', cho_khoa_duyet: 'Chờ duyệt',
  duyet: 'Đã duyệt', tuchoi: 'Từ chối',
};
const TRANG_THAI_COLOR = {
  khoa_da_duyet: '#f39c12', cho_ctsv_duyet: '#f39c12', cho_khoa_duyet: '#f39c12',
  duyet: '#27ae60', tuchoi: '#e74c3c',
};
const PENDING = ['khoa_da_duyet', 'cho_ctsv_duyet', 'cho_khoa_duyet'];

const ScholarshipEvaluator = () => {
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedHK, setSelectedHK] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('xuat_sac');
  const [viewMode, setViewMode] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadHocKy(); }, []);
  useEffect(() => { if (selectedHK) loadResults(); }, [selectedHK]);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

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
      const res = await scholarshipAPI.getResults(selectedHK);
      setResults(res.data);
      const firstTab = MUC_ORDER.find(m => (res.data?.grouped?.[m]?.length || 0) > 0);
      setActiveTab(firstTab || 'xuat_sac');
    } catch (err) {
      if (err.response?.status !== 404) showMsg('error', 'Lỗi tải kết quả: ' + (err.response?.data?.error || err.message));
      setResults(null);
    } finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      setApproving(true);
      await scholarshipAPI.approve(id, { trangthai: 'duyet' });
      showMsg('success', 'Đã duyệt — thông báo đã gửi đến sinh viên');
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally { setApproving(false); }
  };

  const handleApproveAll = async () => {
    const pending = (results?.grouped?.[activeTab] || []).filter(r => PENDING.includes(r.trangthai));
    if (!pending.length) return;
    if (!window.confirm(`Duyệt tất cả ${pending.length} sinh viên?\nThông báo sẽ được gửi đến từng sinh viên.`)) return;
    try {
      setApproving(true);
      for (const r of pending) await scholarshipAPI.approve(r.id, { trangthai: 'duyet' });
      showMsg('success', `Đã duyệt ${pending.length} sinh viên và gửi thông báo`);
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally { setApproving(false); }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) { showMsg('error', 'Vui lòng nhập lý do'); return; }
    try {
      setApproving(true);
      await scholarshipAPI.approve(rejectModal.id, { trangthai: 'tuchoi', ghichu: rejectReason });
      setRejectModal(null);
      showMsg('success', 'Đã từ chối học bổng');
      await loadResults();
    } catch (err) {
      showMsg('error', err.response?.data?.error || err.message);
    } finally { setApproving(false); }
  };

  const handleExport = async () => {
    try {
      const res = await scholarshipAPI.exportExcel(selectedHK);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `hocbong_hk${selectedHK}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { showMsg('error', 'Lỗi xuất Excel: ' + err.message); }
  };

  const allList = results?.list || [];
  const currentList = results?.grouped?.[activeTab] || [];
  const approvedList = allList.filter(r => r.trangthai === 'duyet');
  const pendingCount = allList.filter(r => PENDING.includes(r.trangthai)).length;

  return (
    <div className="se-container">
      <div className="se-header">
        <h1>🎓 Duyệt học bổng cuối</h1>
        <p>CTSV – Kiểm tra GPA, DRL và duyệt học bổng. Sinh viên được duyệt sẽ nhận thông báo tự động.</p>
      </div>

      {msg && <div className={`se-alert se-alert-${msg.type}`}>{msg.text}</div>}

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
          <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
            <button className={`se-btn ${viewMode === 'pending' ? 'se-btn-primary' : 'se-btn-secondary'}`} onClick={() => setViewMode('pending')}>
              Chờ duyệt {pendingCount > 0 && <span style={{ background: '#e74c3c', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{pendingCount}</span>}
            </button>
            <button className={`se-btn ${viewMode === 'summary' ? 'se-btn-primary' : 'se-btn-secondary'}`} onClick={() => setViewMode('summary')}>
              Tổng hợp đã duyệt ({approvedList.length})
            </button>
          </div>
        </div>
        <div className="se-toolbar-right">
          {results && <button className="se-btn se-btn-success" onClick={handleExport}>📥 Xuất Excel</button>}
        </div>
      </div>

      <div className="se-criteria">
        <strong>Tiêu chí:</strong>
        <span className="criteria-item" style={{ background: MUC_COLOR.xuat_sac }}>Xuất sắc: GPA ≥ 3.6 & DRL ≥ 80</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.gioi }}>Giỏi: GPA ≥ 3.2 & DRL ≥ 80</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.kha }}>Khá: GPA ≥ 3.2 & DRL ≥ 65</span>
        <span className="criteria-item" style={{ background: MUC_COLOR.trung_binh }}>Trung bình: GPA ≥ 2.5 & DRL ≥ 50</span>
      </div>

      {loading ? (
        <div className="se-loading">Đang tải kết quả...</div>
      ) : !results ? (
        <div className="se-empty">Chưa có kết quả. Khoa cần chạy xét học bổng trước.</div>
      ) : viewMode === 'summary' ? (
        <>
          <div className="se-summary">
            {MUC_ORDER.map(m => {
              const cnt = approvedList.filter(r => r.mucxeploai === m).length;
              return (
                <div key={m} className="se-sum-card" style={{ borderTop: `4px solid ${MUC_COLOR[m]}` }}>
                  <div className="se-sum-label">{MUC_LABEL[m]}</div>
                  <div className="se-sum-count">{cnt}</div>
                </div>
              );
            })}
            <div className="se-sum-card" style={{ borderTop: '4px solid #27ae60' }}>
              <div className="se-sum-label">Tổng được duyệt</div>
              <div className="se-sum-count">{approvedList.length}</div>
            </div>
          </div>
          <div className="se-table-wrapper">
            <table className="se-table">
              <thead>
                <tr><th>STT</th><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>GPA</th><th>DRL</th><th>Mức học bổng</th><th>Người duyệt</th><th>Ngày duyệt</th></tr>
              </thead>
              <tbody>
                {approvedList.length === 0 ? (
                  <tr><td colSpan={9} className="se-empty-row">Chưa có sinh viên nào được duyệt</td></tr>
                ) : approvedList.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td><td>{r.mssv}</td><td>{r.hoten}</td><td>{r.malop}</td>
                    <td><strong>{r.gpa ?? '–'}</strong></td><td>{r.drl ?? '–'}</td>
                    <td><span className="muc-badge" style={{ background: MUC_COLOR[r.mucxeploai] || '#95a5a6' }}>{MUC_LABEL[r.mucxeploai]}</span></td>
                    <td>{r.nguoiduyet || '–'}</td>
                    <td>{r.ngayduyet ? new Date(r.ngayduyet).toLocaleDateString('vi-VN') : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
              <div className="se-sum-label">Tổng cộng</div>
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

          {currentList.some(r => PENDING.includes(r.trangthai)) && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="se-btn se-btn-primary" onClick={handleApproveAll} disabled={approving}>
                ✓ Duyệt tất cả ({currentList.filter(r => PENDING.includes(r.trangthai)).length})
              </button>
            </div>
          )}

          <div className="se-table-wrapper">
            <table className="se-table">
              <thead>
                <tr><th>STT</th><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>GPA ↓</th><th>DRL</th><th>Mức học bổng</th><th>Trạng thái</th><th>Lý do từ chối</th><th>Hành động</th></tr>
              </thead>
              <tbody>
                {currentList.length === 0 ? (
                  <tr><td colSpan={10} className="se-empty-row">Không có sinh viên</td></tr>
                ) : currentList.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td><td>{r.mssv}</td><td>{r.hoten}</td><td>{r.malop}</td>
                    <td><strong>{r.gpa ?? '–'}</strong></td><td>{r.drl ?? '–'}</td>
                    <td><span className="muc-badge" style={{ background: MUC_COLOR[r.mucxeploai] || '#95a5a6' }}>{MUC_LABEL[r.mucxeploai] || r.mucxeploai}</span></td>
                    <td><span style={{ background: TRANG_THAI_COLOR[r.trangthai] || '#95a5a6', color: 'white', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{TRANG_THAI_LABEL[r.trangthai] || r.trangthai}</span></td>
                    <td className="se-ghichu">{r.ghichu || '–'}</td>
                    <td className="se-actions">
                      {PENDING.includes(r.trangthai) ? (
                        <>
                          <button className="se-btn-approve" onClick={() => handleApprove(r.id)} disabled={approving}>✓ Duyệt</button>
                          <button className="se-btn-reject" onClick={() => { setRejectModal(r); setRejectReason(''); }} disabled={approving}>✕ Từ chối</button>
                        </>
                      ) : (
                        <span className="se-done">{r.trangthai === 'duyet' ? '✓ Đã duyệt' : '✕ Từ chối'}</span>
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
              rows={4} placeholder="Nhập lý do từ chối..." className="se-textarea" />
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

export default ScholarshipEvaluator;
