import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';
import './TieuChiDRL.css';

const TieuChiDRL = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupAPI.getTieuChiDRL()
      .then((res) => setList(res.data?.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const labelLoai = (loai) => {
    const m = { 'hoatdong': 'Hoạt động', 'hoc tap': 'Học tập', 'ky luat': 'Kỷ luật', 'khac': 'Khác' };
    return m[loai] || loai;
  };

  if (loading) return <div className="page-card">Đang tải...</div>;

  return (
    <div className="page-card tieu-chi-drl">
      <h1>Tiêu chí đánh giá điểm rèn luyện</h1>
      <p className="intro">Các tiêu chí dùng để tính điểm rèn luyện (GPA, điều kiện, chương trình).</p>
      {list.length === 0 ? (
        <div className="empty-state">Chưa có dữ liệu tiêu chí.</div>
      ) : (
        <div className="tieu-chi-list">
          {list.map((t) => (
            <div key={t.matieuchi} className="tieu-chi-card">
              <div className="tieu-chi-header">
                <span className="loai">{labelLoai(t.loaitieuchi)}</span>
                <span className="diem">Điểm tối đa: {t.diemtoida}</span>
              </div>
              <h3>{t.tentieuchi}</h3>
              {t.mota && <p className="mota">{t.mota}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TieuChiDRL;
