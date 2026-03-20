import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './RoleBasedNavigation.css';

const RoleBasedNavigation = () => {
  const { user, hasRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const adminNavItems = [
    { label: 'Bảng Điều Khiển', path: '/admin/dashboard' },
    { label: 'Quản Lý Người Dùng', path: '/admin/users' },
    { label: 'Quản Lý Môn Học', path: '/admin/courses' },
    { label: 'Mở/Đóng Đăng Ký', path: '/admin/course-availability' },
    { label: 'Quản Lý Hoạt Động', path: '/admin/activities' },
    { label: 'Báo Cáo', path: '/admin/reports' },
  ];

  const teacherNavItems = [
    { label: 'Bảng Điều Khiển', path: '/giangvien/dashboard' },
    { label: 'Lớp Của Tôi', path: '/teacher/classes' },
    { label: 'Danh Sách Sinh Viên', path: '/teacher/students' },
    { label: 'Nhập Điểm', path: '/teacher/grades' },
    { label: 'Duyệt Đăng Ký', path: '/teacher/approvals' },
    { label: 'Hoạt Động', path: '/teacher/activities' },
  ];

  const ctsvNavItems = [
    { label: 'Bảng Điều Khiển', path: '/ctsv/dashboard' },
    { label: 'Học Bổng', path: '/ctsv/hoc-bong' },
    { label: 'Khen Thưởng & Kỷ Luật', path: '/ctsv/khen-thuong-ky-luat' },
    { label: 'Điểm Rèn Luyện (Duyệt/Yêu cầu)', path: '/ctsv/diem-ren-luyen' },
  ];

  const studentNavItems = [
    { label: 'Trang Chủ', path: '/' },
    { label: 'Điểm Rèn Luyện', path: '/diem-ren-luyen' },
    { label: 'Dịch Vụ', path: '/dich-vu' },
  ];

  let navItems = [];
  if (hasRole('admin')) {
    navItems = adminNavItems;
  } else if (hasRole('giangvien')) {
    navItems = teacherNavItems;
  } else if (hasRole('ctsv')) {
    navItems = ctsvNavItems;
  } else {
    navItems = studentNavItems;
  }

  const getRoleLabel = () => {
    if (hasRole('admin')) return 'Quản Trị Viên';
    if (hasRole('giangvien')) return 'Giảng Viên';
    if (hasRole('ctsv')) return 'Phòng CTSV';
    return 'Sinh Viên';
  };

  return (
    <nav className="role-based-nav">
      <div className="nav-role-badge">
        <span className={`role-label role-${user?.role}`}>{getRoleLabel()}</span>
      </div>

      <button 
        className="nav-toggle" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ☰ Menu
      </button>

      <ul className={`nav-items ${isMenuOpen ? 'active' : ''}`}>
        {navItems.map((item, index) => (
          <li key={index}>
            <Link 
              to={item.path} 
              onClick={() => setIsMenuOpen(false)}
              className="nav-link"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default RoleBasedNavigation;
