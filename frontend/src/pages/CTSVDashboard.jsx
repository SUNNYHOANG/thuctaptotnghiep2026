import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: '#fff', border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`,
    borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ fontSize: 32 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? '...'}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const QuickLink = ({ to, icon, label, color, desc }) => (
  <Link to={to} style={{ display: 'block', background: color, color: 'white', padding: 16,
    borderRadius: 8, textDecoration: 'none', transition: 'opacity .2s' }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
    {desc && <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>{desc}</div>}
  </Link>
);

const CTSVDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [donRes, drlRes, phucKhaoRes, hoatDongRes] = await Promise.allSettled([
          api.get('/don-online/stats/summary'),
          api.get('/drl-self/manage', { params: { trangthai: 'choduyet' } }),
          api.get('/phuc-khao', { params: { trangthai: 'cho' } }),
          api.get('/student-activities/ctsv/pending'),
        ]);
        const donData = donRes.status === 'fulfilled' ? donRes.value.data : {};
        const donCho = donData?.byTrangthai?.find(r => r.trangthai === 'cho')?.cnt || 0;
        const donDangXuly = donData?.byTrangthai?.find(r => r.trangthai === 'dangxuly')?.cnt || 0;

        const drlData = drlRes.status === 'fulfilled' ? drlRes.value.data : {};
        const drlChoduyet = Array.isArray(drlData?.data) ? drlData.data.length : (drlData?.total || 0);

        const phucKhaoData = phucKhaoRes.status === 'fulfilled' ? phucKhaoRes.value.data : [];
        const phucKhaoCho = Array.isArray(phucKhaoData) ? phucKhaoData.length : 0;

        const hoatDongData = hoatDongRes.status === 'fulfilled' ? hoatDongRes.value.data : [];
        const hoatDongCho = Array.isArray(hoatDongData) ? hoatDongData.length : 0;

        setStats({ donCho, donDangXuly, drlChoduyet, phucKhaoCho, hoatDongCho });
      } catch { setStats({}); } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🏢 Dashboard Phòng CTSV</h1>
          <p style={{ color: '#666', marginTop: 4 }}>Xin chào, <strong>{user?.hoten || user?.username}</strong></p>
        </div>

        {/* Thống kê nhanh */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard label="Đơn online chờ xử lý" value={loading ? '...' : stats.donCho} color="#e67e22" icon="📋" />
          <StatCard label="Đơn đang xử lý" value={loading ? '...' : stats.donDangXuly} color="#3498db" icon="⏳" />
          <StatCard label="Phiếu DRL chờ duyệt" value={loading ? '...' : stats.drlChoduyet} color="#9b59b6" icon="📝" />
          <StatCard label="Phúc khảo chờ xử lý" value={loading ? '...' : stats.phucKhaoCho} color="#e74c3c" icon="🔄" />
          <StatCard label="Hoạt động chờ duyệt" value={loading ? '...' : stats.hoatDongCho} color="#27ae60" icon="🎯" />
        </div>

        {/* Chức năng nhanh */}
        <h3 style={{ marginBottom: 12, color: '#444' }}>Chức năng</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <QuickLink to="/ctsv/duyet-don-online" icon="📋" label="Duyệt đơn online" color="#e67e22" desc="Xem & xử lý đơn SV" />
          <QuickLink to="/ctsv/duyet-phuc-khao" icon="🔄" label="Duyệt phúc khảo" color="#e74c3c" desc="Xử lý đơn phúc khảo" />
          <QuickLink to="/ctsv/duyet-dang-ky-hoat-dong" icon="🎯" label="Duyệt hoạt động" color="#27ae60" desc="Duyệt đăng ký HĐ" />
          <QuickLink to="/ctsv/diem-ren-luyen-tu-danh-gia" icon="📝" label="Duyệt phiếu DRL" color="#9b59b6" desc="Duyệt & chốt điểm" />
          <QuickLink to="/ctsv/quan-ly-diem-ren-luyen" icon="📊" label="Quản lý DRL" color="#2980b9" desc="Tổng hợp điểm RL" />
          <QuickLink to="/ctsv/thong-ke-drl" icon="📈" label="Thống kê DRL" color="#16a085" desc="Báo cáo thống kê" />
          <QuickLink to="/ctsv/xet-hoc-bong" icon="🎓" label="Duyệt học bổng" color="#8e44ad" desc="Duyệt học bổng SV" />
          <QuickLink to="/ctsv/khen-thuong-ky-luat" icon="⭐" label="Khen thưởng/KL" color="#c0392b" desc="Khen thưởng, kỷ luật" />
          <QuickLink to="/ctsv/nhac-nho" icon="📨" label="Gửi nhắc nhở" color="#1abc9c" desc="Nhắc nhở SV" />
          <QuickLink to="/ctsv/bao-cao" icon="📤" label="Xuất báo cáo" color="#7f8c8d" desc="Xuất Excel/PDF" />
          <QuickLink to="/admin/thong-bao" icon="📢" label="Thông báo" color="#2c3e50" desc="Đăng thông báo" />
        </div>
      </div>
    </div>
  );
};

export default CTSVDashboard;
