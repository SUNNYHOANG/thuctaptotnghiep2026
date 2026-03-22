import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';

const TieuChiDRL = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupAPI.getTieuChiDRL()
      .then((res) => setList(res.data?.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMax = list.reduce((s, t) => s + Number(t.diem_toi_da || 0), 0);

  const LOAI_LABEL = {
    hoatdong: 'Hoạt động',
    hoc_tap: 'Học tập',
    ky_luat: 'Kỷ luật',
    khac: 'Khác',
  };

  const LOAI_COLOR = {
    hoatdong: { bg: '#e8f5e9', color: '#2e7d32' },
    hoc_tap:  { bg: '#e3f2fd', color: '#1565c0' },
    ky_luat:  { bg: '#fff3e0', color: '#e65100' },
    khac:     { bg: '#f3e5f5', color: '#6a1b9a' },
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Tiêu chí đánh giá điểm rèn luyện</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            Các tiêu chí dùng để tính điểm rèn luyện trong mỗi học kỳ.
          </p>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : list.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
            Chưa có dữ liệu tiêu chí.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={{ ...thStyle, width: 40, textAlign: 'center' }}>#</th>
                  <th style={thStyle}>Tên tiêu chí</th>
                  <th style={{ ...thStyle, width: 120 }}>Loại</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 120 }}>Điểm tối đa</th>
                  <th style={thStyle}>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {list.map((tc, idx) => {
                  const loaiStyle = LOAI_COLOR[tc.loai] || { bg: '#f5f5f5', color: '#555' };
                  return (
                    <tr key={tc.id ?? idx} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#999' }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{tc.ten}</td>
                      <td style={tdStyle}>
                        {tc.loai ? (
                          <span style={{
                            display: 'inline-block',
                            background: loaiStyle.bg,
                            color: loaiStyle.color,
                            borderRadius: 10,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {LOAI_LABEL[tc.loai] || tc.loai}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          fontWeight: 700,
                          borderRadius: 12,
                          padding: '2px 14px',
                          fontSize: 14,
                        }}>
                          {tc.diem_toi_da}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#666' }}>{tc.mo_ta || '—'}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f5f7fa', borderTop: '2px solid #e0e0e0' }}>
                  <td colSpan={3} style={{ ...tdStyle, fontWeight: 700 }}>Tổng cộng</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: totalMax === 100 ? '#2e7d32' : '#c62828' }}>
                    {totalMax}
                  </td>
                  <td style={tdStyle}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 16, padding: 14, background: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082', fontSize: 13 }}>
          <strong>Lưu ý:</strong> Tổng điểm tối đa là 100. Điểm tự đánh giá của sinh viên không được vượt quá điểm tối đa của từng tiêu chí.
        </div>
      </div>
    </div>
  );
};

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#555' };
const tdStyle = { padding: '11px 14px', fontSize: 14 };

export default TieuChiDRL;
