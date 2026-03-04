import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activitiesAPI } from '../api/api';
import './Activities.css';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    trangthai: '',
    maloaihoatdong: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, typesRes] = await Promise.all([
        activitiesAPI.getAll(filters),
        activitiesAPI.getTypes()
      ]);
      setActivities(activitiesRes.data);
      setTypes(typesRes.data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (trangthai) => {
    const badges = {
      'dangmo': { class: 'badge-success', text: 'Đang mở' },
      'dachot': { class: 'badge-info', text: 'Đã chốt' },
      'dangdienra': { class: 'badge-info', text: 'Đang diễn ra' },
      'daketthuc': { class: 'badge-secondary', text: 'Đã kết thúc' },
      'huy': { class: 'badge-danger', text: 'Đã hủy' }
    };
    return badges[trangthai] || badges['dangmo'];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Danh Sách Hoạt Động</h1>
      </div>

      <div className="card">
        <div className="filters">
          <div className="form-group">
            <label className="form-label">Loại hoạt động:</label>
            <select
              className="form-control"
              value={filters.maloaihoatdong}
              onChange={(e) => setFilters({ ...filters, maloaihoatdong: e.target.value })}
            >
              <option value="">Tất cả</option>
              {types.map(type => (
                <option key={type.maloaihoatdong} value={type.maloaihoatdong}>
                  {type.tenloai}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái:</label>
            <select
              className="form-control"
              value={filters.trangthai}
              onChange={(e) => setFilters({ ...filters, trangthai: e.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="dangmo">Đang mở</option>
              <option value="dachot">Đã chốt</option>
              <option value="dangdienra">Đang diễn ra</option>
              <option value="daketthuc">Đã kết thúc</option>
            </select>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center mt-4">
            <p>Không có hoạt động nào.</p>
          </div>
        ) : (
          <div className="activities-grid">
            {activities.map(activity => {
              const statusBadge = getStatusBadge(activity.trangthai);
              return (
                <div key={activity.mahoatdong} className="activity-card">
                  <div className="activity-header">
                    <h3>{activity.tenhoatdong}</h3>
                    <span className={`badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                  <div className="activity-info">
                    <p><strong>Loại:</strong> {activity.tenloai}</p>
                    <p><strong>Thời gian:</strong> {formatDate(activity.ngaybatdau)} - {formatDate(activity.ngayketthuc)}</p>
                    <p><strong>Địa điểm:</strong> {activity.diadiem || 'Chưa cập nhật'}</p>
                    <p><strong>Số lượng:</strong> {activity.soluongdadangky} / {activity.soluongtoida}</p>
                  </div>
                  {activity.mota && (
                    <div className="activity-description">
                      <p>{activity.mota}</p>
                    </div>
                  )}
                  <div className="activity-actions">
                    <Link
                      to={`/activities/${activity.mahoatdong}`}
                      className="btn btn-primary"
                    >
                      Xem Chi Tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
