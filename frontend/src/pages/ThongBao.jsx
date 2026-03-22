import React, { useState, useEffect } from 'react';
import { thongBaoAPI } from '../api/api';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import './ThongBao.css';

const ThongBao = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [publicRes, reminderRes] = await Promise.all([
        thongBaoAPI.getAll({ malop: user?.malop }),
        user?.mssv ? api.get('/thongbao/my-reminders') : Promise.resolve({ data: { data: [] } }),
      ]);
      const publicData = Array.isArray(publicRes.data) ? publicRes.data : [];
      const reminderData = reminderRes.data?.data || [];
      const merged = [...publicData, ...reminderData]
        .filter((v, i, arr) => arr.findIndex(x => x.mathongbao === v.mathongbao) === i)
        .sort((a, b) => new Date(b.ngaytao) - new Date(a.ngaytao));
      setNotifications(merged);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Realtime: thông báo mới hoặc nhắc nhở → tự reload
  useSocketEvent('thongbao:new', loadNotifications);

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
