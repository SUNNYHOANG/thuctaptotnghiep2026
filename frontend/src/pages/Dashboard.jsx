import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const STUDENT_SHORTCUTS = [
  { to: '/thong-bao', label: 'Thông báo', icon: '📢', desc: 'Tin tức và thông báo từ nhà trường' },
  { to: '/activities', label: 'Hoạt động', icon: '🎯', desc: 'Danh sách hoạt động ngoại khóa' },
  { to: '/hoat-dong-cua-toi', label: 'Hoạt động của tôi', icon: '📋', desc: 'Hoạt động đã đăng ký' },
  { to: '/student-grades', label: 'Bảng điểm', icon: '📊', desc: 'Xem điểm học phần' },
  { to: '/diem-ren-luyen', label: 'Điểm rèn luyện', icon: '⭐', desc: 'Xem điểm rèn luyện theo kỳ' },
  { to: '/diem-ren-luyen/tu-danh-gia', label: 'Tự đánh giá DRL', icon: '✍️', desc: 'Tự đánh giá điểm rèn luyện' },
  { to: '/ho-so-ca-nhan', label: 'Hồ sơ cá nhân', icon: '👤', desc: 'Xem và cập nhật thông tin' },
  { to: '/phuc-khao', label: 'Phúc khảo điểm', icon: '📝', desc: 'Gửi đơn phúc khảo' },
  { to: '/khen-thuong-ky-luat', label: 'Khen thưởng / Kỷ luật', icon: '🏆', desc: 'Lịch sử khen thưởng, kỷ luật' },
  { to: '/dich-vu', label: 'Dịch vụ', icon: '🛎️', desc: 'Đơn xin dịch vụ sinh viên' },
  { to: '/hoc-bong', label: 'Học bổng', icon: '🎓', desc: 'Thông tin học bổng' },
];

const Dashboard = ({ feeTabInit }) => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Trang Quản Trị',
          description: 'Chào mừng đến với trang quản trị hệ thống',
          features: [
            'Quản lý người dùng',
            'Quản lý hoạt động',
            'Quản lý điểm rèn luyện',
            'Xem báo cáo thống kê'
          ]
        };
      case 'giangvien':
        return {
          title: 'Trang Giảng Viên',
          description: 'Chào mừng giảng viên',
          features: [
            'Xem danh sách sinh viên',
            'Quản lý hoạt động',
            'Duyệt đăng ký hoạt động',
            'Xem điểm rèn luyện sinh viên'
          ]
        };
      case 'sinhvien':
        return {
          title: 'Trang Sinh Viên',
          description: 'Chào mừng sinh viên',
          features: []
        };
      default:
        return {
          title: 'Trang Chủ',
          description: 'Chào mừng đến với hệ thống',
          features: []
        };
    }
  };

  const content = getDashboardContent();
  const isStudent = user?.role === 'sinhvien';

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>{content.title}</h1>
        <p className="welcome-text">
          Xin chào, <strong>{user?.hoten || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          {isStudent ? (
            <section className="dashboard-section">
              <h2 className="dashboard-section-title">Truy cập nhanh</h2>
              <p className="dashboard-section-desc">Chọn chức năng cần thao tác bên dưới.</p>
              <div className="dashboard-cards">
                {STUDENT_SHORTCUTS.map((item) => (
                  <Link to={item.to} key={item.to} className="dashboard-card">
                    <span className="dashboard-card__icon">{item.icon}</span>
                    <div className="dashboard-card__body">
                      <h3 className="dashboard-card__title">{item.label}</h3>
                      <p className="dashboard-card__desc">{item.desc}</p>
                    </div>
                    <span className="dashboard-card__arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <>
              <div className="user-info-card card">
                <h2>Thông Tin Tài Khoản</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Tên đăng nhập:</span>
                    <span className="info-value">{user?.username}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Họ và tên:</span>
                    <span className="info-value">{user?.hoten}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Vai trò:</span>
                    <span className={`badge badge-${user?.role}`}>
                      {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'giangvien' ? 'Giảng viên' : 'Sinh viên'}
                    </span>
                  </div>
                  {user?.mssv && (
                    <div className="info-item">
                      <span className="info-label">Mã sinh viên:</span>
                      <span className="info-value">{user.mssv}</span>
                    </div>
                  )}
                  {user?.magiangvien && (
                    <div className="info-item">
                      <span className="info-label">Mã giảng viên:</span>
                      <span className="info-value">{user.magiangvien}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="features-card card">
                <h2>Các Tính Năng</h2>
                <ul className="features-list">
                  {content.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
