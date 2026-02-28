import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminFeeNotify from '../components/AdminFeeNotify';
import './Dashboard.css';

const AdminFeeNotifications = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>💰 Thông Báo Học Phí Đến Sinh Viên</h1>
        <p className="welcome-text">
          Quản lý và gửi thông báo học phí tới sinh viên
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <AdminFeeNotify />
      </div>
    </div>
  );
};

export default AdminFeeNotifications;
