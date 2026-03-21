import React, { useEffect, useState } from 'react';
import { lopAPI, lookupAPI } from '../api/api';

const AdminLopHanhChinh = () => {
  const [lopList, setLopList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKhoa, setFilterKhoa] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLop, setEditingLop] = useState(null);
  const [form, setForm] = useState({ malop: '', tenlop: '', makhoa: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    lookupAPI.getKhoaList().then(r => setKhoaList(r.data?.data || [])).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [filterKhoa]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await lopAPI.getAll(filterKhoa || undefined);
      setLopList(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {
      setLopList([]);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.malop.trim() || !form.tenlop.trim() || !form.makhoa) {
      showMsg('Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingLop) {
        await lopAPI.update(editingLop.malop, { tenlop: form.tenlop, makhoa: form.makhoa });
        showMsg('Cập nhật lớp thành công.');
      } else {
        await lopAPI.create(form);
        showMsg('Thêm lớp mới thành công.');
      }
      resetForm();
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Lỗi khi lưu.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lop) => {
    setForm({ malop: lop.malop, tenlop: lop.tenlop || '', makhoa: lop.makhoa || '' });
    setEditingLop(lop);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleDelete = async (malop) => {
    if (!window.confirm(`Xóa lớp "${malop}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await lopAPI.delete(malop);
      showMsg('Đã xóa lớp thành công.');
      load();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Lỗi khi xóa.', 'error');
    }
  };

  const resetForm = () => {
    setForm({ malop: '', tenlop: '', makhoa: '' });
    setEditingLop(null);
    setShowForm(false);
  };

  const filtered = lopList.filter(l => {
    const q = search.toLowerCase();
    return !q || l.malop?.toLowerCase().includes(q) || l.tenlop?.toLowerCase().includes(q);
  });

  const tenKhoa = (mk) => khoaList.find(k => k.makhoa === mk)?.tenkhoa || mk || '—';

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0 }}>Quản lý lớp hành chính</h2>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
              Tổng: <strong>{lopList.length}</strong> lớp
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(v => !v); setMessage({ text: '', type: '' }); }}
            style={{ padding: '9px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 }}
          >
            {showForm && !editingLop ? 'Đóng' : '+ Thêm lớp'}
          </button>
        </div>

        {/* Thông báo */}
        {message.text && (
          <div style={{
            marginBottom: 14, padding: '10px 16px', borderRadius: 7,
            background: message.type === 'error' ? '#ffebee' : '#e8f5e9',
            color: message.type === 'error' ? '#c62828' : '#2e7d32',
            border: `1px solid ${message.type === 'error' ? '#ffcdd2' : '#c8e6c9'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Form thêm/sửa */}
        {showForm && (
          <div style={{ background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>
              {editingLop ? `Sửa lớp: ${editingLop.malop}` : 'Thêm lớp mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Mã lớp *</label>
                  <input
                    value={form.malop}
                    onChange={e => setForm(f => ({ ...f, malop: e.target.value }))}
                    disabled={!!editingLop}
                    placeholder="VD: CNTT01"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 6,
                      border: '1px solid #ccc', boxSizing: 'border-box', fontSize: 14,
                      background: editingLop ? '#f0f0f0' : '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Tên lớp *</label>
                  <input
                    value={form.tenlop}
                    onChange={e => setForm(f => ({ ...f, tenlop: e.target.value }))}
                    placeholder="VD: Công nghệ thông tin K01"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 14 }}>Khoa *</label>
                  <select
                    value={form.makhoa}
                    onChange={e => setForm(f => ({ ...f, makhoa: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box', fontSize: 14 }}
                  >
                    <option value="">-- Chọn khoa --</option>
                    {khoaList.map(k => (
                      <option key={k.makhoa} value={k.makhoa}>{k.tenkhoa || k.makhoa}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                  {saving ? 'Đang lưu...' : editingLop ? 'Cập nhật' : 'Thêm lớp'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ padding: '8px 18px', background: '#eee', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã lớp, tên lớp..."
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', width: 220, fontSize: 14 }}
          />
          <select
            value={filterKhoa}
            onChange={e => setFilterKhoa(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
          >
            <option value="">Tất cả khoa</option>
            {khoaList.map(k => (
              <option key={k.makhoa} value={k.makhoa}>{k.tenkhoa || k.makhoa}</option>
            ))}
          </select>
          <span style={{ alignSelf: 'center', color: '#666', fontSize: 13 }}>
            Hiển thị {filtered.length}/{lopList.length} lớp
          </span>
        </div>

        {/* Bảng danh sách */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#888' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: '#888', background: '#fafafa', borderRadius: 8, border: '1px dashed #ddd' }}>
            {lopList.length === 0 ? 'Chưa có lớp nào. Nhấn "+ Thêm lớp" để bắt đầu.' : 'Không tìm thấy lớp phù hợp.'}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={th}>STT</th>
                  <th style={th}>Mã lớp</th>
                  <th style={th}>Tên lớp</th>
                  <th style={th}>Khoa</th>
                  <th style={{ ...th, textAlign: 'center' }}>Số SV</th>
                  <th style={{ ...th, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lop, idx) => (
                  <tr key={lop.malop} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ ...td, color: '#999', width: 50 }}>{idx + 1}</td>
                    <td style={{ ...td, fontWeight: 600, color: '#1976d2' }}>{lop.malop}</td>
                    <td style={td}>{lop.tenlop || '—'}</td>
                    <td style={{ ...td, color: '#555' }}>{tenKhoa(lop.makhoa)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{lop.total ?? lop.sosinhvien ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(lop)}
                          style={{ padding: '5px 14px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(lop.malop)}
                          style={{ padding: '5px 12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
};

const th = { padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#555' };
const td = { padding: '11px 14px', fontSize: 14 };

export default AdminLopHanhChinh;
