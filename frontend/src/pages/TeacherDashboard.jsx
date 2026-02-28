import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalGrades: 0,
    pendingApprovals: 0
  });

  const teacherMenuItems = [
    { id: 1, name: 'Lớp Học Phần Của Tôi', icon: '📚', path: '/teacher/classes', color: '#3498db' },
    { id: 2, name: 'Danh Sách Sinh Viên', icon: '👥', path: '/teacher/students', color: '#e74c3c' },
    { id: 3, name: 'Quản Lý Điểm', icon: '📊', path: '/teacher/grades', color: '#f39c12' },
    { id: 4, name: 'Duyệt Đăng Ký', icon: '✅', path: '/teacher/approvals', color: '#16a085' },
    { id: 5, name: 'Hoạt Động Học Tập', icon: '🎯', path: '/teacher/activities', color: '#8e44ad' },
    { id: 6, name: 'Phúc Khảo', icon: '🔄', path: '/teacher/appeals', color: '#2980b9' },
    { id: 7, name: 'Khen Thưởng - Kỷ Luật', icon: '⭐', path: '/teacher/commendations', color: '#c0392b' },
    { id: 8, name: 'Thông Báo & Tin Tức', icon: '📢', path: '/teacher/notifications', color: '#27ae60' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👨‍🏫 Bảng Điều Khiển Giảng Viên</h1>
        <p className="welcome-text">
          Xin chào, <strong>{user?.hoten || user?.username}</strong>
        </p>
      </div>

      {/* Teacher Info Card */}
      <div className="teacher-info-card card">
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
            <span className="info-label">Mã giảng viên:</span>
            <span className="info-value">{user?.magiangvien || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Vai trò:</span>
            <span className="badge badge-teacher">Giảng Viên</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Lớp Học Phần</h3>
            <p className="stat-number">{stats.totalClasses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Tổng Sinh Viên</h3>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Điểm Đã Nhập</h3>
            <p className="stat-number">{stats.totalGrades}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Chờ Duyệt</h3>
            <p className="stat-number">{stats.pendingApprovals}</p>
          </div>
        </div>
      </div>

      {/* Teacher Menu Grid */}
      <div className="teacher-menu-section">
        <h2>Chức Năng Giảng Viên</h2>
        <div className="teacher-menu-grid">
          {teacherMenuItems.map(item => (
            <div
              key={item.id}
              className="teacher-menu-item"
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
          <button className="action-btn btn-primary">📝 Nhập Điểm</button>
          <button className="action-btn btn-success">✅ Duyệt Đăng Ký</button>
          <button className="action-btn btn-info">👥 Xem Danh Sách Lớp</button>
          <button className="action-btn btn-warning">📢 Gửi Thông Báo</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
