import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import StudentFeeMenu from '../components/StudentFeeMenu';
import StudentFeePayment from '../components/StudentFeePayment';
import StudentFeeDebt from '../components/StudentFeeDebt';
import StudentFeeReceipt from '../components/StudentFeeReceipt';

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
          features: [
            'Đăng ký hoạt động',
            'Xem hoạt động của tôi',
            'Xem điểm rèn luyện',
            'Cập nhật thông tin cá nhân'
          ]
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

  // State để chuyển đổi giữa các chức năng học phí
  const [feeTab, setFeeTab] = React.useState(feeTabInit || 'online');

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>{content.title}</h1>
        <p className="welcome-text">
          Xin chào, <strong>{user?.hoten || user?.username}</strong>
        </p>
      </div>

      <div className="dashboard-content" style={{display: 'flex', gap: 24}}>
        {/* Menu học phí chỉ cho sinh viên */}
        {user?.role === 'sinhvien' && (
          <div>
            <StudentFeeMenu onSelect={setFeeTab} />
          </div>
        )}
        <div style={{flex: 1}}>
          {/* Nếu là sinh viên và chọn tab học phí thì hiển thị trang tương ứng */}
          {user?.role === 'sinhvien' ? (
            feeTab === 'online' ? (
              <StudentFeePayment />
            ) : feeTab === 'debt' ? (
              <StudentFeeDebt />
            ) : feeTab === 'receipt' ? (
              <StudentFeeReceipt />
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
                        {user?.role === 'admin' ? 'Quản trị viên' : 
                        user?.role === 'giangvien' ? 'Giảng viên' : 'Sinh viên'}
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
            )
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
                      {user?.role === 'admin' ? 'Quản trị viên' : 
                      user?.role === 'giangvien' ? 'Giảng viên' : 'Sinh viên'}
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
