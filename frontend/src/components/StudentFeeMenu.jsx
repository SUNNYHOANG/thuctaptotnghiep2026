import React from 'react';
import './StudentFeeMenu.css';

const StudentFeeMenu = ({ onSelect }) => (
  <div className="fee-menu">
    <div className="fee-menu-header">
      <span className="visa-icon">VISA</span>
      <span className="fee-menu-title">HỌC PHÍ</span>
      <span className="fee-menu-arrow">▼</span>
    </div>
    <div className="fee-menu-list">
      <div className="fee-menu-item" onClick={() => onSelect('online')}>Thanh toán trực tuyến</div>
      <div className="fee-menu-item" onClick={() => onSelect('debt')}>Tra cứu công nợ</div>
      <div className="fee-menu-item" onClick={() => onSelect('receipt')}>Phiếu thu trực tuyến</div>
    </div>
  </div>
);

export default StudentFeeMenu;
