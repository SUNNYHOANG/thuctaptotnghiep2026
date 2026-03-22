import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentActivitiesAPI, activitiesAPI } from '../api/api';
import { useSocketEvent } from '../context/SocketContext';
import './CTSVPhucKhao.css';

const CTSVhoatDong = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [closedActivities, setClosedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadPending();
    loadClosedActivities();
  }, []);

  // Realtime: tự reload khi có đăng ký hoạt động mới
  useSocketEvent('activity_approval', () => { loadPending(); loadClosedActivities(); });

  const loadClosedActivities = async () => {
    try {
      const res = await activitiesAPI.getAll({ trangthai: 'dachot' });
      setClosedActivities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setClosedActivities([]);
    }
  };

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await studentActivitiesAPI.getPendingForCTSV();
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    try {
      setProcessing(item.mathamgia);
      await studentActivitiesAPI.approve(item.mathamgia, {
        nguoiduyet: user?.username || user?.id,
        diemcong: 0
      });
      await loadPending();
      await loadClosedActivities();
    } catch (err) {
      alert(err.response?.data?.error || 'Duyệt thất bại');
    } finally {
      setProcessing(null);
    }
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
      await loadClosedActivities();
    } catch (err) {
      alert(err.response?.data?.error || 'Từ chối thất bại');
    } finally {
      setProcessing(null);
    }
  };

  const handleExport = async (mahoatdong, tenhoatdong) => {
    try {
      const res = await studentActivitiesAPI.exportApprovedList(mahoatdong);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_sach_dang_ky_thanh_cong_${(tenhoatdong || mahoatdong).replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Tải file thất bại');
    }
  };

  // Nhóm theo hoạt động
  const byActivity = pending.reduce((acc, item) => {
    const key = item.mahoatdong;
    if (!acc[key]) {
      acc[key] = {
        tenhoatdong: item.tenhoatdong,
        tenloai: item.tenloai,
        soluongtoida: item.soluongtoida,
        soluongdadangky: item.soluongdadangky,
        hd_trangthai: item.hd_trangthai,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('vi-VN');
  };

  const getTrangThaiLabel = (s) => {
    const m = { dangmo: 'Đang mở', dachot: 'Đã chốt', dangdienra: 'Đang diễn ra', daketthuc: 'Đã kết thúc', huy: 'Đã hủy' };
    return m[s] || s;
  };

  return (
    <div className="page-card ctsv-phuckhao">
      <h1>Duyệt đăng ký hoạt động</h1>
      <p className="page-desc">
        Sinh viên gửi yêu cầu đăng ký tham gia hoạt động. CTSV duyệt hoặc từ chối từng yêu cầu.
        Khi đủ số lượng, hệ thống tự chốt và công bố danh sách. Mỗi sinh viên chỉ đăng ký 1 lần/hoạt động.
      </p>

      <div className="filter-row">
        <button type="button" className="btn-refresh" onClick={loadPending}>
          Tải lại
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : pending.length === 0 ? (
        <div className="empty-state">Không có yêu cầu đăng ký nào chờ duyệt.</div>
      ) : (
        <div className="ctsv-hoatdong-groups">
          {Object.entries(byActivity).map(([mahoatdong, group]) => (
            <div key={mahoatdong} className="ctsv-hoatdong-group">
              <div className="ctsv-hoatdong-group-header">
                <h3>{group.tenhoatdong}</h3>
                <span className="badge">{group.tenloai}</span>
                <span className="ctsv-hoatdong-meta">
                  {group.soluongdadangky} / {group.soluongtoida} | {getTrangThaiLabel(group.hd_trangthai)}
                </span>
                {group.hd_trangthai === 'dachot' && (
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={() => handleExport(mahoatdong, group.tenhoatdong)}
                  >
                    Tải file danh sách đăng ký thành công
                  </button>
                )}
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Lớp</th>
                      <th>Ngày đăng ký</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => (
                      <tr key={item.mathamgia}>
                        <td>{idx + 1}</td>
                        <td>{item.mssv}</td>
                        <td>{item.hoten}</td>
                        <td>{item.malop}</td>
                        <td>{formatDate(item.ngaydangky)}</td>
                        <td>
                          {group.hd_trangthai !== 'dachot' && group.soluongdadangky < group.soluongtoida && (
                            <>
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => handleApprove(item)}
                                disabled={processing === item.mathamgia}
                              >
                                {processing === item.mathamgia ? '...' : 'Duyệt'}
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleReject(item)}
                                disabled={processing === item.mathamgia}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {group.hd_trangthai === 'dachot' && (
                            <span className="status-chapnhan">Đã chốt</span>
                          )}
                          {group.hd_trangthai !== 'dachot' && group.soluongdadangky >= group.soluongtoida && (
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

      <div className="mt-4 ctsv-hoatdong-export-section">
        <h4>Hoạt động đã chốt – Xuất file danh sách đăng ký thành công</h4>
        <p className="text-muted mb-3">
          Các hoạt động đã đủ số lượng được chốt tự động. Bấm để tải file CSV danh sách sinh viên đăng ký thành công.
        </p>
        {closedActivities.length === 0 ? (
          <p className="empty-state">Chưa có hoạt động nào đã chốt.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {closedActivities.map((a) => (
              <button
                key={a.mahoatdong}
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleExport(a.mahoatdong, a.tenhoatdong)}
              >
                📥 {a.tenhoatdong} ({a.soluongdadangky}/{a.soluongtoida})
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CTSVhoatDong;
