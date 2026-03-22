import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentProfileAPI } from '../api/api';
import AddressPicker from '../components/AddressPicker';
import './StudentProfile.css';

const GIOI_TINH   = ['Nam', 'Nữ', 'Khác'];
const BAC_DAO_TAO = ['Đại học', 'Cao đẳng', 'Thạc sĩ', 'Tiến sĩ'];
const KHOA_HOC_LIST = ['2019','2020','2021','2022','2023','2024','2025'];

const initForm = (d = {}) => ({
  hoten:    d.hoten    || '',
  malop:    d.malop    || '',
  makhoa:   d.makhoa   || '',
  nganh:    d.nganh    || '',
  diachi:   d.diachi   || '',
  quequan:  d.quequan  || '',
  ngaysinh: d.ngaysinh || '',
  gioitinh: d.gioitinh || '',
  khoahoc:  d.khoahoc  || '',
  bacdaotao:d.bacdaotao|| '',
  tinhtrang:d.tinhtrang|| '',
});

const Avatar = ({ name, mssv }) => {
  const initials = (name || mssv || '?')
    .trim().split(/\s+/).slice(-2).map(w => w[0]?.toUpperCase()).join('');
  return <div className="sp-avatar">{initials}</div>;
};

const InfoItem = ({ label, value }) => (
  <div className="sp-info-item">
    <label>{label}</label>
    <div className={`val${value ? '' : ' val--empty'}`}>{value || '—'}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="sp-field">
    <label>{label}</label>
    {children}
  </div>
);

const StudentProfile = () => {
  const { user } = useAuth();
  const mssv = user?.mssv || user?.id;
  const [profile, setProfile] = useState(null);
  const [edit, setEdit]       = useState(false);
  const [form, setForm]       = useState(initForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => { if (mssv) load(); }, [mssv]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await studentProfileAPI.get(mssv);
      setProfile(data);
      setForm(initForm(data));
    } catch {
      setMessage({ text: 'Không tải được hồ sơ.', type: 'err' });
    } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
      await studentProfileAPI.update(mssv, payload);
      setProfile(p => ({ ...p, ...form }));
      setEdit(false);
      setMessage({ text: '✓ Đã lưu hồ sơ thành công.', type: 'ok' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Lưu thất bại.', type: 'err' });
    } finally { setSaving(false); }
  };

  const handleCancel = () => { setEdit(false); setForm(initForm(profile)); };

  if (loading) return <div className="sp-wrap" style={{ textAlign: 'center', paddingTop: 60, color: '#888' }}>Đang tải...</div>;
  if (!profile) return <div className="sp-wrap" style={{ textAlign: 'center', paddingTop: 60, color: '#888' }}>Không tìm thấy hồ sơ.</div>;

  return (
    <div className="sp-wrap">
      {/* Hero */}
      <div className="sp-hero">
        <div className="sp-hero__banner" />
        <div className="sp-hero__body">
          <Avatar name={profile.hoten} mssv={profile.mssv} />
          <div className="sp-hero__info">
            <div className="sp-hero__name">{profile.hoten || profile.mssv}</div>
            <div className="sp-hero__tags">
              <span className="sp-tag sp-tag--blue">🎓 Sinh viên</span>
              {profile.malop  && <span className="sp-tag sp-tag--green">Lớp {profile.malop}</span>}
              {profile.makhoa && <span className="sp-tag sp-tag--amber">Khoa {profile.makhoa}</span>}
              {profile.tinhtrang && <span className="sp-tag sp-tag--gray">{profile.tinhtrang}</span>}
            </div>
          </div>
          {!edit && (
            <div className="sp-hero__edit-btn">
              <button className="sp-btn sp-btn--primary" onClick={() => setEdit(true)}>✏️ Chỉnh sửa</button>
            </div>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`sp-msg sp-msg--${message.type}`}>{message.text}</div>
      )}

      {!edit ? (
        <>
          {/* Thông tin học tập */}
          <div className="sp-card">
            <div className="sp-card__title">📚 Thông tin học tập</div>
            <div className="sp-info-grid">
              <InfoItem label="MSSV"        value={profile.mssv} />
              <InfoItem label="Họ tên"      value={profile.hoten} />
              <InfoItem label="Lớp"         value={profile.malop} />
              <InfoItem label="Khoa"        value={profile.makhoa} />
              <InfoItem label="Ngành"       value={profile.nganh} />
              <InfoItem label="Khóa học"    value={profile.khoahoc} />
              <InfoItem label="Bậc đào tạo" value={profile.bacdaotao} />
            </div>
          </div>

          {/* Thông tin cá nhân */}
          <div className="sp-card">
            <div className="sp-card__title">👤 Thông tin cá nhân</div>
            <div className="sp-info-grid">
              <InfoItem label="Ngày sinh" value={profile.ngaysinh ? new Date(profile.ngaysinh).toLocaleDateString('vi-VN') : ''} />
              <InfoItem label="Giới tính" value={profile.gioitinh} />
              <InfoItem label="Địa chỉ"  value={profile.diachi} />
              <InfoItem label="Quê quán" value={profile.quequan} />
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave}>
          {/* Form học tập */}
          <div className="sp-card">
            <div className="sp-card__title">📚 Thông tin học tập</div>
            <div className="sp-form">
              <div className="sp-form-row">
                <Field label="MSSV">
                  <input value={profile.mssv} disabled />
                </Field>
                <Field label="Họ tên *">
                  <input value={form.hoten} onChange={set('hoten')} required />
                </Field>
                <Field label="Lớp học">
                  <input value={form.malop} onChange={set('malop')} />
                </Field>
              </div>
              <div className="sp-form-row">
                <Field label="Khoa">
                  <input value={form.makhoa} onChange={set('makhoa')} />
                </Field>
                <Field label="Ngành">
                  <input value={form.nganh} onChange={set('nganh')} />
                </Field>
              </div>
              <div className="sp-form-row">
                <Field label="Khóa học">
                  <select value={form.khoahoc} onChange={set('khoahoc')}>
                    <option value="">-- Chọn khóa --</option>
                    {KHOA_HOC_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Field>
                <Field label="Bậc đào tạo">
                  <select value={form.bacdaotao} onChange={set('bacdaotao')}>
                    <option value="">-- Chọn --</option>
                    {BAC_DAO_TAO.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Form cá nhân */}
          <div className="sp-card">
            <div className="sp-card__title">👤 Thông tin cá nhân</div>
            <div className="sp-form">
              <div className="sp-form-row">
                <Field label="Ngày sinh">
                  <input type="date" value={form.ngaysinh ? form.ngaysinh.substring(0,10) : ''} onChange={set('ngaysinh')} />
                </Field>
                <Field label="Giới tính">
                  <select value={form.gioitinh} onChange={set('gioitinh')}>
                    <option value="">-- Chọn --</option>
                    {GIOI_TINH.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
              <div className="sp-form-row sp-form-row--full">
                <AddressPicker label="Địa chỉ hiện tại" value={form.diachi} onChange={v => setForm(f => ({ ...f, diachi: v }))} />
              </div>
              <div className="sp-form-row sp-form-row--full">
                <AddressPicker label="Quê quán" value={form.quequan} onChange={v => setForm(f => ({ ...f, quequan: v }))} />
              </div>
            </div>
          </div>

          <div className="sp-actions">
            <button type="button" className="sp-btn sp-btn--secondary" onClick={handleCancel}>Hủy</button>
            <button type="submit" className="sp-btn sp-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentProfile;
