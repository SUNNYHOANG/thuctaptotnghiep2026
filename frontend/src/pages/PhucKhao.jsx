import React, { useState, useEffect } from 'react';
import { phucKhaoAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './PhucKhao.css';

const PhucKhao = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ mabangdiem: '', malophoc: '', lydo: '' });
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      if (user?.mssv) {
        const res = await phucKhaoAPI.getByStudent(user.mssv);
        setRequests(res.data || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, mssv: user.mssv };
      if (editingId) {
        await phucKhaoAPI.update(editingId, formData);
      } else {
        await phucKhaoAPI.create(data);
      }
      loadRequests();
      setFormData({ mabangdiem: '', malophoc: '', lydo: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu');
    }
  };

  const handleEdit = (request) => {
    setFormData({ mabangdiem: request.mabangdiem, malophoc: request.malophoc, lydo: request.lydo || '' });
    setEditingId(request.maphuckhao);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn này?')) return;
    try {
      await phucKhaoAPI.delete(id);
      loadRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.trangthai === filter;
  });

  const getStatusLabel = (status) => {
    const labels = { 'dangxuly': '⏳ Đang xử lý', 'duyet': '✅ Có lý do', 'tuchoi': '❌ Từ chối' };
    return labels[status] || status;
  };

  return (
    <div className="phuckhao-container">
      <h1>Phúc Khảo Điểm</h1>
      
      <div className="phuckhao-header">
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Tất Cả ({requests.length})
          </button>
          <button className={`filter-btn ${filter === 'dangxuly' ? 'active' : ''}`} onClick={() => setFilter('dangxuly')}>
            Đang Xử Lý ({requests.filter(r => r.trangthai === 'dangxuly').length})
          </button>
          <button className={`filter-btn ${filter === 'duyet' ? 'active' : ''}`} onClick={() => setFilter('duyet')}>
            Có Lý Do ({requests.filter(r => r.trangthai === 'duyet').length})
          </button>
        </div>
        <button className="btn-add" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ mabangdiem: '', malophoc: '', lydo: '' }); }}>
          + Tạo Đơn Phúc Khảo
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Chỉnh Sửa Đơn' : 'Tạo Đơn Phúc Khảo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Mã Bảng Điểm *</label>
              <input value={formData.mabangdiem} onChange={e => setFormData({...formData, mabangdiem: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Mã Lớp Học Phần *</label>
              <input value={formData.malophoc} onChange={e => setFormData({...formData, malophoc: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Lý Do Phúc Khảo *</label>
              <textarea value={formData.lydo} onChange={e => setFormData({...formData, lydo: e.target.value})} required></textarea>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">Lưu</button>
              <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">Không có đơn nào</div>
      ) : (
        <div className="records-grid">
          {filteredRequests.map(req => (
            <div key={req.maphuckhao} className={`record-card status-${req.trangthai}`}>
              <div className="record-header">
                <h3>{req.tenmonhoc}</h3>
                <span className="status-badge">{getStatusLabel(req.trangthai)}</span>
              </div>
              <div className="record-body">
                <div className="record-item">
                  <span className="label">Mã Phúc Khảo:</span>
                  <span className="value">{req.maphuckhao}</span>
                </div>
                <div className="record-item">
                  <span className="label">Lý Do:</span>
                  <span className="value">{req.lydo}</span>
                </div>
                <div className="record-item">
                  <span className="label">Ngày Gửi:</span>
                  <span className="value">{new Date(req.ngaygui).toLocaleDateString('vi-VN')}</span>
                </div>
                {req.ketqua && (
                  <div className="record-item">
                    <span className="label">Kết Quả:</span>
                    <span className="value">{req.ketqua}</span>
                  </div>
                )}
                {req.trangthai === 'dangxuly' && (
                  <div className="record-actions">
                    <button className="btn-edit" onClick={() => handleEdit(req)}>Sửa</button>
                    <button className="btn-delete" onClick={() => handleDelete(req.maphuckhao)}>Xóa</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhucKhao;
