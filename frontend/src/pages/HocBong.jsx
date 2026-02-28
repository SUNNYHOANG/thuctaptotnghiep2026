import React, { useState, useEffect } from 'react';
import { hocBongAPI } from '../api/api';
import './HocBong.css';

const HocBong = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [recipients, setRecipients] = useState({});

  useEffect(() => {
    loadScholarships();
  }, []);

  const loadScholarships = async () => {
    try {
      setLoading(true);
      const res = await hocBongAPI.getAll();
      setScholarships(res.data || []);
    } catch (error) {
      console.error('Error loading scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async (id) => {
    if (recipients[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    try {
      const res = await hocBongAPI.getRecipients(id);
      setRecipients((prev) => ({ ...prev, [id]: res.data || [] }));
      setExpandedId(id);
    } catch {
      setRecipients((prev) => ({ ...prev, [id]: [] }));
      setExpandedId(id);
    }
  };

  const getStatusLabel = (status) => {
    const labels = { 'mo': '📋 Mở', 'dong': '🔒 Đóng', 'het': '❌ Hết' };
    return labels[status] || status;
  };

  return (
    <div className="hocbong-container">
      <h1>Thông Tin Học Bổng</h1>
      
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : scholarships.length === 0 ? (
        <div className="empty-state">Không có học bổng nào</div>
      ) : (
        <div className="scholarships-grid">
          {scholarships.map(scholarship => (
            <div key={scholarship.mahocbong} className="scholarship-card">
              <div className="card-header">
                <h3>{scholarship.tenhocbong}</h3>
                <span className="status-badge">{getStatusLabel(scholarship.trangthai)}</span>
              </div>
              <div className="card-body">
                <div className="info-item">
                  <span className="label">Giá Trị:</span>
                  <span className="value">{scholarship.giatri?.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="info-item">
                  <span className="label">Số Lượng:</span>
                  <span className="value">{scholarship.soluong}</span>
                </div>
                <div className="info-item">
                  <span className="label">Khoá Hạn:</span>
                  <span className="value">{scholarship.hanchot ? new Date(scholarship.hanchot).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Học Kỳ:</span>
                  <span className="value">{scholarship.tenhocky}</span>
                </div>
                {scholarship.dieukien && (
                  <div className="info-item">
                    <span className="label">Điều Kiện:</span>
                    <span className="value">{scholarship.dieukien}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Đã Nhận:</span>
                  <span className="value">{scholarship.soluong_nhan || 0} suất</span>
                </div>
                <div className="recipients-toggle">
                  <button type="button" className="btn-link" onClick={() => loadRecipients(scholarship.mahocbong)}>
                    {expandedId === scholarship.mahocbong ? 'Ẩn danh sách' : 'Xem sinh viên đã nhận học bổng'}
                  </button>
                </div>
                {expandedId === scholarship.mahocbong && (
                  <div className="recipients-list">
                    {(recipients[scholarship.mahocbong] || []).length === 0 ? (
                      <p className="muted">Chưa có sinh viên nào được duyệt.</p>
                    ) : (
                      <ul>
                        {(recipients[scholarship.mahocbong] || []).map((r) => (
                          <li key={r.mssv}>{r.mssv} – {r.hoten}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HocBong;
