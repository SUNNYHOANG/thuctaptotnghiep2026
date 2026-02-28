import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';

const AdminUsers = () => {
  const [userType, setUserType] = useState('staff'); // 'staff' or 'students'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    hoten: '',
    email: '',
    role: 'giangvien',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, [filters, userType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;
      if (userType === 'staff') {
        response = await adminAPIEndpoints.getUsers(filters);
      } else {
        response = await fetch('http://localhost:5000/api/users/students/all').then(r => r.json());
      }
      setUsers(response.data || []);
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminAPIEndpoints.updateUser(editingId, formData);
        alert('Cập nhật thành công');
      } else {
        await adminAPIEndpoints.createUser(formData);
        alert('Thêm người dùng thành công');
      }
      setShowModal(false);
      setFormData({ username: '', password: '', hoten: '', email: '', role: 'giangvien', status: 'active' });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = (user) => {
    setFormData(user);
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa?')) return;
    try {
      await adminAPIEndpoints.deleteUser(id);
      alert('Xóa thành công');
      fetchUsers();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ username: '', password: '', hoten: '', email: '', role: 'giangvien', status: 'active' });
  };

  return (
    <div className="admin-page">
      <h2>👥 Quản Lý Người Dùng</h2>

      {/* Tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <button 
          onClick={() => setUserType('staff')} 
          style={{ 
            padding: '10px 20px', 
            background: userType === 'staff' ? '#3498db' : '#ecf0f1', 
            color: userType === 'staff' ? 'white' : 'black',
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          👔 Cán Bộ (Admin/GV)
        </button>
        <button 
          onClick={() => setUserType('students')} 
          style={{ 
            padding: '10px 20px', 
            background: userType === 'students' ? '#27ae60' : '#ecf0f1', 
            color: userType === 'students' ? 'white' : 'black',
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          🎓 Sinh Viên
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {userType === 'staff' && (
          <>
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="giangvien">Giảng viên</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </>
        )}
        {userType === 'staff' && (
          <button onClick={() => setShowModal(true)} style={{ background: '#27ae60', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ➕ Thêm Cán Bộ
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {userType === 'staff' ? (
                  <>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Username</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Họ Tên</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vai Trò</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trạng Thái</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Hành Động</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>MSSV</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Họ Tên</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Lớp</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Khoa</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  {userType === 'staff' ? (
                    <>
                      <td style={{ padding: '10px' }}>{user.username}</td>
                      <td style={{ padding: '10px' }}>{user.hoten || '-'}</td>
                      <td style={{ padding: '10px' }}>{user.email || '-'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ background: user.role === 'admin' ? '#e74c3c' : '#3498db', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ background: user.status === 'active' ? '#27ae60' : '#95a5a6', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => handleEdit(user)} style={{ marginRight: '5px', background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(user.id)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px' }}>{user.id}</td>
                      <td style={{ padding: '10px' }}>{user.hoten || '-'}</td>
                      <td style={{ padding: '10px' }}>{user.malop || '-'}</td>
                      <td style={{ padding: '10px' }}>{user.makhoa || '-'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
            <h3>{editingId ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label>Username <span style={{ color: 'red' }}>*</span></label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required disabled={editingId} />
              </div>
              {!editingId && (
                <div style={{ marginBottom: '15px' }}>
                  <label>Mật Khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
                </div>
              )}
              <div style={{ marginBottom: '15px' }}>
                <label>Họ Tên</label>
                <input type="text" value={formData.hoten} onChange={(e) => setFormData({ ...formData, hoten: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Vai Trò</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="admin">Admin</option>
                  <option value="giangvien">Giảng Viên</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Trạng Thái</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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

export default AdminUsers;
