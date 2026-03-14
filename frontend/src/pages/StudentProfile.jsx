import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentProfileAPI } from '../api/api';
import './StudentProfile.css';

const StudentProfile = () => {
  const { user } = useAuth();
  const mssv = user?.mssv || user?.id;
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    hoten: '',
    malop: '',
    makhoa: '',
    diachi: '',
    ngaysinh: '',
    quequan: '',
    tinhtrang: '',
    gioitinh: '',
    khoahoc: '',
    bacdaotao: '',
    nganh: '',
  });
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
      const data = res.data;
      setProfile(data);
      setForm({
        hoten: data.hoten || '',
        malop: data.malop || '',
        makhoa: data.makhoa || '',
        diachi: data.diachi || '',
        ngaysinh: data.ngaysinh || '',
        quequan: data.quequan || '',
        tinhtrang: data.tinhtrang || '',
        gioitinh: data.gioitinh || '',
        khoahoc: data.khoahoc || '',
        bacdaotao: data.bacdaotao || '',
        nganh: data.nganh || '',
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
      await studentProfileAPI.update(mssv, {
        hoten: form.hoten,
        malop: form.malop,
        makhoa: form.makhoa,
        diachi: form.diachi || null,
        ngaysinh: form.ngaysinh || null,
        quequan: form.quequan || null,
        tinhtrang: form.tinhtrang || null,
        gioitinh: form.gioitinh || null,
        khoahoc: form.khoahoc || null,
        bacdaotao: form.bacdaotao || null,
        nganh: form.nganh || null,
      });
      setProfile((p) => ({ ...p, ...form }));
      setEdit(false);
      setMessage('Đã lưu hồ sơ.');
    } catch (e) {
      setMessage(e.response?.data?.error || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEdit(false);
    if (profile) {
      setForm({
        hoten: profile.hoten || '',
        malop: profile.malop || '',
        makhoa: profile.makhoa || '',
        diachi: profile.diachi || '',
        ngaysinh: profile.ngaysinh || '',
        quequan: profile.quequan || '',
        tinhtrang: profile.tinhtrang || '',
        gioitinh: profile.gioitinh || '',
        khoahoc: profile.khoahoc || '',
        bacdaotao: profile.bacdaotao || '',
        nganh: profile.nganh || '',
      });
    }
  };

  if (loading) return <div className="page-card">Đang tải...</div>;
  if (!profile) return <div className="page-card">Không tìm thấy hồ sơ.</div>;

  return (
    <div className="page-card student-profile">
      <div className="student-profile__header">
        <div className="student-profile__avatar">
          {(profile.hoten || profile.mssv || '?')
            .toString()
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join('')}
        </div>
        <div className="student-profile__header-info">
          <h1>Hồ sơ cá nhân</h1>
          <p className="student-profile__subtitle">
            Sinh viên có thể xem và cập nhật một số thông tin cơ bản để đồng bộ với hệ thống.
          </p>
          <div className="student-profile__meta">
            <span><strong>MSSV:</strong> {profile.mssv}</span>
            <span><strong>Lớp:</strong> {profile.malop || '—'}</span>
            <span><strong>Khoa:</strong> {profile.makhoa || '—'}</span>
          </div>
        </div>
      </div>

      {message && <div className="student-profile__message">{message}</div>}

      <div className="student-profile__content">
        <section className="student-profile__section">
          <h2>Thông tin học tập</h2>
          {!edit ? (
            <div className="student-profile__grid">
              <div className="student-profile__field">
                <label>Họ tên</label>
                <div className="value">{profile.hoten || '—'}</div>
              </div>
              <div className="student-profile__field">
                <label>Lớp học</label>
                <div className="value">{profile.malop || '—'}</div>
              </div>
              <div className="student-profile__field">
                <label>Khoa</label>
                <div className="value">{profile.makhoa || '—'}</div>
              </div>
              <div className="student-profile__field">
                <label>Ngành</label>
                <div className="value">{profile.nganh || profile.makhoa || '—'}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="student-profile__form">
              <div className="form-row">
                <div className="form-item">
                  <label>MSSV</label>
                  <input value={profile.mssv} readOnly disabled />
                </div>
                <div className="form-item">
                  <label>Họ tên</label>
                  <input
                    value={form.hoten}
                    onChange={(e) => setForm((f) => ({ ...f, hoten: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>Lớp học</label>
                  <input
                    value={form.malop}
                    onChange={(e) => setForm((f) => ({ ...f, malop: e.target.value }))}
                  />
                </div>
                <div className="form-item">
                  <label>Khoa</label>
                  <input
                    value={form.makhoa}
                    onChange={(e) => setForm((f) => ({ ...f, makhoa: e.target.value }))}
                  />
                </div>
                <div className="form-item">
                  <label>Ngành</label>
                  <input
                    value={form.nganh}
                    onChange={(e) => setForm((f) => ({ ...f, nganh: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>Địa chỉ</label>
                  <input
                    value={form.diachi}
                    onChange={(e) => setForm((f) => ({ ...f, diachi: e.target.value }))}
                  />
                </div>
                <div className="form-item">
                  <label>Quê quán</label>
                  <input
                    value={form.quequan}
                    onChange={(e) => setForm((f) => ({ ...f, quequan: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={form.ngaysinh ? form.ngaysinh.substring(0, 10) : ''}
                    onChange={(e) => setForm((f) => ({ ...f, ngaysinh: e.target.value }))}
                  />
                </div>
                <div className="form-item">
                  <label>Giới tính</label>
                  <input
                    value={form.gioitinh}
                    onChange={(e) => setForm((f) => ({ ...f, gioitinh: e.target.value }))}
                    placeholder="Nam / Nữ / Khác"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>Khóa học</label>
                  <input
                    value={form.khoahoc}
                    onChange={(e) => setForm((f) => ({ ...f, khoahoc: e.target.value }))}
                  />
                </div>
                <div className="form-item">
                  <label>Bậc đào tạo</label>
                  <input
                    value={form.bacdaotao}
                    onChange={(e) => setForm((f) => ({ ...f, bacdaotao: e.target.value }))}
                    placeholder="Đại học / Cao đẳng..."
                  />
                </div>
              </div>

              <div className="student-profile__actions">
                <button type="button" className="btn secondary" onClick={handleCancel}>
                  Hủy
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="student-profile__section">
          <h2>Thông tin cá nhân mở rộng</h2>
          <p className="student-profile__hint">
            Các thông tin dưới đây được lưu trực tiếp trong hồ sơ sinh viên. Vui lòng cập nhật chính xác để nhà
            trường tiện liên hệ và quản lý.
          </p>
          <div className="student-profile__grid student-profile__grid--readonly">
            <div className="student-profile__field">
              <label>Địa chỉ</label>
              <div className="value">{profile.diachi || '—'}</div>
            </div>
            <div className="student-profile__field">
              <label>Ngày sinh</label>
              <div className="value">
                {profile.ngaysinh ? new Date(profile.ngaysinh).toLocaleDateString('vi-VN') : '—'}
              </div>
            </div>
            <div className="student-profile__field">
              <label>Quê quán</label>
              <div className="value">{profile.quequan || '—'}</div>
            </div>
            <div className="student-profile__field">
              <label>Tình trạng</label>
              <div className="value">{profile.tinhtrang || 'Đang học'}</div>
            </div>
            <div className="student-profile__field">
              <label>Giới tính</label>
              <div className="value">{profile.gioitinh || '—'}</div>
            </div>
            <div className="student-profile__field">
              <label>Khóa học</label>
              <div className="value">{profile.khoahoc || '—'}</div>
            </div>
            <div className="student-profile__field">
              <label>Bậc đào tạo</label>
              <div className="value">{profile.bacdaotao || '—'}</div>
            </div>
            <div className="student-profile__field">
              <label>Ngành</label>
              <div className="value">{profile.nganh || profile.makhoa || '—'}</div>
            </div>
          </div>
        </section>
      </div>

      {!edit && (
        <div className="student-profile__footer-actions">
          <button type="button" className="btn primary" onClick={() => setEdit(true)}>
            Chỉnh sửa hồ sơ
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
