import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentActivitiesAPI } from '../api/api';
import { useSocketEvent } from '../context/SocketContext';
import './MyActivities.css';

const MyActivities = () => {
  const { user } = useAuth();
  const mssv = user?.mssv || '';
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await studentActivitiesAPI.getByStudent(mssv);
      setActivities(res.data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mssv) {
      loadActivities();
    } else {
      setLoading(false);
    }
  }, [mssv]);

  // Realtime: tự reload khi hoạt động được duyệt/từ chối
  useSocketEvent('activity_approval', loadActivities);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký?')) {
      return;
    }

    try {
      await studentActivitiesAPI.cancel(id);
      loadActivities();
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể hủy đăng ký');
    }
  };

  const getStatusBadge = (trangthai) => {
    const badges = {
      'dangky': { class: 'badge-warning', text: 'Chờ duyệt' },
      'duocduyet': { class: 'badge-success', text: 'Được duyệt' },
      'tuchoi': { class: 'badge-danger', text: 'Bị từ chối' },
      'hoanthanh': { class: 'badge-info', text: 'Hoàn thành' }
    };
    return badges[trangthai] || badges['dangky'];
  };

  const getRoleBadge = (vaitro) => {
    const roles = {
      'thamgia': 'Tham gia',
      'tochuc': 'Tổ chức',
      'truongnhom': 'Trưởng nhóm'
    };
    return roles[vaitro] || 'Tham gia';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Hoạt Động Của Tôi</h1>
      </div>

      <div className="card">
        {mssv && (
          <div className="mb-3">
            <Link to="/activities" className="btn btn-primary">← Danh sách hoạt động để đăng ký</Link>
          </div>
        )}
        {!mssv && !loading ? (
          <div className="alert alert-warning">
            Không tìm thấy mã sinh viên. Vui lòng đăng nhập lại.
          </div>
        ) : loading ? (
          <div className="spinner"></div>
        ) : activities.length === 0 ? (
          <div className="text-center mt-4">
            <p>Bạn chưa đăng ký hoạt động nào.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên Hoạt Động</th>
                  <th>Loại</th>
                  <th>Vai Trò</th>
                  <th>Trạng Thái</th>
                  <th>Điểm Cộng</th>
                  <th>Ngày Đăng Ký</th>
                  <th>Lý do / Ghi chú</th>
                  <th>STT trong DS duyệt</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  const statusBadge = getStatusBadge(activity.trangthai);
                  let sttApproved = null;
                  if (activity.trangthai === 'duocduyet') {
                    const approved = activities
                      .filter(
                        (a) =>
                          a.mahoatdong === activity.mahoatdong &&
                          a.trangthai === 'duocduyet'
                      )
                      .sort((a, b) => new Date(a.ngayduyet || a.ngaydangky) - new Date(b.ngayduyet || b.ngaydangky));
                    const idx = approved.findIndex((a) => a.mathamgia === activity.mathamgia);
                    sttApproved = idx >= 0 ? idx + 1 : null;
                  }
                  return (
                    <tr key={activity.mathamgia}>
                      <td>{index + 1}</td>
                      <td>{activity.tenhoatdong}</td>
                      <td>{activity.tenloai}</td>
                      <td>{getRoleBadge(activity.vaitro)}</td>
                      <td>
                        <span className={`badge ${statusBadge.class}`}>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td>{activity.diemcong || 0}</td>
                      <td>{formatDate(activity.ngaydangky)}</td>
                      <td>
                        {activity.trangthai === 'tuchoi'
                          ? activity.ghichu || 'Bị từ chối (không có lý do chi tiết)'
                          : activity.ghichu || '—'}
                      </td>
                      <td>{sttApproved || (activity.trangthai === 'duocduyet' ? '-' : '')}</td>
                      <td>
                        {activity.trangthai === 'dangky' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(activity.mathamgia)}
                          >
                            Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyActivities;
