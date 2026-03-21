import React, { useState, useEffect } from 'react';
import api from '../api/api';

// Cấu trúc tiêu chí DRL mặc định theo quy định
const DEFAULT_TIEU_CHI = [
  { ma: 'A', ten: 'Ý thức và kết quả học tập', diem_toi_da: 20, mo_ta: 'Đánh giá kết quả học tập trong học kỳ' },
  { ma: 'B', ten: 'Ý thức chấp hành nội quy, quy chế', diem_toi_da: 25, mo_ta: 'Chấp hành nội quy, quy định của nhà trường' },
  { ma: 'C', ten: 'Ý thức và kết quả tham gia hoạt động chính trị - xã hội', diem_toi_da: 20, mo_ta: 'Tham gia các hoạt động đoàn thể, chính trị' },
  { ma: 'D', ten: 'Ý thức công dân trong quan hệ cộng đồng', diem_toi_da: 25, mo_ta: 'Công tác xã hội & cộng đồng (tối đa 25đ)' },
  { ma: 'E', ten: 'Ý thức và kết quả tham gia công tác phụ trách lớp, đoàn thể', diem_toi_da: 10, mo_ta: 'Tham gia ban cán sự, đoàn thể' },
];

const AdminTieuChiDRL = () => {
  const [tieuChi, setTieuChi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { index, data }
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ ma: '', ten: '', diem_toi_da: 10, mo_ta: '' });

  const fetchTieuChi = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lookup/tieu-chi-drl');
      const data = res.data?.data || res.data || [];
      setTieuChi(data.length > 0 ? data : DEFAULT_TIEU_CHI);
    } catch {
      setTieuChi(DEFAULT_TIEU_CHI);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTieuChi(); }, []);

  const totalMax = tieuChi.reduce((s, t) => s + Number(t.diem_toi_da || 0), 0);

  const handleEdit = (idx) => {
    setEditing({ index: idx, data: { ...tieuChi[idx] } });
    setMsg('');
  };

  const handleEditChange = (field, value) => {
    setEditing(e => ({ ...e, data: { ...e.data, [field]: value } }));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setMsg('');
    try {
      const item = editing.data;
      if (item.id) {
        await api.put(`/tieu-chi-drl/${item.id}`, item);
      } else {
        await api.post('/tieu-chi-drl', item);
      }
      setMsg('Lưu thành công.');
      setEditing(null);
      fetchTieuChi();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi khi lưu tiêu chí.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa tiêu chí "${item.ten}"?`)) return;
    try {
      if (item.id) {
        await api.delete(`/tieu-chi-drl/${item.id}`);
        fetchTieuChi();
      } else {
        setTieuChi(tc => tc.filter(t => t.ma !== item.ma));
      }
    } catch {
      alert('Lỗi khi xóa tiêu chí.');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.ma.trim() || !newItem.ten.trim()) {
      setMsg('Vui lòng nhập mã và tên tiêu chí.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      await api.post('/tieu-chi-drl', newItem);
      setMsg('Thêm tiêu chí thành công.');
      setNewItem({ ma: '', ten: '', diem_toi_da: 10, mo_ta: '' });
      setShowAdd(false);
      fetchTieuChi();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi khi thêm tiêu chí.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm('Đặt lại tiêu chí về mặc định? Dữ liệu hiện tại sẽ bị xóa.')) return;
    setSaving(true);
    try {
      // Xóa tất cả rồi tạo lại
      for (const tc of tieuChi) {
        if (tc.id) await api.delete(`/tieu-chi-drl/${tc.id}`).catch(() => {});
      }
      for (const tc of DEFAULT_TIEU_CHI) {
        await api.post('/tieu-chi-drl', tc).catch(() => {});
      }
      setMsg('Đặt lại mặc định thành công.');
      fetchTieuChi();
    } catch {
      setMsg('Lỗi khi đặt lại mặc định.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0 }}>Cấu hình tiêu chí DRL</h2>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              Tổng điểm tối đa: <strong style={{ color: totalMax === 100 ? 'green' : 'red' }}>{totalMax}/100</strong>
              {totalMax !== 100 && <span style={{ color: 'red', marginLeft: 8 }}>⚠ Tổng phải bằng 100</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setShowAdd(!showAdd); setMsg(''); }}
              style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              {showAdd ? 'Hủy' : '+ Thêm tiêu chí'}
            </button>
            <button
              onClick={handleResetDefault}
              disabled={saving}
              style={{ padding: '8px 16px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Đặt lại mặc định
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 6, background: msg.includes('thành công') ? '#e8f5e9' : '#ffebee', color: msg.includes('thành công') ? '#2e7d32' : '#c62828' }}>
            {msg}
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleAddSubmit} style={{ background: '#f5f7fa', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0 }}>Thêm tiêu chí mới</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Mã *</label>
                <input value={newItem.ma} onChange={e => setNewItem(n => ({ ...n, ma: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="VD: F" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Tên tiêu chí *</label>
                <input value={newItem.ten} onChange={e => setNewItem(n => ({ ...n, ten: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Tên tiêu chí" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Điểm tối đa</label>
                <input type="number" min={0} max={100} value={newItem.diem_toi_da} onChange={e => setNewItem(n => ({ ...n, diem_toi_da: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Mô tả</label>
              <input value={newItem.mo_ta} onChange={e => setNewItem(n => ({ ...n, mo_ta: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Mô tả tiêu chí" />
            </div>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {saving ? 'Đang lưu...' : 'Thêm'}
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải...</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={thStyle}>Mã</th>
                  <th style={thStyle}>Tên tiêu chí</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Điểm tối đa</th>
                  <th style={thStyle}>Mô tả</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tieuChi.map((tc, idx) => (
                  <tr key={tc.id || tc.ma} style={{ borderTop: '1px solid #f0f0f0' }}>
                    {editing?.index === idx ? (
                      <>
                        <td style={tdStyle}>
                          <input value={editing.data.ma} onChange={e => handleEditChange('ma', e.target.value)}
                            style={{ width: 60, padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc' }} />
                        </td>
                        <td style={tdStyle}>
                          <input value={editing.data.ten} onChange={e => handleEditChange('ten', e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc' }} />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input type="number" min={0} max={100} value={editing.data.diem_toi_da}
                            onChange={e => handleEditChange('diem_toi_da', Number(e.target.value))}
                            style={{ width: 70, padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc', textAlign: 'center' }} />
                        </td>
                        <td style={tdStyle}>
                          <input value={editing.data.mo_ta || ''} onChange={e => handleEditChange('mo_ta', e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #ccc' }} />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={handleSave} disabled={saving}
                            style={{ padding: '4px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 6 }}>
                            Lưu
                          </button>
                          <button onClick={() => setEditing(null)}
                            style={{ padding: '4px 10px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                            Hủy
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1976d2' }}>{tc.ma}</td>
                        <td style={tdStyle}>{tc.ten}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#333' }}>{tc.diem_toi_da}</span>
                        </td>
                        <td style={{ ...tdStyle, color: '#666', fontSize: 13 }}>{tc.mo_ta || '—'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => handleEdit(idx)}
                            style={{ padding: '4px 12px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 6 }}>
                            Sửa
                          </button>
                          <button onClick={() => handleDelete(tc)}
                            style={{ padding: '4px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                            Xóa
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                <tr style={{ background: '#f5f7fa', borderTop: '2px solid #e0e0e0' }}>
                  <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>Tổng cộng</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: totalMax === 100 ? '#2e7d32' : '#c62828' }}>{totalMax}</td>
                  <td colSpan={2} style={tdStyle}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 20, padding: 16, background: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082', fontSize: 13 }}>
          <strong>Lưu ý:</strong> Tổng điểm tối đa của tất cả tiêu chí phải bằng 100. Thay đổi tiêu chí sẽ ảnh hưởng đến phiếu tự đánh giá DRL của sinh viên từ học kỳ tiếp theo.
        </div>
      </div>
  );
};

const thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#555' };
const tdStyle = { padding: '11px 14px', fontSize: 14 };

export default AdminTieuChiDRL;
