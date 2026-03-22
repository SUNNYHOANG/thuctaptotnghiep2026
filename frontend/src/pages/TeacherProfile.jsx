import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import AddressPicker from '../components/AddressPicker';

const ROLE_LABEL = { gv: 'Giảng viên', ctsv: 'Phòng CTSV', admin: 'Quản trị viên', khoa: 'Ban Quản lý Khoa' };
const ROLE_COLOR = { gv: '#1565c0', ctsv: '#2e7d32', admin: '#6a1b9a', khoa: '#e65100' };
const ROLE_BG    = { gv: '#e3f2fd', ctsv: '#e8f5e9', admin: '#f3e5f5', khoa: '#fff3e0' };

const Avatar = ({ name, username, role }) => {
  const letter = (name || username || 'U').split(' ').slice(-1)[0]?.[0]?.toUpperCase() || 'U';
  const bg = ROLE_COLOR[role] || '#1565c0';
  return (
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}cc, ${bg})`,
      color: '#fff', fontSize: '2rem', fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,.18)',
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
};

const InfoRow = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9e9e9e', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? '#212121' : '#bdbdbd', fontWeight: value ? 500 : 400, wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  </div>
);

const TeacherProfile = () => {
  const { user } = useAuth();
  const [form, setForm]       = useState({ hoten: '', email: '', sodienthoai: '', diachi: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/users/profile');
      setProfile(data);
      setForm({ hoten: data.hoten || '', email: data.email || '', sodienthoai: data.sodienthoai || '', diachi: data.diachi || '' });
    } catch {
      const d = user || {};
      setForm({ hoten: d.hoten || '', email: d.email || '', sodienthoai: d.sodienthoai || '', diachi: d.diachi || '' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put('/users/profile', form);
      setMessage({ text: '✓ Cập nhật thông tin thành công.', type: 'ok' });
      setEditing(false);
      loadProfile();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Lỗi khi lưu.', type: 'err' });
    } finally { setSaving(false); }
  };

  const d = profile || user || {};
  const role = d.role || user?.role;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'inherit' }}>

      {/* Hero card */}
      <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,.08)', marginBottom: 20 }}>
        {/* Banner */}
        <div style={{ height: 100, background: `linear-gradient(120deg, ${ROLE_COLOR[role] || '#1565c0'} 0%, #0d47a1 100%)` }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '0 28px 20px', marginTop: -40, flexWrap: 'wrap' }}>
          <Avatar name={d.hoten} username={d.username} role={role} />
          <div style={{ flex: 1, paddingTop: 44 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>
              {d.hoten || d.username}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: ROLE_BG[role] || '#e3f2fd', color: ROLE_COLOR[role] || '#1565c0' }}>
                {ROLE_LABEL[role] || role || 'Nhân viên'}
              </span>
              {d.makhoa && (
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#fff3e0', color: '#e65100' }}>
                  Khoa {d.makhoa}
                </span>
              )}
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#f3f4f6', color: '#374151' }}>
                @{d.username}
              </span>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ alignSelf: 'center', paddingTop: 44, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ padding: '8px 18px', borderRadius: 8, background: ROLE_COLOR[role] || '#1565c0', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                ✏️ Chỉnh sửa
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13.5, marginBottom: 16,
          background: message.type === 'ok' ? '#e8f5e9' : '#fce4ec',
          color:      message.type === 'ok' ? '#1b5e20' : '#880e4f',
          borderLeft: `3px solid ${message.type === 'ok' ? '#43a047' : '#e91e63'}`,
        }}>
          {message.text}
        </div>
      )}

      {!editing ? (
        /* View mode */
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,.07)', padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: ROLE_COLOR[role] || '#1565c0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Thông tin cá nhân
            <span style={{ flex: 1, height: 1, background: '#e8f0fe' }} />
          </div>
          <InfoRow icon="👤" label="Họ và tên"      value={d.hoten} />
          <InfoRow icon="🔑" label="Tên đăng nhập"  value={d.username} />
          <InfoRow icon="📧" label="Email"           value={d.email} />
          <InfoRow icon="📱" label="Số điện thoại"  value={d.sodienthoai} />
          <InfoRow icon="📍" label="Địa chỉ"        value={d.diachi} />
          {d.makhoa && <InfoRow icon="🏫" label="Khoa" value={d.makhoa} />}
        </div>
      ) : (
        /* Edit mode */
        <form onSubmit={handleSave}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,.07)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: ROLE_COLOR[role] || '#1565c0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✏️ Chỉnh sửa thông tin
              <span style={{ flex: 1, height: 1, background: '#e8f0fe' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              {[
                { label: 'Họ và tên', key: 'hoten', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Số điện thoại', key: 'sodienthoai', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13.5, background: '#fafafa', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <AddressPicker label="Địa chỉ" value={form.diachi} onChange={v => setForm(f => ({ ...f, diachi: v }))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" disabled={saving}
              onClick={() => { setEditing(false); loadProfile(); }}
              style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, background: '#f5f5f5', border: '1.5px solid #e0e0e0', color: '#444', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, background: `linear-gradient(135deg, ${ROLE_COLOR[role] || '#1565c0'}, #0d47a1)`, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)', opacity: saving ? .6 : 1 }}>
              {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TeacherProfile;
