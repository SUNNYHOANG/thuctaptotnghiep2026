import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authAPIEndpoints } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8001';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({ username: '', password: '' });
    setError('');
    setFaceError('');
  };

  // Camera: bật khi mở modal, tắt khi đóng
  useEffect(() => {
    if (!faceModalOpen) return;
    const startCamera = async () => {
      try {
        // Yêu cầu độ phân giải cao hơn (giống Streamlit) - nhận diện chính xác hơn
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });
        streamRef.current = stream;
        setVideoReady(false);
        if (videoRef.current) {
          const video = videoRef.current;
          video.onloadedmetadata = () => setVideoReady(true);
          video.srcObject = stream;
        }
      } catch (err) {
        setFaceError('Không thể truy cập camera. Vui lòng cho phép quyền camera.');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [faceModalOpen]);

  const handleFaceLogin = async () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setFaceError('Camera chưa sẵn sàng. Vui lòng đợi vài giây rồi thử lại.');
      return;
    }
    setFaceLoading(true);
    setFaceError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      // JPEG chất lượng cao (PNG có thể quá nặng, gây lỗi)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      const { data } = await axios.post(`${FACE_API_URL}/recognize`, {
        image_base64: dataUrl,
        flip_webcam: true  // Webcam selfie mirror, lật để khớp dữ liệu Streamlit
      });

      if (!data.identifier) {
        setFaceError(data.error || 'Không nhận diện được');
        return;
      }

      const response = await authAPIEndpoints.faceLogin(data.identifier);
      const token = response.data.access_token;
      login(token, response.data.user);
      setFaceModalOpen(false);

      const role = response.data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'giangvien') navigate('/giangvien/dashboard');
      else if (role === 'ctsv') navigate('/ctsv/dashboard');
      else navigate('/');
    } catch (err) {
      const msg =
        err.code === 'ERR_NETWORK'
          ? 'Không kết nối được service nhận diện khuôn mặt. Vui lòng chạy npm run dev.'
          : err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setFaceError(msg);
    } finally {
      setFaceLoading(false);
    }
  };

  const closeFaceModal = () => {
    setFaceModalOpen(false);
    setFaceError('');
    setFaceLoading(false);
    setVideoReady(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (userType === 'student') {
        // Sinh viên login
        response = await authAPIEndpoints.login(formData);
      } else {
        // Admin/Giảng viên login
        response = await authAPIEndpoints.loginStaff(formData);
      }

      const token = response.data.access_token;
      login(token, response.data.user);
      
      // Store refresh token if available
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'giangvien') {
        navigate('/giangvien/dashboard');
      } else if (role === 'ctsv') {
        navigate('/ctsv/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-main">
        <div className="login-card">
          <div className="login-card-left">
            <div className="login-card-header">
              <h1>Đăng nhập hệ thống</h1>
              <p>Chọn loại tài khoản để xem giao diện & phân quyền.</p>
            </div>

            <div className="login-inner-panel">
              <div className="login-account-type">
                <label className="form-label">Loại tài khoản</label>
                <div className="login-account-type-switch">
                  <button
                    type="button"
                    className={`type-pill ${userType === 'student' ? 'active' : ''}`}
                    onClick={() => handleUserTypeChange('student')}
                  >
                    Sinh viên
                  </button>
                  <button
                    type="button"
                    className={`type-pill ${userType === 'staff' ? 'active' : ''}`}
                    onClick={() => handleUserTypeChange('staff')}
                  >
                    Giảng viên / CTSV / Admin
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form login-form">
                <div className="form-group">
                  <label className="form-label">
                    {userType === 'student' ? 'Tên đăng nhập (MSSV)' : 'Tên đăng nhập'}
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="form-control login-input"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder={userType === 'student' ? 'vd: 20123456' : 'Nhập tên đăng nhập'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control login-input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                <p className="login-demo-note">
                  Đây là bản demo giao diện frontend, chưa kết nối với backend thực tế.
                </p>

                <button
                  type="submit"
                  className="btn btn-primary btn-block login-submit"
                  disabled={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                {userType === 'student' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-block login-face-btn"
                    onClick={() => setFaceModalOpen(true)}
                    disabled={loading}
                  >
                    📷 Đăng nhập bằng khuôn mặt
                  </button>
                )}
              </form>

              {userType === 'student' && (
                <div className="auth-footer login-footer-note">
                  <p>
                    Chưa có tài khoản?{' '}
                    <Link to="/register" className="auth-link">
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <div className="login-sample-box">
              {userType === 'student' ? (
                <>
                  <h4>Thông tin đăng nhập mẫu (Sinh viên)</h4>
                  <p><strong>MSSV:</strong> 20123456</p>
                  <p><strong>Mật khẩu:</strong> 123456</p>
                </>
              ) : (
                <>
                  <h4>Thông tin đăng nhập mẫu (Nhân sự)</h4>
                  <p><strong>Username:</strong> admin</p>
                  <p><strong>Mật khẩu:</strong> admin123</p>
                </>
              )}
            </div>
          </div>

          <div className="login-card-right">
            <h3>4 phân quyền chính</h3>
            <ul>
              <li>
                <strong>Sinh viên</strong> – tự đánh giá DRL, xem hoạt động, học bổng, hồ sơ cá nhân.
              </li>
              <li>
                <strong>Giảng viên (CVHT)</strong> – nhập điểm rèn luyện, quản lý sinh viên lớp.
              </li>
              <li>
                <strong>Phòng CTSV</strong> – duyệt đơn online, quản lý DRL & khen thưởng / kỷ luật.
              </li>
              <li>
                <strong>Admin</strong> – phân quyền, quản lý người dùng, hoạt động, báo cáo thống kê.
              </li>
            </ul>
            <div className="login-right-note">
              <p className="login-hint">
                Lưu ý: Chọn role rồi bấm đăng nhập để chuyển sang giao diện tương ứng.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal đăng nhập khuôn mặt */}
      {faceModalOpen && (
        <div className="face-modal-overlay" onClick={closeFaceModal}>
          <div className="face-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Đăng nhập bằng khuôn mặt</h3>
            <p className="face-modal-hint">Đưa mặt vào khung, đảm bảo ánh sáng tốt, rồi nhấn Nhận diện.</p>
            {faceError && (
              <div className="alert alert-error">{faceError}</div>
            )}
            <div className="face-video-wrap">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="face-video"
              />
            </div>
            <div className="face-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeFaceModal}
                disabled={faceLoading}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFaceLogin}
                disabled={faceLoading || !videoReady}
              >
                {faceLoading ? 'Đang nhận diện...' : 'Nhận diện & Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
