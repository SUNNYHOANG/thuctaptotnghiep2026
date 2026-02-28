import React from 'react';
import { Link } from 'react-router-dom';

const CTSVDashboard = () => {
  return (
    <div className="container">
      <div className="card" style={{ padding: 20 }}>
        <h2>Phòng CTSV</h2>
        <p>Chọn chức năng bên dưới:</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/ctsv/hoc-bong">Học bổng</Link>
          <Link className="btn btn-primary" to="/ctsv/khen-thuong-ky-luat">Kỷ luật & khen thưởng</Link>
          <Link className="btn btn-primary" to="/ctsv/diem-ren-luyen">Điểm rèn luyện (tổng hợp)</Link>
          <Link className="btn btn-primary" to="/ctsv/diem-ren-luyen-tu-danh-gia">Tự đánh giá DRL (SV → CTSV)</Link>
        </div>
      </div>
    </div>
  );
};

export default CTSVDashboard;

