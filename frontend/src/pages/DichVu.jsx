import React, { useState, useEffect } from 'react';
import { dichVuAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './DichVu.css';

const DichVu = () => {
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ maloaidichvu: '', noidung_yeucau: '', ghichu: '' });
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('DichVu component mounted, user:', user);
    loadServices();
    loadServiceTypes();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      if (user?.mssv) {
        console.log('Loading services for mssv:', user.mssv);
        const res = await dichVuAPI.getByStudent(user.mssv);
        console.log('Services response:', res);
        
        // Handle Axios response format
        let services = [];
        if (Array.isArray(res.data)) {
          services = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
          services = res.data.data;
        }
        
        console.log('Parsed services:', services);
        setServices(services);
      } else {
        console.warn('No user mssv found');
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceTypes = async () => {
    try {
      console.log('Loading service types from API...');
      const res = await dichVuAPI.getLoai();
      console.log('Service types API response:', res);
      
      // Axios response: res.data contains the actual data
      // Backend returns: { data: [...] }
      // So we need: res.data.data
      let types = [];
      if (res.data) {
        if (Array.isArray(res.data.data)) {
          types = res.data.data;
        } else if (Array.isArray(res.data)) {
          types = res.data;
        }
      }
      
      console.log('Parsed service types:', types);
      
      if (Array.isArray(types) && types.length > 0) {
        setServiceTypes(types);
        console.log('✓ Loaded', types.length, 'service types');
      } else {
        console.warn('No service types found in response');
        setServiceTypes([]);
      }
    } catch (error) {
      console.error('Error loading service types:', error);
      setServiceTypes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user?.mssv) {
        alert('Lỗi: Không tìm thấy mã sinh viên');
        return;
      }
      if (!formData.maloaidichvu) {
        alert('Vui lòng chọn loại dịch vụ');
        return;
      }
      const data = { 
        ...formData, 
        maloaidichvu: parseInt(formData.maloaidichvu),
        mssv: user.mssv 
      };
      if (editingId) {
        await dichVuAPI.update(editingId, formData);
      } else {
        await dichVuAPI.create(data);
      }
      loadServices();
      setFormData({ maloaidichvu: '', noidung_yeucau: '', ghichu: '' });
      setEditingId(null);
      setShowForm(false);
      alert('Lưu thành công!');
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.error || 'Lỗi khi lưu: ' + error.message);
    }
  };

  const handleEdit = (service) => {
    setFormData({
      maloaidichvu: service.maloaidichvu,
      noidung_yeucau: service.noidung_yeucau || '',
      ghichu: service.ghichu || ''
    });
    setEditingId(service.madon);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đơn này?')) return;
    try {
      await dichVuAPI.delete(id);
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
      'dangxuly': '⏳ Đang xử lý',
      'duyet': '✅ Đã duyệt',
      'tuchoi': '❌ Từ chối'
    };
    return labels[status] || status;
  };

  return (
    <div className="dichvu-container">
      <h1>Quản Lý Dịch Vụ</h1>
      
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
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}>
            Tất Cả ({filteredServices.length})
          </button>
          <button className={`filter-btn ${filter === 'dangxuly' ? 'active' : ''}`}
            onClick={() => setFilter('dangxuly')}>
            Đang Xử Lý ({filteredServices.filter(s => s.trangthai === 'dangxuly').length})
          </button>
          <button className={`filter-btn ${filter === 'duyet' ? 'active' : ''}`}
            onClick={() => setFilter('duyet')}>
            Đã Duyệt ({filteredServices.filter(s => s.trangthai === 'duyet').length})
          </button>
        </div>
        <button className="btn-add" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ maloaidichvu: '', noidung_yeucau: '', ghichu: '' }); }}>
          + Tạo Đơn Mới
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Chỉnh Sửa Đơn' : 'Tạo Đơn Xin Dịch Vụ'}</h3>
          {serviceTypes.length === 0 && (
            <div style={{ color: 'orange', marginBottom: '10px' }}>⚠️ Đang tải danh sách loại dịch vụ...</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loại Dịch Vụ *</label>
              <select 
                value={formData.maloaidichvu} 
                onChange={e => setFormData({...formData, maloaidichvu: e.target.value})} 
                required>
                <option value="">
                  {serviceTypes.length === 0 ? '-- Đang tải --' : '-- Chọn loại dịch vụ --'}
                </option>
                {serviceTypes.map(t => (
                  <option key={t.maloaidichvu} value={t.maloaidichvu}>
                    {t.tendichvu}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nội Dung Yêu Cầu</label>
              <textarea value={formData.noidung_yeucau} onChange={e => setFormData({...formData, noidung_yeucau: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea value={formData.ghichu} onChange={e => setFormData({...formData, ghichu: e.target.value})}></textarea>
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
                <h3>{service.tendichvu}</h3>
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
                {service.trangthai === 'dangxuly' && (
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
