import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { drlSelfAPI, lookupAPI } from '../api/api';

const KhoaDashboard = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        // Lấy học kỳ hiện tại
        const hockyRes = await lookupAPI.getHocKy();
        const hockyList = hockyRes.data || [];
        if (hockyList.length === 0) {
          setPendingCount(0);
          return;
        }
        // Dùng học kỳ đầu tiên (mới nhất)
        const latestHocky = hockyList[0];
        const res = await drlSelfAPI.getByClassAndSemester('', latestHocky.mahocky);
        const records = res.data || [];
        // Đếm phiếu chokhoaduyet thuộc khoa mình
        const count = records.filter(
          (r) => r.trangthai === 'chokhoaduyet' && r.makhoa === user?.makhoa
        ).length;
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };
    if (user?.makhoa) {
      fetchPendingCount();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🏫 Dashboard Ban Quản Lý Khoa</h1>
        </div>

        <div style={{ padding: '20px 0' }}>
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <h2 style={{ marginBottom: 8 }}>Thông tin tài khoản</h2>
            <p><strong>Họ tên:</strong> {user?.hoten || user?.username || '-'}</p>
            <p><strong>Mã khoa:</strong> <span style={{ background: '#e67e22', color: 'white', padding: '2px 10px', borderRadius: 4 }}>{user?.makhoa || '-'}</span></p>
            <p><strong>Vai trò:</strong> Ban Quản Lý Khoa</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#e67e22' }}>
                {loading ? '...' : pendingCount ?? 0}
              </div>
              <div style={{ color: '#666', marginTop: 4 }}>Phiếu DRL chờ duyệt</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Link
              to="/khoa/drl-review"
              style={{
                display: 'block',
                background: '#3498db',
                color: 'white',
                padding: '20px',
                borderRadius: 8,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>Duyệt Phiếu DRL</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Xem và duyệt phiếu tự đánh giá của sinh viên</div>
            </Link>

            <Link
              to="/khoa/students"
              style={{
                display: 'block',
                background: '#27ae60',
                color: 'white',
                padding: '20px',
                borderRadius: 8,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>Danh Sách Sinh Viên</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Xem danh sách sinh viên thuộc khoa</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhoaDashboard;
