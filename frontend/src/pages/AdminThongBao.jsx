import React, { useState, useEffect } from 'react';
import { thongBaoAPI } from '../api/api';
import { lookupAPI } from '../api/api';

const LOAI_OPTIONS = [
  { value: 'truong', label: 'Toàn trường' },
  { value: 'lop', label: 'Theo lớp' },
  { value: 'lichthi', label: 'Lịch thi' },
  { value: 'deadline_hocphi', label: 'Hạn học phí' },
  { value: 'khac', label: 'Khác' },
];

const AdminThongBao = () => {
  const [list, setList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [hockyList, setHockyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    tieude: '',
    noidung: '',
    loai: 'truong',
    malop: '',
    mahocky: '',
    han_xem: '',
  });

  useEffect(() => {
    load();
    lookupAPI.getLop().then((r) => setLopList(r.data || []));
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || []));
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await thongBaoAPI.getAll({});
      setList(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tieude?.trim()) {
      alert('Vui lòng nhập tiêu đề.');
      return;
    }
    if (form.loai === 'lop' && !form.malop) {
      alert('Vui lòng chọn Lớp khi loại thông báo là \"Theo lớp\".');
      return;
    }
    try {
      const payload = {
        tieude: form.tieude.trim(),
        noidung: form.noidung?.trim() || null,
        loai: form.loai,
        malop: form.loai === 'lop' ? form.malop || null : null,
        mahocky: form.mahocky || null,
        han_xem: form.han_xem || null,
      };
      if (editingId) {
        await thongBaoAPI.update(editingId, payload);
        alert('Cập nhật thành công.');
      } else {
        await thongBaoAPI.create(payload);
        alert('Đăng thông báo thành công. Sinh viên sẽ thấy trong mục Thông báo.');
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    try {
      await thongBaoAPI.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi.');
    }
  };

  const openCreate = () => {
    setForm({ tieude: '', noidung: '', loai: 'truong', malop: '', mahocky: '', han_xem: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setForm({
      tieude: r.tieude || '',
      noidung: r.noidung || '',
      loai: r.loai || 'truong',
      malop: r.malop || '',
      mahocky: r.mahocky || '',
      han_xem: r.han_xem ? r.han_xem.split('T')[0] : '',
    });
    setEditingId(r.mathongbao);
    setShowModal(true);
  };

  return (
    <div className="admin-page">
      <h2>📢 Quản Lý Thông Báo & Tin Tức</h2>
      <p>GV và CTSV đăng thông báo, sinh viên xem tại mục Thông báo.</p>
      <div style={{ marginBottom: 16 }}>
        <button onClick={openCreate} style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          ➕ Đăng thông báo
        </button>
      </div>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Tiêu đề</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Loại</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Lớp/Học kỳ</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Ngày đăng</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.mathongbao} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10 }}>{r.tieude}</td>
                  <td style={{ padding: 10 }}>{LOAI_OPTIONS.find((o) => o.value === r.loai)?.label || r.loai}</td>
                  <td style={{ padding: 10 }}>{r.malop || r.tenhocky || '-'}</td>
                  <td style={{ padding: 10 }}>{r.ngaytao ? new Date(r.ngaytao).toLocaleDateString('vi-VN') : '-'}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button onClick={() => openEdit(r)} style={{ marginRight: 8, background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDelete(r.mathongbao)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p>Chưa có thông báo.</p>}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: '90%', maxWidth: 500, margin: 20 }}>
            <h3>{editingId ? 'Sửa' : 'Đăng'} thông báo</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Tiêu đề *</label>
                <input value={form.tieude} onChange={(e) => setForm((f) => ({ ...f, tieude: e.target.value }))} required style={{ width: '100%', padding: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Nội dung</label>
                <textarea value={form.noidung} onChange={(e) => setForm((f) => ({ ...f, noidung: e.target.value }))} rows={4} style={{ width: '100%', padding: 8 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Loại</label>
                <select value={form.loai} onChange={(e) => setForm((f) => ({ ...f, loai: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                  {LOAI_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {form.loai === 'lop' && (
                <div style={{ marginBottom: 12 }}>
                  <label>Lớp</label>
                  <select value={form.malop} onChange={(e) => setForm((f) => ({ ...f, malop: e.target.value }))} style={{ width: '100%', padding: 8 }}>
                    <option value="">-- Tất cả --</option>
                    {lopList.map((l) => (
                      <option key={l.malop} value={l.malop}>{l.tenlop || l.malop}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label>Hạn xem (tùy chọn)</label>
                <input type="date" value={form.han_xem} onChange={(e) => setForm((f) => ({ ...f, han_xem: e.target.value }))} style={{ width: '100%', padding: 8 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThongBao;
