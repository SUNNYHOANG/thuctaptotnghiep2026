import React from 'react';
import './Dashboard.css';

const FaceAttendance = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📸 Điểm Danh Bằng Khuôn Mặt</h1>
        <p className="welcome-text">
          Ứng dụng điểm danh khuôn mặt sẽ mở trong khung bên dưới. Trình duyệt sẽ yêu cầu quyền dùng camera.
        </p>
      </div>

      <div className="card">
        <p>
          Nếu khung bên dưới không hiển thị, hãy mở trực tiếp địa chỉ{' '}
          <code>http://localhost:8502</code> trên máy đang chạy ứng dụng điểm danh (Streamlit).
        </p>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
          <iframe
            src="http://localhost:8502"
            title="Face Attendance App"
            style={{ width: '100%', height: '800px', border: 'none' }}
            allow="camera; microphone"
          />
        </div>
      </div>
    </div>
  );
};

export default FaceAttendance;

