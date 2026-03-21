import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { drlSelfAPI, lookupAPI, khenThuongKyLuatAPI } from '../api/api';

const StatCard = ({ label, value, color, icon, to }) => {
  const inner = (
    <div style={{ background: '#fff', border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`,
      borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
      textDecoration: 'none', color: 'inherit', transition: 'box-shadow .2s',
      cursor: to ? 'pointer' : 'default' }}
      onMouseEnter={e => to && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={e => to && (e.currentTarget.style.boxShadow = 'none')}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color }}>{value ?? '...'}</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
};

const QuickLink = ({ to, icon, label, color, desc }) => (
  <Link to={to} style={{ display: 'block', background: color, color: 'white', padding: 16,
    borderRadius: 8, textDecoration: 'none' }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
    {desc && <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>{desc}</div>}
  </Link>
);

const KhoaDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const hockyRes = await lookupAPI.getHocKy();
        const hockyList = hockyRes.data || [];
        const latestHk = hockyList[0];

        const results = await Promise.allSettled([
          latestHk ? drlSelfAPI.getByClassAndSemester('', latestHk.mahocky) : Promise.resolve({ data: [] }),
          khenThuongKyLuatAPI.getAll({}),
        ]);

        const drlData = results[0].status === 'fulfilled' ? (results[0].value.data || []) : [];
        const ktklData = results[1].status === 'fulfilled' ? (Array.isArray(results[1].value.data) ? results[1].value.data : []) : [];

        const khoaDrl = drlData.filter(r => !user?.makhoa || r.makhoa === user.makhoa);
        const khoaKtkl = ktklData.filter(r => !user?.makhoa || r.makhoa === user.makhoa);

        setStats({
          drlChoKhoa: khoaDrl.filter(r => r.trangthai === 'chokhoaduyet').length,
          drlTotal: khoaDrl.length,
          drlDaduyet: khoaDrl.filter(r => r.trangthai === 'daduyet' && r.nguoi_duyet_ctsv).length,
          ktklTotal: khoaKtkl.length,
          ktklKhen: khoaKtkl.filter(r => r.loai === 'khenthuong').length,
          ktklKyluat: khoaKtkl.filter(r => r.loai === 'kyluat').length,
          hocky: latestHk?.tenhocky,
        });
      } catch { setStats({}); } finally { setLoading(false); }
    };
    if (user?.makhoa) load(); else setLoading(false);
  }, [user]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🏫 Dashboard Ban Quản Lý Khoa</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Xin chào, <strong>{user?.hoten || user?.username}</strong> —
            Khoa: <span style={{ background: '#e67e22', color: 'white', padding: '2px 10px', borderRadius: 4, marginLeft: 4 }}>{user?.makhoa}</span>
          </p>
        </div>

        {stats.hocky && (
          <div style={{ background: '#e8f4fd', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#2980b9' }}>
            📅 Học kỳ hiện tại: <strong>{stats.hocky}</strong>
          </div>
        )}

        {/* Thống kê */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Phiếu DRL chờ Khoa duyệt" value={loading ? '...' : stats.drlChoKhoa} color="#f39c12" icon="⏳" to="/khoa/drl-review" />
          <StatCard label="Tổng phiếu DRL học kỳ này" value={loading ? '...' : stats.drlTotal} color="#3498db" icon="📝" to="/khoa/drl-stats" />
          <StatCard label="Phiếu đã duyệt cuối" value={loading ? '...' : stats.drlDaduyet} color="#27ae60" icon="✅" />
          <StatCard label="Khen thưởng" value={loading ? '...' : stats.ktklKhen} color="#8e44ad" icon="⭐" to="/khoa/khen-thuong" />
          <StatCard label="Kỷ luật" value={loading ? '...' : stats.ktklKyluat} color="#e74c3c" icon="⚠️" to="/khoa/khen-thuong" />
        </div>

        {/* Chức năng */}
        <h3 style={{ marginBottom: 12, color: '#444' }}>Chức năng</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <QuickLink to="/khoa/drl-review" icon="📋" label="Duyệt Phiếu DRL" color="#3498db" desc="Xem & duyệt phiếu SV" />
          <QuickLink to="/khoa/drl-stats" icon="📊" label="Thống kê DRL" color="#9b59b6" desc="Phân tích điểm rèn luyện" />
          <QuickLink to="/khoa/students" icon="🎓" label="Danh sách SV" color="#27ae60" desc="SV thuộc khoa" />
          <QuickLink to="/khoa/khen-thuong" icon="⭐" label="Khen thưởng/KL" color="#e67e22" desc="Xem khen thưởng, kỷ luật" />
          <QuickLink to="/khoa/hoc-bong" icon="💰" label="Học bổng" color="#8e44ad" desc="Xem học bổng SV" />
          <QuickLink to="/khoa/thong-bao" icon="📢" label="Thông báo" color="#2c3e50" desc="Đăng thông báo khoa" />
        </div>
      </div>
    </div>
  );
};

export default KhoaDashboard;
