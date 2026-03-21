import React, { useState, useEffect } from 'react';
import { hocKyAPI } from '../api/api';

const EMPTY_FORM = { tenhocky: '', namhoc: '', ngaybatdau: '', ngayketthuc: '', trangthai: 'chuamo' };

const TRANGTHAI_CONFIG = {
  chuamo:  { label: 'Chưa mở', color: '#d97706', bg: '#fef3c7', next: 'dangmo',  nextLabel: '▶ Mở học kỳ' },
  dangmo:  { label: 'Đang mở', color: '#15803d', bg: '#dcfce7', next: 'dadong',  nextLabel: '⏹ Đóng học kỳ' },
  dadong:  { label: 'Đã đóng', color: '#dc2626', bg: '#fee2e2', next: 'chuamo',  nextLabel: '↺ Đặt lại' },
};

const AdminHocKy = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadList(); }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await hocKyAPI.getAll();
      setList(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Không tải được danh sách' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      if (editing) {
        await hocKyAPI.update(editing, form);
        setMessage({ type: 'success', text: 'Cập nhật học kỳ thành công' });
      } else {
        await hocKyAPI.create(form);
        setMessage({ type: 'success', text: 'Thêm học kỳ thành công' });
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      setShowForm(false);
      loadList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Lỗi khi lưu' });
    }
  };

  const handleEdit = (hk) => {
    setForm({
      tenhocky: hk.tenhocky,
      namhoc: hk.namhoc,
      ngaybatdau: hk.ngaybatdau ? hk.ngaybatdau.slice(0, 10) : '',
      ngayketthuc: hk.ngayketthuc ? hk.ngayketthuc.slice(0, 10) : '',
      trangthai: hk.trangthai || 'chuamo',
    });
    setEditing(hk.mahocky);
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleToggleTrangthai = async (hk) => {
    const cfg = TRANGTHAI_CONFIG[hk.trangthai || 'chuamo'];
    try {
      await hocKyAPI.updateTrangthai(hk.mahocky, cfg.next);
      setList((prev) => prev.map((h) => h.mahocky === hk.mahocky ? { ...h, trangthai: cfg.next } : h));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Không thể đổi trạng thái' });
    }
  };

  const handleDelete = async (mahocky) => {
    if (!window.confirm('Xóa học kỳ này?')) return;
    try {
      await hocKyAPI.delete(mahocky);
      setMessage({ type: 'success', text: 'Đã xóa học kỳ' });
      loadList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Không thể xóa' });
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="card-title">📅 Quản Lý Học Kỳ</h1>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM); }}>
              + Thêm học kỳ
            </button>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>{editing ? 'Sửa học kỳ' : 'Thêm học kỳ mới'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Tên học kỳ *</label>
                <input className="form-control" value={form.tenhocky}
                  onChange={(e) => setForm({ ...form, tenhocky: e.target.value })}
                  required placeholder="VD: Học kỳ 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Năm học *</label>
                <input className="form-control" value={form.namhoc}
                  onChange={(e) => setForm({ ...form, namhoc: e.target.value })}
                  required placeholder="VD: 2024-2025" />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày bắt đầu</label>
                <input className="form-control" type="date" value={form.ngaybatdau}
                  onChange={(e) => setForm({ ...form, ngaybatdau: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày kết thúc</label>
                <input className="form-control" type="date" value={form.ngayketthuc}
                  onChange={(e) => setForm({ ...form, ngayketthuc: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-control" value={form.trangthai}
                  onChange={(e) => setForm({ ...form, trangthai: e.target.value })}>
                  <option value="chuamo">Chưa mở</option>
                  <option value="dangmo">Đang mở</option>
                  <option value="dadong">Đã đóng</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" type="submit">{editing ? 'Lưu thay đổi' : 'Thêm mới'}</button>
              <button className="btn btn-secondary" type="button" onClick={handleCancel}>Hủy</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="spinner" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mã HK</th>
                  <th>Tên học kỳ</th>
                  <th>Năm học</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((hk) => {
                  const cfg = TRANGTHAI_CONFIG[hk.trangthai || 'chuamo'];
                  return (
                    <tr key={hk.mahocky}>
                      <td><strong>{hk.mahocky}</strong></td>
                      <td>{hk.tenhocky}</td>
                      <td>{hk.namhoc}</td>
                      <td>{hk.ngaybatdau ? new Date(hk.ngaybatdau).toLocaleDateString('vi-VN') : '—'}</td>
                      <td>{hk.ngayketthuc ? new Date(hk.ngayketthuc).toLocaleDateString('vi-VN') : '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ marginRight: 4, padding: '4px 10px', fontSize: 12, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}
                          onClick={() => handleToggleTrangthai(hk)}
                          title={`Chuyển sang: ${TRANGTHAI_CONFIG[cfg.next].label}`}
                        >
                          {cfg.nextLabel}
                        </button>
                        <button className="btn btn-secondary" style={{ marginRight: 4, padding: '4px 10px', fontSize: 12 }} onClick={() => handleEdit(hk)}>Sửa</button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(hk.mahocky)}>Xóa</button>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Chưa có học kỳ nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHocKy;
