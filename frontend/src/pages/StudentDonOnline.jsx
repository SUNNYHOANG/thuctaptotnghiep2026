import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const LOAI_DON = [
  { value: 'xin_nghi_phep', label: 'Xin nghỉ phép / nghỉ ốm' },
  { value: 'xin_hoc_lai', label: 'Xin học lại / thi lại' },
  { value: 'xin_chuyen_nganh', label: 'Xin chuyển ngành' },
  { value: 'xin_bao_luu', label: 'Xin bảo lưu kết quả' },
  { value: 'xin_tot_nghiep', label: 'Đăng ký tốt nghiệp' },
  { value: 'xin_xac_nhan_sv', label: 'Xin xác nhận sinh viên' },
  { value: 'xin_bang_diem', label: 'Xin bảng điểm' },
  { value: 'xin_ktx', label: 'Đăng ký ký túc xá' },
  { value: 'khac', label: 'Khác' },
];

const TRANGTHAI_CONFIG = {
  cho:      { label: 'Chờ xử lý',  color: '#f39c12', bg: '#fff3cd' },
  dangxuly: { label: 'Đang xử lý', color: '#3498db', bg: '#d6eaf8' },
  daduyet:  { label: 'Đã duyệt',   color: '#27ae60', bg: '#d5f5e3' },
  tuchoi:   { label: 'Từ chối',    color: '#e74c3c', bg: '#fde8e8' },
};

const StudentDonOnline = () => {
  const { user } = useAuth();
  const [dons, setDons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ loaidon: '', tieude: '', noidung: '', ghichu: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadDons(); }, []);

  const loadDons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/don-online/student');
      setDons(res.data?.data || res.data || []);
    } catch { setDons([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.loaidon) { setMessage('Vui lòng chọn loại đơn.'); return; }
    if (!form.tieude.trim()) { setMessage('Vui lòng nhập tiêu đề.'); return; }
    try {
      setSubmitting(true);
      setMessage('');
      if (editingId) {
        await api.put(`/don-online/${editingId}`, { tieude: form.tieude, noidung: form.noidung, ghichu: form.ghichu });
      } else {
        await api.post('/don-online', { ...form, mssv: user.mssv });
      }
      await loadDons();
      resetForm();
      setMessage(editingId ? '✅ Đã cập nhật đơn.' : '✅ Đã nộp đơn thành công. Vui lòng chờ CTSV xử lý.');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi lưu đơn.'));
    } finally { setSubmitting(false); }
  };

  const handleEdit = (don) => {
    setForm({ loaidon: don.loaidon, tieude: don.tieude, noidung: don.noidung || '', ghichu: don.ghichu || '' });
    setEditingId(don.madon);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn này?')) return;
    try {
      await api.delete(`/don-online/${id}`);
      await loadDons();
    } catch (err) { setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xóa.')); }
  };

  const resetForm = () => {
    setForm({ loaidon: '', tieude: '', noidung: '', ghichu: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filtered = filter === 'all' ? dons : dons.filter(d => d.trangthai === filter);
  const counts = dons.reduce((acc, d) => { acc[d.trangthai] = (acc[d.trangthai] || 0) + 1; return acc; }, {});

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="card-title">📋 Nộp đơn trực tuyến</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? 'Đóng form' : '+ Tạo đơn mới'}
          </button>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ margin: '12px 0' }}>
            {message}
          </div>
        )}

        {showForm && (
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>{editingId ? 'Chỉnh sửa đơn' : 'Tạo đơn mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Loại đơn *</label>
                <select className="form-control" value={form.loaidon}
                  onChange={e => setForm({ ...form, loaidon: e.target.value })} required disabled={!!editingId}>
                  <option value="">-- Chọn loại đơn --</option>
                  {LOAI_DON.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tiêu đề *</label>
                <input className="form-control" value={form.tieude}
                  onChange={e => setForm({ ...form, tieude: e.target.value })}
                  placeholder="Nhập tiêu đề đơn..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Nội dung chi tiết</label>
                <textarea className="form-control" rows={5} value={form.noidung}
                  onChange={e => setForm({ ...form, noidung: e.target.value })}
                  placeholder="Mô tả chi tiết lý do, hoàn cảnh, yêu cầu..." />
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú thêm</label>
                <input className="form-control" value={form.ghichu}
                  onChange={e => setForm({ ...form, ghichu: e.target.value })}
                  placeholder="Thông tin bổ sung (nếu có)..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Nộp đơn'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { key: 'all', label: 'Tất cả', count: dons.length },
            { key: 'cho', label: 'Chờ xử lý', count: counts.cho || 0 },
            { key: 'dangxuly', label: 'Đang xử lý', count: counts.dangxuly || 0 },
            { key: 'daduyet', label: 'Đã duyệt', count: counts.daduyet || 0 },
            { key: 'tuchoi', label: 'Từ chối', count: counts.tuchoi || 0 },
          ].map(f => (
            <button key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.key)}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            {filter === 'all' ? 'Bạn chưa có đơn nào. Nhấn "+ Tạo đơn mới" để bắt đầu.' : 'Không có đơn nào ở trạng thái này.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(don => {
              const cfg = TRANGTHAI_CONFIG[don.trangthai] || { label: don.trangthai, color: '#666', bg: '#f0f0f0' };
              const loaiLabel = LOAI_DON.find(l => l.value === don.loaidon)?.label || don.loaidon;
              return (
                <div key={don.madon} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{don.tieude}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        <span style={{ background: '#e8f4fd', color: '#2980b9', padding: '2px 8px', borderRadius: 4, marginRight: 8 }}>{loaiLabel}</span>
                        Ngày nộp: {new Date(don.ngaygui).toLocaleDateString('vi-VN')}
                        {don.ngayduyet && ` • Ngày duyệt: ${new Date(don.ngayduyet).toLocaleDateString('vi-VN')}`}
                      </div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </div>
                  {don.noidung && (
                    <div style={{ marginTop: 10, fontSize: 14, color: '#444', background: '#f8f9fa', borderRadius: 6, padding: '8px 12px' }}>
                      {don.noidung}
                    </div>
                  )}
                  {don.ketqua && (
                    <div style={{ marginTop: 8, fontSize: 14, padding: '8px 12px', borderRadius: 6,
                      background: don.trangthai === 'tuchoi' ? '#fde8e8' : '#d5f5e3',
                      color: don.trangthai === 'tuchoi' ? '#c0392b' : '#1e8449' }}>
                      <strong>{don.trangthai === 'tuchoi' ? 'Lý do từ chối: ' : 'Kết quả: '}</strong>{don.ketqua}
                    </div>
                  )}
                  {(don.trangthai === 'cho') && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(don)}>✏️ Sửa</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(don.madon)}>🗑️ Xóa</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDonOnline;
