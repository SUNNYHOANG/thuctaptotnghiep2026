import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBasedNavigation from './RoleBasedNavigation';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(user?.avatar || 'https://via.placeholder.com/100?text=Avatar');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview ảnh ngay lập tức
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result || '');
    };
    reader.readAsDataURL(file);

    // Trong thực tế sẽ upload lên server
    // setIsUploadingAvatar(true);
    // try {
    //   const formData = new FormData();
    //   formData.append('avatar', file);
    //   // await api.post('/user/avatar', formData);
    // } finally {
    //   setIsUploadingAvatar(false);
    // }
  };

  const getRoleName = (role) => {
    const roles = {
      'admin': 'Quản trị viên',
      'giangvien': 'Giảng viên',
      'ctsv': 'Phòng CTSV',
      'sinhvien': 'Sinh viên',
    };
    return roles[role] || role;
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'white' }}>
              <img src="https://vaa.edu.vn/wp-content/uploads/2024/05/vaa.svg" alt="Logo" />
              <div className="logo-text">
                HỌC VIỆN HÀNG KHÔNG VIỆT NAM<br />
                <small>VIETNAM AVIATION ACADEMY</small>
              </div>
            </Link>
          </div>
          <nav>
            {isAuthenticated() ? (
              <>
                <ul className="nav-menu">
                  <li><Link to="/">Trang Chủ</Link></li>
                  {user?.role === 'sinhvien' && (
                    <>
                      <li><Link to="/dang-ky-mon-hoc">Đăng Ký Môn Học</Link></li>
                      <li><Link to="/diem-ren-luyen">Điểm Rèn Luyện</Link></li>
                      <li><Link to="/nrl-tracker">Tra Cứu Ngày Rèn Luyện</Link></li>
                      <li><Link to="/khen-thuong-ky-luat">Khen Thưởng & Kỷ Luật</Link></li>
                      <li><Link to="/dich-vu">Dịch Vụ</Link></li>
                      <li><Link to="/hoc-phi">Học Phí</Link></li>
                      <li><Link to="/hoc-bong">Học Bổng</Link></li>
                      <li><Link to="/thong-bao">Thông Báo</Link></li>
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <li><Link to="/admin/dashboard">Quản Trị</Link></li>
                  )}
                  {user?.role === 'giangvien' && (
                    <li><Link to="/giangvien/dashboard">Giảng Viên</Link></li>
                  )}
                  {user?.role === 'ctsv' && (
                    <li><Link to="/ctsv/dashboard">Phòng CTSV</Link></li>
                  )}
                </ul>
                <div className="user-menu">
                  <span className="user-info">
                    {user?.hoten || user?.username} ({getRoleName(user?.role)})
                  </span>
                </div>
              </>
            ) : (
              <ul className="nav-menu">
                <li><Link to="/login">Đăng Nhập</Link></li>
                <li><Link to="/register">Đăng Ký</Link></li>
              </ul>
            )}
          </nav>
        </div>
      </header>
      
      {isAuthenticated() && (
        <div className="avatar-section">
          <div className="avatar-container">
            <div className="avatar-wrapper">
              <img src={avatar} alt="Avatar" className="avatar-image" />
              <label htmlFor="avatar-upload" className="avatar-upload-label">
                <span className="upload-icon">📷</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
                className="avatar-input"
              />
            </div>
            <div className="user-profile-info">
              <p className="user-name">{user?.hoten || user?.username}</p>
              <p className="user-role">{getRoleName(user?.role)}</p>
              {user?.mssv && <p className="user-id">MSSV: {user.mssv}</p>}
            </div>
            <button onClick={handleLogout} className="btn-logout-avatar">
              🚪 Đăng Xuất
            </button>
          </div>
        </div>
      )}

      {isAuthenticated() && (user?.role === 'admin' || user?.role === 'giangvien' || user?.role === 'ctsv') && (
        <RoleBasedNavigation />
      )}
    </>
  );
};

export default Header;
