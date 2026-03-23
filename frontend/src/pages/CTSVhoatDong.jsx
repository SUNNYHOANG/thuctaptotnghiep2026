import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentActivitiesAPI, activitiesAPI } from '../api/api';
import { useSocketEvent } from '../context/SocketContext';
import './CTSVPhucKhao.css';

const CTSVhoatDong = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved'
  const [pending, setPending] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]); // hoạt động đã có SV được duyệt
  const [selectedActivity, setSelectedActivity] = useState(null); // hoạt động đang xem chi tiết
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [closingId, setClosingId] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentActivitiesAPI.getPendingForCTSV();
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch { setPending([]); }
    finally { setLoading(false); }
  }, []);

  const loadApprovedActivities = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy tất cả hoạt động không bị hủy
      const res = await activitiesAPI.getAll();
      const all = Array.isArray(res.data) ? res.data : [];
      // Chỉ hiển thị hoạt động có ít nhất 1 SV đã duyệt (soluongdadangky > 0)
      setApprovedActivities(all.filter(a => a.trangthai !== 'huy' && a.soluongdadangky > 0));
    } catch { setApprovedActivities([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'pending') loadPending();
    else loadApprovedActivities();
  }, [tab]);

  useSocketEvent('activity_approval', () => {
    if (tab === 'pending') loadPending();
    else loadApprovedActivities();
  });

  const handleSelectActivity = async (activity) => {
    setSelectedActivity(activity);
    setLoadingStudents(true);
    try {
      const res = await studentActivitiesAPI.getApprovedByActivity(activity.mahoatdong);
      setApprovedStudents(Array.isArray(res.data) ? res.data : []);
    } catch { setApprovedStudents([]); }
    finally { setLoadingStudents(false); }
  };

  const handleApprove = async (item) => {
    try {
      setProcessing(item.mathamgia);
      await studentActivitiesAPI.approve(item.mathamgia, {
        nguoiduyet: user?.username || user?.id,
        diemcong: 0
      });
      await loadPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Duyệt thất bại');
    } finally { setProcessing(null); }
  };

  const handleReject = async (item) => {
    const ghichu = window.prompt('Lý do từ chối (tùy chọn):', '');
    if (ghichu === null) return;
    try {
      setProcessing(item.mathamgia);
      await studentActivitiesAPI.reject(item.mathamgia, {
        nguoiduyet: user?.username || user?.id,
        ghichu: ghichu || null
      });
      await loadPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Từ chối thất bại');
    } finally { setProcessing(null); }
  };

  const handleClose = async (activity) => {
    if (!window.confirm(`Đóng hoạt động "${activity.tenhoatdong}"? Sinh viên sẽ không thể đăng ký thêm.`)) return;
    try {
      setClosingId(activity.mahoatdong);
      await studentActivitiesAPI.closeActivity(activity.mahoatdong);
      await loadApprovedActivities();
      if (selectedActivity?.mahoatdong === activity.mahoatdong) {
        setSelectedActivity(prev => ({ ...prev, trangthai: 'dachot' }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Đóng hoạt động thất bại');
    } finally { setClosingId(null); }
  };

  const handleExport = async (mahoatdong, tenhoatdong) => {
    try {
      const res = await studentActivitiesAPI.exportApprovedList(mahoatdong);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_sach_${(tenhoatdong || mahoatdong).replace(/\s+/g, '_')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Tải file thất bại');
    }
  };

  // Nhóm pending theo hoạt động
  const byActivity = pending.reduce((acc, item) => {
    const key = item.mahoatdong;
    if (!acc[key]) acc[key] = {
      tenhoatdong: item.tenhoatdong, tenloai: item.tenloai,
      soluongtoida: item.soluongtoida, soluongdadangky: item.soluongdadangky,
      hd_trangthai: item.hd_trangthai, items: []
    };
    acc[key].items.push(item);
    return acc;
  }, {});

  const fmt = (d) => d ? new Date(d).toLocaleString('vi-VN') : '-';
  const trangThaiLabel = { dangmo: 'Đang mở', dachot: 'Đã chốt', dangdienra: 'Đang diễn ra', daketthuc: 'Đã kết thúc', huy: 'Đã hủy' };

  return (
    <div className="page-card ctsv-phuckhao">
      <h1>Duyệt đăng ký hoạt động</h1>
      <p className="page-desc">
        Duyệt yêu cầu đăng ký của sinh viên, xem danh sách đã tham gia, đóng hoạt động và xuất file.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e9ecef' }}>
        {[
          { key: 'pending', label: `Chờ duyệt${pending.length > 0 ? ` (${pending.length})` : ''}` },
          { key: 'approved', label: 'Đã duyệt' },
        ].map(t => (
          <button key={t.key} type="button"
            onClick={() => { setTab(t.key); setSelectedActivity(null); }}
            style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer', fontWeight: 600,
              borderBottom: tab === t.key ? '2px solid #3498db' : '2px solid transparent',
              color: tab === t.key ? '#3498db' : '#666',
              background: 'none', marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Chờ duyệt */}
      {tab === 'pending' && (
        <>
          <div className="filter-row">
            <button type="button" className="btn-refresh" onClick={loadPending}>Tải lại</button>
          </div>
          {loading ? <div className="loading">Đang tải...</div>
            : pending.length === 0 ? <div className="empty-state">Không có yêu cầu nào chờ duyệt.</div>
            : (
              <div className="ctsv-hoatdong-groups">
                {Object.entries(byActivity).map(([mahoatdong, group]) => (
                  <div key={mahoatdong} className="ctsv-hoatdong-group">
                    <div className="ctsv-hoatdong-group-header">
                      <h3>{group.tenhoatdong}</h3>
                      <span className="badge">{group.tenloai}</span>
                      <span className="ctsv-hoatdong-meta">
                        {group.soluongdadangky} / {group.soluongtoida} | {trangThaiLabel[group.hd_trangthai] || group.hd_trangthai}
                      </span>
                    </div>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr><th>STT</th><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Ngày đăng ký</th><th>Hành động</th></tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, idx) => (
                            <tr key={item.mathamgia}>
                              <td>{idx + 1}</td>
                              <td>{item.mssv}</td>
                              <td>{item.hoten}</td>
                              <td>{item.malop}</td>
                              <td>{fmt(item.ngaydangky)}</td>
                              <td>
                                {group.hd_trangthai !== 'dachot' && group.soluongdadangky < group.soluongtoida ? (
                                  <>
                                    <button type="button" className="btn-approve"
                                      onClick={() => handleApprove(item)}
                                      disabled={processing === item.mathamgia}>
                                      {processing === item.mathamgia ? '...' : 'Duyệt'}
                                    </button>
                                    <button type="button" className="btn-reject"
                                      onClick={() => handleReject(item)}
                                      disabled={processing === item.mathamgia}>
                                      Từ chối
                                    </button>
                                  </>
                                ) : group.hd_trangthai === 'dachot' ? (
                                  <span className="status-chapnhan">Đã chốt</span>
                                ) : (
                                  <span className="status-badge">Đã đủ SL</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* Tab: Đã duyệt */}
      {tab === 'approved' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedActivity ? '280px 1fr' : '1fr', gap: 16 }}>
          {/* Danh sách hoạt động */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 14 }}>Danh sách hoạt động</strong>
              <button type="button" className="btn-refresh" style={{ fontSize: 12, padding: '4px 10px' }} onClick={loadApprovedActivities}>Tải lại</button>
            </div>
            {loading ? <div className="loading">Đang tải...</div>
              : approvedActivities.length === 0 ? <div className="empty-state">Chưa có hoạt động nào.</div>
              : approvedActivities.map(a => (
                <div key={a.mahoatdong}
                  onClick={() => handleSelectActivity(a)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                    border: selectedActivity?.mahoatdong === a.mahoatdong ? '2px solid #3498db' : '1px solid #e0e0e0',
                    background: selectedActivity?.mahoatdong === a.mahoatdong ? '#eff6ff' : '#fff',
                  }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.tenhoatdong}</div>
                  <div style={{ fontSize: 12, color: '#666', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>👥 {a.soluongdadangky}/{a.soluongtoida}</span>
                    <span style={{
                      padding: '1px 8px', borderRadius: 10, fontSize: 11,
                      background: a.trangthai === 'dachot' ? '#d5f5e3' : '#fff3cd',
                      color: a.trangthai === 'dachot' ? '#27ae60' : '#f39c12',
                    }}>
                      {trangThaiLabel[a.trangthai] || a.trangthai}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Chi tiết hoạt động đã chọn */}
          {selectedActivity && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedActivity.tenhoatdong}</h3>
                  <span style={{ fontSize: 13, color: '#666' }}>
                    {selectedActivity.soluongdadangky}/{selectedActivity.soluongtoida} sinh viên đã đăng ký thành công
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button"
                    onClick={() => handleExport(selectedActivity.mahoatdong, selectedActivity.tenhoatdong)}
                    style={{ padding: '6px 14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    📥 Xuất file Excel
                  </button>
                  {selectedActivity.trangthai !== 'dachot' && (
                    <button type="button"
                      onClick={() => handleClose(selectedActivity)}
                      disabled={closingId === selectedActivity.mahoatdong}
                      style={{ padding: '6px 14px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                      {closingId === selectedActivity.mahoatdong ? '...' : '🔒 Đóng hoạt động'}
                    </button>
                  )}
                  {selectedActivity.trangthai === 'dachot' && (
                    <span style={{ padding: '6px 14px', background: '#d5f5e3', color: '#27ae60', borderRadius: 6, fontSize: 13 }}>
                      ✅ Đã chốt
                    </span>
                  )}
                </div>
              </div>

              {loadingStudents ? <div className="loading">Đang tải danh sách...</div>
                : approvedStudents.length === 0 ? (
                  <div className="empty-state">Chưa có sinh viên nào được duyệt.</div>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr><th>STT</th><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Vai trò</th><th>Ngày đăng ký</th><th>Ngày duyệt</th></tr>
                      </thead>
                      <tbody>
                        {approvedStudents.map((s, idx) => (
                          <tr key={s.mathamgia}>
                            <td>{idx + 1}</td>
                            <td>{s.mssv}</td>
                            <td>{s.hoten}</td>
                            <td>{s.malop}</td>
                            <td>{s.vaitro === 'tochuc' ? 'Tổ chức' : s.vaitro === 'truongnhom' ? 'Trưởng nhóm' : 'Tham gia'}</td>
                            <td style={{ fontSize: 12 }}>{fmt(s.ngaydangky)}</td>
                            <td style={{ fontSize: 12 }}>{fmt(s.ngayduyet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {!selectedActivity && !loading && approvedActivities.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
              ← Chọn một hoạt động để xem chi tiết
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CTSVhoatDong;
