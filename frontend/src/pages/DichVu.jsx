import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './DichVu.css';

const API_BASE = 'http://localhost:5000/api';

// Helper gửi multipart/form-data kèm auth headers
const apiUpload = async (method, url, formData) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.role) headers['x-user-role'] = u.role;
      if (u.id) headers['x-user-id'] = u.id;
      if (u.mssv) headers['x-user-mssv'] = u.mssv;
    } catch {}
  }
  return axios({ method, url: `${API_BASE}${url}`, data: formData, headers });
};

const DichVu = () => {
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ maloaidichvu: '', tieude: '', noidung_yeucau: '', ghichu: '' });
  const [fileInput, setFileInput] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadServices();
    loadServiceTypes();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      if (user?.mssv) {
        const res = await apiUpload('get', `/dich-vu/student/${user.mssv}`);
        let list = [];
        if (Array.isArray(res.data)) list = res.data;
        else if (res.data && Array.isArray(res.data.data)) list = res.data.data;
        setServices(list);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceTypes = async () => {
    try {
      const res = await apiUpload('get', '/dich-vu/loai');
      let types = [];
      if (res.data) {
        if (Array.isArray(res.data.data)) types = res.data.data;
        else if (Array.isArray(res.data)) types = res.data;
      }
      setServiceTypes(types);
    } catch (error) {
      setServiceTypes([]);
    }
  };

  // Kiểm tra loại được chọn có phải "Đơn tự do" không
  const isDonTuDo = () => {
    if (!formData.maloaidichvu) return false;
    const selected = serviceTypes.find(t => t.maloaidichvu === parseInt(formData.maloaidichvu));
    return selected?.tendichvu?.toLowerCase().includes('tự do') || selected?.tendichvu?.toLowerCase().includes('tu do');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.mssv) { alert('Lỗi: Không tìm thấy mã sinh viên'); return; }
      if (!formData.maloaidichvu) { alert('Vui lòng chọn loại dịch vụ'); return; }
      if (isDonTuDo() && !formData.tieude.trim()) { alert('Vui lòng nhập tiêu đề đơn'); return; }

      const fd = new FormData();
      fd.append('maloaidichvu', formData.maloaidichvu);
      fd.append('mssv', user.mssv);
      fd.append('tieude', isDonTuDo() ? formData.tieude : '');
      fd.append('noidung_yeucau', formData.noidung_yeucau);
      fd.append('ghichu', formData.ghichu);
      if (fileInput) fd.append('file_dinh_kem', fileInput);

      if (editingId) {
        await apiUpload('put', `/dich-vu/${editingId}`, fd);
      } else {
        await apiUpload('post', '/dich-vu', fd);
      }
      loadServices();
      setFormData({ maloaidichvu: '', tieude: '', noidung_yeucau: '', ghichu: '' });
      setFileInput(null);
      setEditingId(null);
      setShowForm(false);
      alert('Lưu thành công!');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu: ' + error.message);
    }
  };

  const handleEdit = (service) => {
    setFormData({
      maloaidichvu: service.maloaidichvu,
      tieude: service.tieude || '',
      noidung_yeucau: service.noidung_yeucau || '',
      ghichu: service.ghichu || ''
    });
    setFileInput(null);
    setEditingId(service.madon);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn này?')) return;
    try {
      await apiUpload('delete', `/dich-vu/${id}`);
      loadServices();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi xóa');
    }
  };

  const filteredServices = services.filter(s => {
    const matchesServiceType = selectedServiceType === 'all' || s.maloaidichvu === parseInt(selectedServiceType);
    const matchesStatus = filter === 'all' || s.trangthai === filter;
    return matchesServiceType && matchesStatus;
  });

  const getStatusLabel = (status) => {
    const labels = {
      'cho': '🕐 Chờ xử lý',
      'dangxuly': '⏳ Đang xử lý',
      'duyet': '✅ Đã duyệt',
      'tuchoi': '❌ Từ chối'
    };
    return labels[status] || status;
  };

  const canEdit = (s) => s.trangthai === 'cho' || s.trangthai === 'dangxuly';

  return (
    <div className="dichvu-container">
      <h1>Quản Lý Dịch Vụ & Đơn Trực Tuyến</h1>

      {/* Service Type Tabs */}
      <div className="service-type-tabs">
        <button
          className={`service-tab ${selectedServiceType === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedServiceType('all')}>
          Tất Cả
        </button>
        {serviceTypes.map(type => (
          <button
            key={type.maloaidichvu}
            className={`service-tab ${selectedServiceType === type.maloaidichvu.toString() ? 'active' : ''}`}
            onClick={() => setSelectedServiceType(type.maloaidichvu.toString())}
            title={type.mota}>
            {type.tendichvu}
          </button>
        ))}
      </div>

      <div className="dichvu-header">
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Tất Cả ({services.length})
          </button>
          <button className={`filter-btn ${filter === 'cho' ? 'active' : ''}`} onClick={() => setFilter('cho')}>
            Chờ xử lý ({services.filter(s => s.trangthai === 'cho').length})
          </button>
          <button className={`filter-btn ${filter === 'dangxuly' ? 'active' : ''}`} onClick={() => setFilter('dangxuly')}>
            Đang Xử Lý ({services.filter(s => s.trangthai === 'dangxuly').length})
          </button>
          <button className={`filter-btn ${filter === 'duyet' ? 'active' : ''}`} onClick={() => setFilter('duyet')}>
            Đã Duyệt ({services.filter(s => s.trangthai === 'duyet').length})
          </button>
          <button className={`filter-btn ${filter === 'tuchoi' ? 'active' : ''}`} onClick={() => setFilter('tuchoi')}>
            Từ Chối ({services.filter(s => s.trangthai === 'tuchoi').length})
          </button>
        </div>
        <button className="btn-add" onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFileInput(null);
          setFormData({ maloaidichvu: '', tieude: '', noidung_yeucau: '', ghichu: '' });
        }}>
          + Tạo Đơn Mới
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Chỉnh Sửa Đơn' : 'Tạo Đơn Xin Dịch Vụ'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loại Dịch Vụ *</label>
              <select
                value={formData.maloaidichvu}
                onChange={e => setFormData({ ...formData, maloaidichvu: e.target.value, tieude: '' })}
                required>
                <option value="">{serviceTypes.length === 0 ? '-- Đang tải --' : '-- Chọn loại dịch vụ --'}</option>
                {serviceTypes.map(t => (
                  <option key={t.maloaidichvu} value={t.maloaidichvu}>{t.tendichvu}</option>
                ))}
              </select>
            </div>

            {/* Chỉ hiện field tiêu đề khi chọn "Đơn tự do" */}
            {isDonTuDo() && (
              <div className="form-group">
                <label>Tiêu Đề Đơn *</label>
                <input
                  type="text"
                  value={formData.tieude}
                  onChange={e => setFormData({ ...formData, tieude: e.target.value })}
                  placeholder="VD: Đơn xin miễn giảm học phí, Đơn khiếu nại điểm..."
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Nội Dung {isDonTuDo() ? 'Chi Tiết *' : 'Yêu Cầu'}</label>
              <textarea
                value={formData.noidung_yeucau}
                onChange={e => setFormData({ ...formData, noidung_yeucau: e.target.value })}
                placeholder={isDonTuDo() ? 'Trình bày nội dung đơn của bạn...' : 'Mô tả yêu cầu (nếu có)...'}
                rows={isDonTuDo() ? 6 : 3}
              />
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea
                value={formData.ghichu}
                onChange={e => setFormData({ ...formData, ghichu: e.target.value })}
                placeholder="Thông tin bổ sung (nếu có)..."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Đính kèm file <span style={{ color: '#888', fontWeight: 400 }}>(PDF, Word, Excel, ảnh — tối đa 10MB)</span></label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={e => setFileInput(e.target.files[0] || null)}
                style={{ display: 'block', marginTop: 4 }}
              />
              {editingId && !fileInput && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  Để trống nếu không muốn thay file đính kèm cũ.
                </div>
              )}
              {fileInput && (
                <div style={{ fontSize: 13, color: '#1976d2', marginTop: 4 }}>
                  📎 {fileInput.name} ({(fileInput.size / 1024).toFixed(0)} KB)
                </div>
              )}
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
      ) : filteredServices.length === 0 ? (
        <div className="empty-state">Không có đơn nào</div>
      ) : (
        <div className="records-grid">
          {filteredServices.map(service => (
            <div key={service.madon} className={`record-card status-${service.trangthai}`}>
              <div className="record-header">
                <h3>
                  {service.tieude ? service.tieude : service.tendichvu}
                  {service.tieude && (
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 8 }}>
                      ({service.tendichvu})
                    </span>
                  )}
                </h3>
                <span className="status-badge">{getStatusLabel(service.trangthai)}</span>
              </div>
              <div className="record-body">
                <div className="record-item">
                  <span className="label">Mã Đơn:</span>
                  <span className="value">{service.madon}</span>
                </div>
                {service.noidung_yeucau && (
                  <div className="record-item">
                    <span className="label">Nội Dung:</span>
                    <span className="value">{service.noidung_yeucau}</span>
                  </div>
                )}
                <div className="record-item">
                  <span className="label">Ngày Gửi:</span>
                  <span className="value">{new Date(service.ngaygui).toLocaleDateString('vi-VN')}</span>
                </div>
                {service.ketqua && (
                  <div className="record-item">
                    <span className="label" style={{ color: service.trangthai === 'tuchoi' ? '#e74c3c' : '#27ae60' }}>
                      {service.trangthai === 'tuchoi' ? 'Lý do từ chối:' : 'Kết quả:'}
                    </span>
                    <span className="value">{service.ketqua}</span>
                  </div>
                )}
                {service.ghichu && (
                  <div className="record-item">
                    <span className="label">Ghi chú:</span>
                    <span className="value">{service.ghichu}</span>
                  </div>
                )}
                {service.ngayduyet && (
                  <div className="record-item">
                    <span className="label">Ngày duyệt:</span>
                    <span className="value">{new Date(service.ngayduyet).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                {service.file_dinh_kem && (
                  <div className="record-item">
                    <span className="label">File đính kèm:</span>
                    <a
                      href={`${API_BASE}/dich-vu/file/${service.file_dinh_kem}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', fontSize: 13 }}
                    >
                      📎 Tải xuống
                    </a>
                  </div>
                )}
                {canEdit(service) && (
                  <div className="record-actions">
                    <button className="btn-edit" onClick={() => handleEdit(service)}>Sửa</button>
                    <button className="btn-delete" onClick={() => handleDelete(service.madon)}>Xóa</button>
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

export default DichVu;
