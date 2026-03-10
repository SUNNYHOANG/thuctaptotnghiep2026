import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentProfileAPI } from '../api/api';
import './StudentProfile.css';

const StudentProfile = () => {
  const { user } = useAuth();
  const mssv = user?.mssv || user?.id;
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ hoten: '', malop: '', makhoa: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mssv) load();
  }, [mssv]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await studentProfileAPI.get(mssv);
      setProfile(res.data);
      setForm({
        hoten: res.data.hoten || '',
        malop: res.data.malop || '',
        makhoa: res.data.makhoa || '',
      });
    } catch (e) {
      setMessage('Không tải được hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      await studentProfileAPI.update(mssv, form);
      setProfile((p) => ({ ...p, ...form }));
      setEdit(false);
      setMessage('Đã lưu.');
    } catch (e) {
      setMessage(e.response?.data?.error || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-card">Đang tải...</div>;
  if (!profile) return <div className="page-card">Không tìm thấy hồ sơ.</div>;

  return (
    <div className="page-card student-profile">
      <h1>Hồ sơ cá nhân (Lý lịch sinh viên)</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>Sinh viên có quyền xem, sửa và cập nhật thông tin cá nhân.</p>
      {message && <div className="message">{message}</div>}
      {!edit ? (
        <div className="profile-view">
          <p><strong>MSSV:</strong> {profile.mssv}</p>
          <p><strong>Họ tên:</strong> {profile.hoten}</p>
          <p><strong>Lớp:</strong> {profile.malop || '—'}</p>
          <p><strong>Khoa:</strong> {profile.makhoa || '—'}</p>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={() => setEdit(true)}>Chỉnh sửa</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="profile-form">
          <div style={{ marginBottom: 12 }}>
            <label>MSSV</label>
            <input value={profile.mssv} readOnly disabled style={{ background: '#f5f5f5' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Họ tên</label>
            <input value={form.hoten} onChange={(e) => setForm((f) => ({ ...f, hoten: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Lớp</label>
            <input value={form.malop} onChange={(e) => setForm((f) => ({ ...f, malop: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Khoa</label>
            <input value={form.makhoa} onChange={(e) => setForm((f) => ({ ...f, makhoa: e.target.value }))} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            <button type="button" className="btn secondary" onClick={() => { setEdit(false); setForm({ hoten: profile.hoten, malop: profile.malop, makhoa: profile.makhoa }); }}>Hủy</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentProfile;
