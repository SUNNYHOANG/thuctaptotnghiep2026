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

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Trang Sinh Viên</h1>
        <p className="welcome-text">
          Xin chào, <strong>{user?.hoten || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
