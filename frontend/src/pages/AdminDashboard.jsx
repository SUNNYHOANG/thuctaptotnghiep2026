import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPIEndpoints } from '../api/adminAPI';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch admin stats
      const statsRes = await fetch('http://localhost:5001/api/lookup/admin-stats');
      const statsData = await statsRes.json();
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalStudents: statsData.totalStudents || 0,
        totalTeachers: statsData.totalTeachers || 0,
        totalCourses: statsData.totalCourses || 0,
        totalEnrollments: statsData.totalEnrollments || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const adminMenuItems = [
    { id: 1, name: 'Quản lý người dùng', icon: '👥', path: '/admin/users', color: '#3498db' },
    { id: 2, name: 'Quản lý môn học', icon: '📚', path: '/admin/courses', color: '#e74c3c' },
    { id: 3, name: 'Quản lý hoạt động', icon: '🎯', path: '/admin/activities', color: '#f39c12' },
    { id: 4, name: 'Quản lý điểm rèn luyện', icon: '📊', path: '/admin/scores', color: '#16a085' },
    { id: 5, name: 'Quản lý học bổng', icon: '🏆', path: '/admin/scholarships', color: '#8e44ad' },
    { id: 6, name: 'Quản lý khen thưởng', icon: '⭐', path: '/admin/rewards', color: '#2980b9' },
    { id: 7, name: 'Quản lý dịch vụ', icon: '🛠️', path: '/admin/services', color: '#c0392b' },
    { id: 8, name: 'Thông báo học phí', icon: '💰', path: '/admin/fee-notifications', color: '#16a085' },
    { id: 9, name: 'Lịch sử điểm danh (khuôn mặt)', icon: '📸', path: '/admin/attendance', color: '#9b59b6' },
    { id: 10, name: 'Báo cáo & thống kê', icon: '📈', path: '/admin/reports', color: '#27ae60' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🔐 Bảng Điều Khiển Quản Trị</h1>
        <p className="welcome-text">
          Xin chào, <strong>{user?.hoten || user?.username}</strong>
        </p>
      </div>

      {/* Admin Info Card */}
      <div className="admin-info-card card">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Tên đăng nhập:</span>
            <span className="info-value">{user?.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Họ và tên:</span>
            <span className="info-value">{user?.hoten}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Vai trò:</span>
            <span className="badge badge-admin">Quản Trị Viên</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Tổng Người Dùng</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>Sinh Viên</h3>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Giảng Viên</h3>
            <p className="stat-number">{stats.totalTeachers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Môn Học</h3>
            <p className="stat-number">{stats.totalCourses}</p>
          </div>
        </div>
      </div>

      {/* Admin Menu Grid */}
      <div className="admin-menu-section">
        <h2>Chức Năng Quản Trị</h2>
        <div className="admin-menu-grid">
          {adminMenuItems.map(item => (
            <div
              key={item.id}
              className="admin-menu-item"
              style={{ borderTopColor: item.color }}
              onClick={() => navigate(item.path)}
            >
              <div className="menu-icon" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                {item.icon}
              </div>
              <div className="menu-content">
                <h3>{item.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section card">
        <h2>Hành Động Nhanh</h2>
        <div className="actions-grid">
          <button className="action-btn btn-primary">➕ Thêm Người Dùng</button>
          <button className="action-btn btn-success">📝 Xem Báo Cáo</button>
          <button className="action-btn btn-info">⚙️ Cấu Hình Hệ Thống</button>
          <button className="action-btn btn-warning">🔄 Sao Lưu Dữ Liệu</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
