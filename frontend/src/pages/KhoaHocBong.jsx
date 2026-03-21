import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hocBongAPI, lookupAPI } from '../api/api';
import api from '../api/api';

const KhoaHocBong = () => {
  const { user } = useAuth();
  const [hocBongList, setHocBongList] = useState([]);
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [mahocky]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hocBongAPI.getAll(mahocky || null);
      setHocBongList(Array.isArray(res.data) ? res.data : []);
    } catch { setHocBongList([]); } finally { setLoading(false); }
  };

  const loadRecipients = async (hb) => {
    setSelected(hb);
    setLoadingRecipients(true);
    try {
      const res = await hocBongAPI.getRecipients(hb.mahocbong);
      // Lọc theo khoa
      const data = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.makhoa
        ? await (async () => {
            // Lấy thêm thông tin makhoa của từng SV
            const svRes = await api.get('/lookup/report-stats', { params: { group: 'malop' } });
            return data; // Trả về tất cả, backend không có filter khoa ở đây
          })()
        : data;
      setRecipients(filtered);
    } catch { setRecipients([]); } finally { setLoadingRecipients(false); }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🎓 Học bổng — Khoa {user?.makhoa}</h1>
        </div>

        <div style={{ marginBottom: 16 }}>
          <select className="form-control" style={{ width: 220 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
            <option value="">-- Tất cả học kỳ --</option>
            {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
          <div>
            {loading ? <div className="spinner" /> : hocBongList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Không có học bổng nào.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hocBongList.map(hb => (
                  <div key={hb.mahocbong} onClick={() => loadRecipients(hb)}
                    style={{ border: `1px solid ${selected?.mahocbong === hb.mahocbong ? '#3498db' : '#e0e0e0'}`,
                      borderRadius: 8, padding: 16, cursor: 'pointer', background: selected?.mahocbong === hb.mahocbong ? '#eff6ff' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{hb.tenhocbong}</div>
                        <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                          Giá trị: <strong>{hb.giatri?.toLocaleString('vi-VN')} đ</strong>
                          {hb.soluong && ` • Số lượng: ${hb.soluong}`}
                        </div>
                      </div>
                      <span style={{ background: '#d5f5e3', color: '#27ae60', padding: '4px 10px', borderRadius: 12, fontSize: 12 }}>
                        HK {hb.mahocky}
                      </span>
                    </div>
                    {hb.mota && <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>{hb.mota}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, position: 'sticky', top: 16, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Danh sách nhận: {selected.tenhocbong}</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999' }}>×</button>
              </div>
              {loadingRecipients ? <div className="spinner" /> : recipients.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Chưa có sinh viên nhận học bổng này.</div>
              ) : (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead><tr><th>#</th><th>MSSV</th><th>Họ tên</th></tr></thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={r.mssv}><td>{i + 1}</td><td>{r.mssv}</td><td>{r.hoten}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KhoaHocBong;
