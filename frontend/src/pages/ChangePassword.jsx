import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ matkhau_cu: '', matkhau_moi: '', xac_nhan: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.matkhau_moi !== form.xac_nhan) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    if (form.matkhau_moi.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        matkhau_cu: form.matkhau_cu,
        matkhau_moi: form.matkhau_moi,
      });
      setSuccess('Đổi mật khẩu thành công!');
      setForm({ matkhau_cu: '', matkhau_moi: '', xac_nhan: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card" style={{ padding: '28px 32px' }}>
        <h2 style={{ marginBottom: 6 }}>Đổi mật khẩu</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
          Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mật khẩu hiện tại</label>
            <input
              type="password"
              name="matkhau_cu"
              className="form-control"
              value={form.matkhau_cu}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <input
              type="password"
              name="matkhau_moi"
              className="form-control"
              value={form.matkhau_moi}
              onChange={handleChange}
              required
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              name="xac_nhan"
              className="form-control"
              value={form.xac_nhan}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
