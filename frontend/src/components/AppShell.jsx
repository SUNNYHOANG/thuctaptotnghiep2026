import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppShell.css';

function getRoleName(role) {
  const roles = {
    admin: 'Quản trị viên',
    giangvien: 'Giảng viên',
    ctsv: 'Phòng CTSV',
    sinhvien: 'Sinh viên',
    khoa: 'Ban Quản Lý Khoa'
  };
  return roles[role] || role || 'Người dùng';
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('') || 'U';
}

const LOGO_HVA = '/logo-hva.png'; // Đặt file logo Học viện Hàng không VN tại frontend/public/logo-hva.png

const AppShell = ({ children }) => {
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const navItems = useMemo(() => {
    if (hasRole('admin')) {
      return [
        { label: 'Tổng quan', path: '/admin/dashboard' },
        { label: 'Người dùng', path: '/admin/users' },
        { label: 'Môn học', path: '/admin/courses' },
        { label: 'Mở/Đóng đăng ký', path: '/admin/course-availability' },
        { label: 'Hoạt động', path: '/admin/activities' },
        { label: 'Điểm rèn luyện', path: '/admin/scores' },
        { label: 'Học bổng', path: '/admin/scholarships' },
        { label: 'Khen thưởng / Kỷ luật', path: '/admin/rewards' },
        { label: 'Dịch vụ', path: '/admin/services' },
        { label: 'Báo cáo', path: '/admin/reports' },
        { label: 'Thông báo', path: '/admin/thong-bao' }
      ];
    }
    if (hasRole('giangvien')) {
      return [
        { label: 'Tổng quan', path: '/giangvien/dashboard' },
        { label: 'Nhập / quản lý điểm', path: '/teacher/grades' },
        { label: 'Sinh viên trong lớp', path: '/giangvien/sinh-vien-lop' },
        { label: 'Duyệt tự đánh giá DRL', path: '/giangvien/diem-ren-luyen-tu-danh-gia' },
        { label: 'Đăng thông báo', path: '/admin/thong-bao' }
      ];
    }
    if (hasRole('ctsv')) {
      return [
        { label: 'Tổng quan', path: '/ctsv/dashboard' },
        { label: 'Quản lý điểm (kiểm tra & khóa)', path: '/ctsv/quan-ly-diem' },
        { label: 'Duyệt đơn online', path: '/ctsv/duyet-don-online' },
        { label: 'Duyệt đơn phúc khảo', path: '/ctsv/duyet-phuc-khao' },
        { label: 'Duyệt đăng ký hoạt động', path: '/ctsv/duyet-dang-ky-hoat-dong' },
        { label: 'Gửi nhắc nhở', path: '/ctsv/nhac-nho' },
        { label: 'Học bổng', path: '/ctsv/hoc-bong' },
        { label: 'Khen thưởng / Kỷ luật', path: '/ctsv/khen-thuong-ky-luat' },
        { label: 'Điểm rèn luyện', path: '/ctsv/diem-ren-luyen' },
        { label: 'Quản lý điểm rèn luyện', path: '/ctsv/quan-ly-diem-ren-luyen' },
        { label: 'Tự đánh giá DRL (SV)', path: '/ctsv/diem-ren-luyen-tu-danh-gia' },
        { label: 'Đăng thông báo', path: '/admin/thong-bao' }
      ];
    }
    if (hasRole('khoa')) {
      return [
        { label: 'Tổng quan', path: '/khoa/dashboard' },
        { label: 'Duyệt Phiếu DRL', path: '/khoa/drl-review' },
        { label: 'Danh Sách Sinh Viên', path: '/khoa/students' },
      ];
    }
    // sinhvien (default)
    return [
      { label: 'Trang chủ', path: '/' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Hồ sơ cá nhân', path: '/ho-so-ca-nhan' },
      { label: 'Điểm rèn luyện', path: '/diem-ren-luyen' },
      { label: 'Tự đánh giá DRL', path: '/diem-ren-luyen/tu-danh-gia' },
      { label: 'Tiêu chí đánh giá DRL', path: '/tieu-chi-drl' },
      { label: 'Danh sách hoạt động', path: '/activities' },
      { label: 'Hoạt động của tôi', path: '/hoat-dong-cua-toi' },
      { label: 'Tra cứu NRL', path: '/nrl-tracker' },
      { label: 'Bảng điểm', path: '/student-grades' },
      { label: 'Phúc khảo điểm', path: '/phuc-khao' },
      { label: 'Khen thưởng / Kỷ luật', path: '/khen-thuong-ky-luat' },
      { label: 'Dịch vụ', path: '/dich-vu' },
      { label: 'Học bổng', path: '/hoc-bong' },
      { label: 'Thông báo', path: '/thong-bao' }
    ];
  }, [hasRole, hasAnyRole]);

  const title = useMemo(() => {
    // small mapping for nicer topbar title
    const map = [
      ['/admin/dashboard', 'Bảng điều khiển'],
      ['/giangvien/dashboard', 'Bảng điều khiển'],
      ['/ctsv/dashboard', 'Bảng điều khiển'],
      ['/diem-ren-luyen', 'Điểm rèn luyện'],
      ['/thong-bao', 'Thông báo']
    ];
    const found = map.find(([p]) => location.pathname.startsWith(p));
    return found?.[1] || 'Hệ thống';
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''}`} aria-label="Điều hướng">
        <div className="app-sidebar__top">
          <div className="app-brand" onClick={() => navigate(hasRole('admin') ? '/admin/dashboard' : hasRole('khoa') ? '/khoa/dashboard' : '/')}>
            {!logoError ? (
              <img
                src={LOGO_HVA}
                alt="Học viện Hàng không Việt Nam"
                className="app-brand__logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <>
                <div className="app-brand__mark">SV</div>
                <div className="app-brand__text">
                  <div className="app-brand__title">QL Công tác SV</div>
                  <div className="app-brand__subtitle">Điểm rèn luyện</div>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `app-nav__link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
              end
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__bottom">
          <button className="app-nav__link danger" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <button
            type="button"
            className="app-icon-btn app-topbar__menu"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Mở menu"
          >
            ☰
          </button>
          <div className="app-topbar__brand">
            <img src={LOGO_HVA} alt="HVA" className="app-topbar__logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="app-topbar__title">{title}</span>
          </div>
          <div className="app-topbar__spacer" />
          <div className="app-user">
            <div className="app-user__meta">
              <div className="app-user__name">{user?.hoten || user?.username || 'Người dùng'}</div>
              <div className="app-user__role">{getRoleName(user?.role)}</div>
            </div>
            <div className="app-user__avatar" aria-hidden="true">
              {getInitials(user?.hoten || user?.username)}
            </div>
          </div>
        </header>

        <main className="app-main">
          {children}
          <div className="app-footer">© 2026 Hệ thống QL Công tác Sinh viên & Điểm Rèn luyện</div>
        </main>
      </div>

      {mobileNavOpen && (
        <div className="app-backdrop" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
};

export default AppShell;

