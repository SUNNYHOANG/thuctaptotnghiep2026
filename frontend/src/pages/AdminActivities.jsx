import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastApiResponse, setLastApiResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tenhoatdong: '',
    loaihoatdong: '',
    mota: '',
    ngaybd: '',
    ngaykt: '',
    diadiem: '',
    giangvien_phutrach: '',
    sotiettoithieu: 0,
    sotiethieu: 0,
    nguoitao: '',
    soluongtoida: 100,
    trangthai: 'chophep'
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await adminAPIEndpoints.getActivities();
      // backend returns an array; some endpoints may wrap in { data: [...] }
      const items = Array.isArray(response) ? response : (response.data || []);
      console.log('fetchActivities response:', response);
      console.log('fetchActivities items after mapping:', items);
      console.log('items.length:', items.length);
      setLastApiResponse({ type: 'GET /activities', payload: response });
      setActivities(items);
      console.log('setActivities called with:', items);
    } catch (err) {
      console.error('fetchActivities error:', err);
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map UI form fields to backend field names
      const payload = {
        tenhoatdong: formData.tenhoatdong,
        maloaihoatdong: formData.loaihoatdong || null,
        mota: formData.mota || null,
        ngaybatdau: formData.ngaybd ? `${formData.ngaybd} 00:00:00` : null,
        ngayketthuc: formData.ngaykt ? `${formData.ngaykt} 23:59:59` : null,
        diadiem: formData.diadiem || null,
        soluongtoida: formData.sotiettoithieu || formData.soluongtoida || 100,
        nguoitao: formData.nguoitao || null,
      };

      if (editingId) {
        const updated = await adminAPIEndpoints.updateActivity(editingId, payload);
        console.log('UPDATE response:', updated);
        setLastApiResponse({ type: 'PUT /activities', payload: updated });
        alert('Cập nhật thành công');
        // replace in list if present
        setActivities((prev) => prev.map(it => (it.mahoatdong === updated.mahoatdong ? updated : it)));
      } else {
        const created = await adminAPIEndpoints.createActivity(payload);
        console.log('CREATE response:', created);
        setLastApiResponse({ type: 'POST /activities', payload: created });
        alert('Thêm hoạt động thành công');
        // If backend returned created object, prepend it; otherwise refetch
        if (created && (created.mahoatdong || created.mahoatdong === 0)) {
          setActivities((prev) => [created, ...prev]);
        } else {
          await fetchActivities();
        }
      }
      setShowModal(false);
      setFormData({ tenhoatdong: '', loaihoatdong: '', mota: '', ngaybd: '', ngaykt: '', diadiem: '', giangvien_phutrach: '', sotiettoithieu: 0, sotiethieu: 0, trangthai: 'chophep' });
      setEditingId(null);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = (activity) => {
    // Map backend activity object to UI form fields
    setFormData({
      tenhoatdong: activity.tenhoatdong || '',
      loaihoatdong: activity.maloaihoatdong || '',
      mota: activity.mota || '',
      ngaybd: activity.ngaybatdau ? activity.ngaybatdau.split('T')[0] : '',
      ngaykt: activity.ngayketthuc ? activity.ngayketthuc.split('T')[0] : '',
      diadiem: activity.diadiem || '',
      giangvien_phutrach: activity.nguoitao || '',
      sotiettoithieu: activity.soluongtoida || 0,
      sotiethieu: activity.sotiethieu || 0,
      trangthai: activity.trangthai || 'chophep'
    });
    setEditingId(activity.mahoatdong);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa?')) return;
    try {
      await adminAPIEndpoints.deleteActivity(id);
      alert('Xóa thành công');
      fetchActivities();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ tenhoatdong: '', loaihoatdong: '', mota: '', ngaybd: '', ngaykt: '', diadiem: '', giangvien_phutrach: '', sotiettoithieu: 0, sotiethieu: 0, trangthai: 'chophep' });
  };

  // Debug: log state before rendering
  console.log('AdminActivities render - activities:', activities, 'loading:', loading, 'error:', error);

  return (
    <div className="admin-page">
      <h2>🎯 Quản Lý Hoạt Động</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowModal(true)} style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ➕ Thêm Hoạt Động
        </button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ marginBottom: 8 }}><strong>Số hoạt động: </strong>{activities.length}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tên Hoạt Động</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loại</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ngày Bắt Đầu</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Địa Điểm</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(activity => (
                <tr key={activity.mahoatdong} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', color: '#111' }}>{activity.tenhoatdong}</td>
                  <td style={{ padding: '10px', color: '#111' }}>{activity.tenloai || activity.maloaihoatdong}</td>
                  <td style={{ padding: '10px', color: '#111' }}>{activity.ngaybatdau ? new Date(activity.ngaybatdau).toLocaleDateString() : ''}</td>
                  <td style={{ padding: '10px', color: '#111' }}>{activity.diadiem}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(activity)} style={{ marginRight: '5px', background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(activity.mahoatdong)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Uncomment to view raw JSON data
      <div style={{ marginTop: 12, background: '#fff', padding: 10, borderRadius: 6 }}>
        <strong>Raw activities JSON</strong>
        <pre style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', boxSizing: 'border-box' }}>{JSON.stringify(activities, null, 2)}</pre>
      </div>

        <div style={{ marginTop: 12, background: '#f9f9f9', padding: 10, borderRadius: 6, maxHeight: 300, overflow: 'auto' }}>
          <strong>Debug:</strong>
          <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 6, wordBreak: 'break-word', width: '100%', boxSizing: 'border-box' }}>
            {lastApiResponse ? JSON.stringify(lastApiResponse, null, 2) : 'No API calls yet'}
          </div>
        </div>
      */}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', margin: '20px auto' }}>
            <h3>{editingId ? 'Cập Nhật Hoạt Động' : 'Thêm Hoạt Động'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label>Tên Hoạt Động <span style={{ color: 'red' }}>*</span></label>
                <input type="text" value={formData.tenhoatdong} onChange={(e) => setFormData({ ...formData, tenhoatdong: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Loại Hoạt Động</label>
                <input type="text" value={formData.loaihoatdong} onChange={(e) => setFormData({ ...formData, loaihoatdong: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Ngày Bắt Đầu</label>
                <input type="date" value={formData.ngaybd} onChange={(e) => setFormData({ ...formData, ngaybd: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Ngày Kết Thúc</label>
                <input type="date" value={formData.ngaykt} onChange={(e) => setFormData({ ...formData, ngaykt: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Địa Điểm</label>
                <input type="text" value={formData.diadiem} onChange={(e) => setFormData({ ...formData, diadiem: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {editingId ? 'Cập Nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivities;
