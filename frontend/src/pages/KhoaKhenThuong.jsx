import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { khenThuongKyLuatAPI, lookupAPI } from '../api/api';

const KhoaKhenThuong = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [loai, setLoai] = useState('');
  const [searchMssv, setSearchMssv] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [mahocky, loai]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await khenThuongKyLuatAPI.getAll({ mahocky: mahocky || undefined, loai: loai || undefined });
      const data = Array.isArray(res.data) ? res.data : [];
      // Lọc theo khoa
      const filtered = user?.makhoa ? data.filter(r => r.makhoa === user.makhoa) : data;
      setRows(filtered);
    } catch { setRows([]); } finally { setLoading(false); }
  };

  const filtered = searchMssv ? rows.filter(r => r.mssv?.toLowerCase().includes(searchMssv.toLowerCase())) : rows;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">⭐ Khen thưởng / Kỷ luật — Khoa {user?.makhoa}</h1>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
            <option value="">-- Tất cả học kỳ --</option>
            {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>)}
          </select>
          <select className="form-control" style={{ width: 160 }} value={loai} onChange={e => setLoai(e.target.value)}>
            <option value="">Tất cả loại</option>
            <option value="khenthuong">Khen thưởng</option>
            <option value="kyluat">Kỷ luật</option>
          </select>
          <input className="form-control" style={{ width: 180 }} placeholder="🔍 Tìm MSSV..."
            value={searchMssv} onChange={e => setSearchMssv(e.target.value)} />
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có dữ liệu.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>MSSV</th><th>Họ tên</th><th>Lớp</th><th>Loại</th><th>Nội dung</th><th>Mức</th><th>Ngày</th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id || r.maktkt}>
                  <td>{r.mssv}</td>
                  <td>{r.hoten}</td>
                  <td>{r.malop}</td>
                  <td>
                    <span style={{
                      background: r.loai === 'khenthuong' ? '#d5f5e3' : '#fde8e8',
                      color: r.loai === 'khenthuong' ? '#27ae60' : '#e74c3c',
                      padding: '2px 8px', borderRadius: 12, fontSize: 12
                    }}>
                      {r.loai === 'khenthuong' ? '⭐ Khen thưởng' : '⚠️ Kỷ luật'}
                    </span>
                  </td>
                  <td>{r.noidung}</td>
                  <td>{r.muc || '-'}</td>
                  <td style={{ fontSize: 12 }}>{r.ngay ? new Date(r.ngay).toLocaleDateString('vi-VN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default KhoaKhenThuong;
