import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tenmonhoc: '',
    sotinchi: 3,
    mota: '',
    makhoa: '',
    hocphi: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await adminAPIEndpoints.getCourses();
      console.log('fetchCourses response:', response);
      const items = response.data || [];
      console.log('courses items:', items);
      setCourses(items);
      console.log('setCourses called with:', items);
    } catch (err) {
      console.error('fetchCourses error:', err);
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminAPIEndpoints.updateCourse(editingId, formData);
        alert('Cập nhật thành công');
      } else {
        await adminAPIEndpoints.createCourse(formData);
        alert('Thêm môn học thành công');
      }
      setShowModal(false);
      setFormData({ tenmonhoc: '', sotinchi: 3, mota: '', makhoa: '', hocphi: 0 });
      setEditingId(null);
      fetchCourses();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = (course) => {
    setFormData(course);
    setEditingId(course.mamonhoc);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa?')) return;
    try {
      await adminAPIEndpoints.deleteCourse(id);
      alert('Xóa thành công');
      fetchCourses();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ tenmonhoc: '', sotinchi: 3, mota: '', makhoa: '', hocphi: 0 });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  console.log('AdminCourses render - courses:', courses, 'loading:', loading, 'error:', error);

  return (
    <div className="admin-page">
      <h2>📚 Quản Lý Môn Học</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowModal(true)} style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ➕ Thêm Môn Học
        </button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mã MH</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tên Môn Học</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Số Tín Chỉ</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Học Phí</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Mô Tả</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.mamonhoc} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{course.mamonhoc}</td>
                  <td style={{ padding: '10px' }}>{course.tenmonhoc}</td>
                  <td style={{ padding: '10px' }}>{course.sotinchi}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>{formatCurrency(course.hocphi)}</td>
                  <td style={{ padding: '10px' }}>{course.mota ? course.mota.substring(0, 50) + '...' : '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(course)} style={{ marginRight: '5px', background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(course.mamonhoc)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
            <h3>{editingId ? 'Cập Nhật Môn Học' : 'Thêm Môn Học'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label>Tên Môn Học <span style={{ color: 'red' }}>*</span></label>
                <input type="text" value={formData.tenmonhoc} onChange={(e) => setFormData({ ...formData, tenmonhoc: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Số Tín Chỉ</label>
                <input type="number" value={formData.sotinchi} onChange={(e) => setFormData({ ...formData, sotinchi: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Học Phí (VND)</label>
                <input type="number" value={formData.hocphi} onChange={(e) => setFormData({ ...formData, hocphi: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} min="0" step="1000" />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Mô Tả</label>
                <textarea value={formData.mota} onChange={(e) => setFormData({ ...formData, mota: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }} />
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

export default AdminCourses;
