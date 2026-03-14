import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPIEndpoints } from '../api/authAPI';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    hoten: '',
    role: 'sinhvien',
    mssv: '',
    magiangvien: '',
    makhoa: '',
    malop: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData({
      ...formData,
      role: role,
      mssv: role === 'sinhvien' ? formData.mssv : '',
      magiangvien: role === 'giangvien' ? formData.magiangvien : '',
      malop: role === 'sinhvien' ? formData.malop : ''
    });
  };

  const validateForm = () => {
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return false;
      }
      
      // Django requires password2 field
      if (!formData.confirmPassword) {
        setError('Vui lòng xác nhận mật khẩu');
        return false;
      }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.role === 'sinhvien' && !formData.mssv) {
      setError('Vui lòng nhập mã sinh viên');
      return false;
    }

    if (formData.role === 'giangvien' && !formData.magiangvien) {
      setError('Vui lòng nhập mã giảng viên');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare data based on role (Django requires password2)
      const submitData = {
        username: formData.username,
        password: formData.password,
        password2: formData.confirmPassword, // Django requires password2
        email: formData.email,
        hoten: formData.hoten,
        role: formData.role,
        makhoa: formData.makhoa
      };

      if (formData.role === 'sinhvien') {
        submitData.mssv = formData.mssv;
        submitData.malop = formData.malop;
      } else if (formData.role === 'giangvien') {
        submitData.magiangvien = formData.magiangvien;
      }

      await authAPIEndpoints.register(submitData);
      setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.code === 'ERR_NETWORK' ? 'Không kết nối được server. Kiểm tra backend đã chạy chưa (port 5000).' : err.message)
        || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Tạo tài khoản</h1>
            <p>Đăng ký nhanh cho sinh viên, giảng viên hoặc quản trị viên.</p>
          </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form register-form">
          <div className="form-group">
            <label className="form-label">Vai trò *</label>
            <select
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleRoleChange}
              required
            >
              <option value="sinhvien">Sinh viên</option>
              <option value="giangvien">Giảng viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input
              type="text"
              name="hoten"
              className="form-control"
              value={formData.hoten}
              onChange={handleChange}
              required
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className="form-row two-cols">
            <div className="form-group">
              <label className="form-label">Tên đăng nhập *</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Nhập email"
              />
            </div>
          </div>

          {formData.role === 'sinhvien' && (
            <>
              <div className="form-row two-cols">
                <div className="form-group">
                  <label className="form-label">Mã sinh viên *</label>
                  <input
                    type="text"
                    name="mssv"
                    className="form-control"
                    value={formData.mssv}
                    onChange={handleChange}
                    required
                    placeholder="Nhập mã sinh viên"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã lớp</label>
                  <input
                    type="text"
                    name="malop"
                    className="form-control"
                    value={formData.malop}
                    onChange={handleChange}
                    placeholder="Nhập mã lớp"
                  />
                </div>
              </div>
            </>
          )}

          {formData.role === 'giangvien' && (
            <div className="form-group">
              <label className="form-label">Mã giảng viên *</label>
              <input
                type="text"
                name="magiangvien"
                className="form-control"
                value={formData.magiangvien}
                onChange={handleChange}
                required
                placeholder="Nhập mã giảng viên"
              />
            </div>
          )}

          <div className="form-row two-cols">
            <div className="form-group">
              <label className="form-label">Mã khoa</label>
              <input
                type="text"
                name="makhoa"
                className="form-control"
                value={formData.makhoa}
                onChange={handleChange}
                placeholder="Nhập mã khoa"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu *</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu *</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Register;
