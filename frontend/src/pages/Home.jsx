import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Điểm Rèn Luyện</h3>
            <p>Xem điểm rèn luyện và xếp loại theo học kỳ</p>
            <Link to="/diem-ren-luyen" className="btn btn-primary">Xem Điểm</Link>
          </div>
        </div>

        <div className="info-section">
          <h2>Thông Tin Hệ Thống</h2>
          <div className="info-grid">
            <div className="info-item">
              <h4>🎯 Mục Đích</h4>
              <p>Quản lý và theo dõi các hoạt động công tác sinh viên, tính điểm rèn luyện một cách minh bạch và công bằng.</p>
            </div>
            <div className="info-item">
              <h4>📊 Tính Năng</h4>
              <ul>
                <li>Theo dõi điểm rèn luyện</li>
                <li>Xem báo cáo điểm chi tiết</li>
                <li>Quản lý học phí</li>
                <li>Theo dõi khen thưởng và kỷ luật</li>
              </ul>
            </div>
            <div className="info-item">
              <h4>💡 Hướng Dẫn</h4>
              <p>Truy cập các tính năng trong menu để quản lý thông tin học tập, tài chính và hoạt động sinh viên của bạn.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
