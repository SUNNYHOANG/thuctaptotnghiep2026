import React, { useState, useEffect } from 'react';
import { khenThuongKyLuatAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import './KhenThuongKyLuat.css';

const KhenThuongKyLuat = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'khenthuong', 'kyluat'
  const { user } = useAuth();

  const loadRecords = async () => {
    try {
      setLoading(true);
      if (user?.mssv) {
        const res = await khenThuongKyLuatAPI.getByStudent(user.mssv);
        setRecords(res.data || []);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user]);

  // Realtime: tự reload khi có khen thưởng/kỷ luật mới
  useSocketEvent('reward_discipline', loadRecords);

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'khenthuong') return record.loai === 'khenthuong';
    if (filter === 'kyluat') return record.loai === 'kyluat';
    return true;
  });

  const getLoaiLabel = (loai) => {
    return loai === 'khenthuong' ? '🏆 Khen Thưởng' : '⚠️ Kỷ Luật';
  };

  const getHinhThucLabel = (hinhthuc) => {
    const labels = {
      'khen': 'Khen',
      'kk': 'Kỷ Luật',
      'canh': 'Cảnh Cáo'
    };
    return labels[hinhthuc] || hinhthuc;
  };

  return (
    <div className="khen-thuong-ky-luat-container">
      <h1>Khen Thưởng & Kỷ Luật</h1>
      
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất Cả ({records.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'khenthuong' ? 'active' : ''}`}
          onClick={() => setFilter('khenthuong')}
        >
          Khen Thưởng ({records.filter(r => r.loai === 'khenthuong').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'kyluat' ? 'active' : ''}`}
          onClick={() => setFilter('kyluat')}
        >
          Kỷ Luật ({records.filter(r => r.loai === 'kyluat').length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state">
          <p>Không có khen thưởng hoặc kỷ luật nào</p>
        </div>
      ) : (
        <div className="records-grid">
          {filteredRecords.map(record => (
            <div key={record.id} className={`record-card ${record.loai}`}>
              <div className="record-header">
                <h3>{getLoaiLabel(record.loai)}</h3>
                <span className="hinhthuc">{getHinhThucLabel(record.hinhthuc)}</span>
              </div>
              
              <div className="record-body">
                <div className="record-item">
                  <span className="label">Học kỳ:</span>
                  <span className="value">{record.tenhocky} - {record.namhoc}</span>
                </div>
                
                <div className="record-item">
                  <span className="label">Nội dung:</span>
                  <span className="value">{record.noidung}</span>
                </div>
                
                {record.soquyetdinh && (
                  <div className="record-item">
                    <span className="label">Số quyết định:</span>
                    <span className="value">{record.soquyetdinh}</span>
                  </div>
                )}
                
                {record.ngayquyetdinh && (
                  <div className="record-item">
                    <span className="label">Ngày quyết định:</span>
                    <span className="value">{new Date(record.ngayquyetdinh).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                
                {record.ghichu && (
                  <div className="record-item">
                    <span className="label">Ghi chú:</span>
                    <span className="value">{record.ghichu}</span>
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

export default KhenThuongKyLuat;
