import React, { useState, useEffect } from 'react';
import { phucKhaoAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './PhucKhao.css';

const TRANGTHAI_CONFIG = {
  cho:      { label: 'Chờ xử lý',  cls: 'cho' },
  dangxuly: { label: 'Đang xử lý', cls: 'dangxuly' },
  chapnhan: { label: 'Chấp nhận',  cls: 'chapnhan' },
  tuchoi:   { label: 'Từ chối',    cls: 'tuchoi' },
};

const PhucKhao = () => {
  const { user } = useAuth();
  const [requests, setRequests]     = useState([]);
  const [monHocList, setMonHocList] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [formData, setFormData]     = useState({ mamonhoc: '', lydo: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.mssv) {
      loadRequests();
      phucKhaoAPI.getMonHocList()
        .then((res) => setMonHocList(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await phucKhaoAPI.getByStudent(user.mssv);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Load phúc khảo lỗi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mamonhoc) { alert('Vui lòng chọn môn học cần phúc khảo.'); return; }
    if (!formData.lydo.trim()) { alert('Vui lòng nhập lý do phúc khảo.'); return; }
    try {
      setSubmitting(true);
      if (editingId) {
        await phucKhaoAPI.update(editingId, { lydo: formData.lydo });
      } else {
        await phucKhaoAPI.create({ mssv: user.mssv, mamonhoc: formData.mamonhoc, lydo: formData.lydo });
      }
      await loadRequests();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi lưu đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ mamonhoc: '', lydo: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (req) => {
    setFormData({ mamonhoc: String(req.mamonhoc || ''), lydo: req.lydo || '' });
    setEditingId(req.maphuckhao);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn phúc khảo này?')) return;
    try {
      await phucKhaoAPI.delete(id);
      await loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi xóa.');
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.trangthai === filter);
  const counts = requests.reduce((acc, r) => { acc[r.trangthai] = (acc[r.trangthai] || 0) + 1; return acc; }, {});

  return (
    <div className="phuckhao-container">
      <h1>Phúc Khảo Điểm</h1>

      <div className="phuckhao-header">
        <div className="filter-buttons">
          {[
            { key: 'all',      label: 'Tất cả',      count: requests.length },
            { key: 'cho',      label: 'Chờ xử lý',   count: counts.cho || 0 },
            { key: 'dangxuly', label: 'Đang xử lý',  count: counts.dangxuly || 0 },
            { key: 'chapnhan', label: 'Chấp nhận',   count: counts.chapnhan || 0 },
            { key: 'tuchoi',   label: 'Từ chối',     count: counts.tuchoi || 0 },
          ].map((f) => (
            <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <button className="btn-add" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          + Tạo Đơn Phúc Khảo
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Chỉnh Sửa Đơn' : 'Tạo Đơn Phúc Khảo'}</h3>
          <form onSubmit={handleSubmit}>
            {!editingId ? (
              <div className="form-group">
                <label>Chọn môn học cần phúc khảo *</label>
                <select
                  value={formData.mamonhoc}
                  onChange={(e) => setFormData({ ...formData, mamonhoc: e.target.value })}
                  required
                >
                  <option value="">-- Chọn môn học --</option>
                  {monHocList.map((m) => (
                    <option key={m.mamonhoc} value={m.mamonhoc}>
                      {m.tenmonhoc} ({m.sotinchi} tín chỉ)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Môn học</label>
                <input value={requests.find((r) => r.maphuckhao === editingId)?.tenmonhoc || ''} disabled />
              </div>
            )}
            <div className="form-group">
              <label>Lý do phúc khảo *</label>
              <textarea
                value={formData.lydo}
                onChange={(e) => setFormData({ ...formData, lydo: e.target.value })}
                rows={4}
                placeholder="Mô tả lý do bạn muốn phúc khảo điểm môn này..."
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Không có đơn nào</div>
      ) : (
        <div className="records-grid">
          {filtered.map((req) => {
            const cfg = TRANGTHAI_CONFIG[req.trangthai] || { label: req.trangthai, cls: '' };
            return (
              <div key={req.maphuckhao} className={`record-card status-${req.trangthai}`}>
                <div className="record-header">
                  <h3>{req.tenmonhoc || 'Môn học'}</h3>
                  <span className={`status-badge status-${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div className="record-body">
                  <div className="record-item">
                    <span className="label">Lý do:</span>
                    <span className="value">{req.lydo}</span>
                  </div>
                  <div className="record-item">
                    <span className="label">Ngày gửi:</span>
                    <span className="value">{new Date(req.ngaygui).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {req.ketqua && (
                    <div className="record-item">
                      <span className="label">Kết quả:</span>
                      <span className="value">{req.ketqua}</span>
                    </div>
                  )}
                  {req.trangthai === 'cho' && (
                    <div className="record-actions">
                      <button className="btn-edit" onClick={() => handleEdit(req)}>Sửa</button>
                      <button className="btn-delete" onClick={() => handleDelete(req.maphuckhao)}>Xóa</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhucKhao;
