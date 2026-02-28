import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { activitiesAPI, studentActivitiesAPI } from '../api/api';
import './ActivityDetail.css';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mssv = user?.mssv || '';
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const res = await activitiesAPI.getById(id);
      setActivity(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể tải thông tin hoạt động' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!mssv) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập với tài khoản sinh viên để đăng ký' });
      return;
    }

    try {
      setRegistering(true);
      await studentActivitiesAPI.register({
        mahoatdong: id,
        mssv: mssv,
        vaitro: 'thamgia'
      });
      setMessage({ type: 'success', text: 'Đăng ký thành công! Vui lòng chờ duyệt.' });
      setTimeout(() => {
        navigate('/hoat-dong-cua-toi');
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Đăng ký thất bại' 
      });
    } finally {
      setRegistering(false);
    }
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

  if (!activity) {
    return (
      <div className="container">
        <div className="alert alert-error">Không tìm thấy hoạt động</div>
      </div>
    );
  }

  const canRegister = activity.trangthai === 'dangmo' && 
                     activity.soluongdadangky < activity.soluongtoida;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary mb-3">
        ← Quay lại
      </button>

      <div className="card">
        <div className="activity-detail-header">
          <h1>{activity.tenhoatdong}</h1>
          <span className={`badge badge-${activity.trangthai === 'dangmo' ? 'success' : 'secondary'}`}>
            {activity.trangthai === 'dangmo' ? 'Đang mở đăng ký' : 'Đã đóng'}
          </span>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <div className="activity-detail-content">
          <div className="detail-section">
            <h3>Thông Tin Chung</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Loại hoạt động:</strong>
                <span>{activity.tenloai}</span>
              </div>
              <div className="detail-item">
                <strong>Thời gian bắt đầu:</strong>
                <span>{formatDate(activity.ngaybatdau)}</span>
              </div>
              <div className="detail-item">
                <strong>Thời gian kết thúc:</strong>
                <span>{formatDate(activity.ngayketthuc)}</span>
              </div>
              <div className="detail-item">
                <strong>Địa điểm:</strong>
                <span>{activity.diadiem || 'Chưa cập nhật'}</span>
              </div>
              <div className="detail-item">
                <strong>Số lượng đăng ký:</strong>
                <span>{activity.soluongdadangky} / {activity.soluongtoida}</span>
              </div>
            </div>
          </div>

          {activity.mota && (
            <div className="detail-section">
              <h3>Mô Tả</h3>
              <p className="description-text">{activity.mota}</p>
            </div>
          )}

          {canRegister && (
            <div className="detail-section register-section">
              <h3>Đăng Ký Tham Gia</h3>
              {mssv ? (
                <div className="register-form">
                  <p className="mb-2">Đăng ký với tài khoản: <strong>{mssv}</strong></p>
                  <button
                    className="btn btn-primary"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? 'Đang đăng ký...' : 'Đăng Ký Tham Gia'}
                  </button>
                </div>
              ) : (
                <div className="alert alert-warning">
                  Vui lòng đăng nhập với tài khoản sinh viên để đăng ký tham gia.
                </div>
              )}
            </div>
          )}

          {!canRegister && activity.trangthai === 'dangmo' && (
            <div className="alert alert-error">
              Hoạt động đã đủ số lượng đăng ký
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;
