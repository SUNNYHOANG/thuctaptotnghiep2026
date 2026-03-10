import React, { useState, useEffect } from 'react';
import { thongBaoAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './ThongBao.css';

const ThongBao = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await thongBaoAPI.getAll({ malop: user?.malop });
      const data = res.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thongbao-container">
      <h1>Thông Báo</h1>
      
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">Không có thông báo nào</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div key={notif.mathongbao || notif.id} className="notification-card">
              <div className="notif-header">
                <h3>{notif.tieude}</h3>
                <span className="date">{new Date(notif.ngaytao || notif.tao).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="notif-body">
                <p>{notif.noidung}</p>
              </div>
              {notif.ten_tin_tuc && (
                <div className="notif-meta">
                  <span className="meta-item">📚 {notif.ten_tin_tuc}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThongBao;
