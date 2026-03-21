import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const TeacherProfile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ hoten: '', email: '', sodienthoai: '', diachi: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get(`/users/profile`);
      const data = res.data || {};
      setProfile(data);
      setForm({
        hoten: data.hoten || '',
        email: data.email || '',
        sodienthoai: data.sodienthoai || '',
        diachi: data.diachi || '',
      });
    } catch {
      // fallback từ user context
      setForm({
        hoten: user?.hoten || '',
        email: user?.email || '',
        sodienthoai: user?.sodienthoai || '',
        diachi: user?.diachi || '',
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/users/profile', form);
      setMessage('✅ Cập nhật thông tin thành công.');
      setEditing(false);
      loadProfile();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi lưu.'));
    } finally { setSaving(false); }
  };

  const displayData = profile || user || {};

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="card-title">👨‍🏫 Hồ sơ cá nhân</h1>
          {!editing && (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Chỉnh sửa</button>
          )}
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ margin: '8px 0' }}>
            {message}
          </div>
        )}

        {/* Avatar + thông tin cơ bản */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3498db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: 'white', fontWeight: 700, flexShrink: 0 }}>
            {(displayData.hoten || displayData.username || 'GV').split(' ').slice(-1)[0]?.[0]?.toUpperCase() || 'G'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{displayData.hoten || displayData.username}</div>
            <div style={{ color: '#666', marginTop: 4 }}>
              <span style={{ background: '#d6eaf8', color: '#2980b9', padding: '2px 10px', borderRadius: 12, fontSize: 13 }}>Giảng viên</span>
              {displayData.makhoa && (
                <span style={{ background: '#fef9e7', color: '#e67e22', padding: '2px 10px', borderRadius: 12, fontSize: 13, marginLeft: 8 }}>
                  Khoa {displayData.makhoa}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
              Tài khoản: <strong>{displayData.username}</strong>
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-control" value={form.hoten}
                  onChange={e => setForm({ ...form, hoten: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-control" value={form.sodienthoai}
                  onChange={e => setForm({ ...form, sodienthoai: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="form-control" value={form.diachi}
                  onChange={e => setForm({ ...form, diachi: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); loadProfile(); }}>
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-2">
            {[
              ['Họ và tên', displayData.hoten],
              ['Tên đăng nhập', displayData.username],
              ['Email', displayData.email],
              ['Số điện thoại', displayData.sodienthoai],
              ['Địa chỉ', displayData.diachi],
              ['Khoa', displayData.makhoa],
              ['Vai trò', 'Giảng viên'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 15, color: value ? '#333' : '#bbb' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;
