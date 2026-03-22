import React, { useState, useEffect } from 'react';
import { scoreAPI, drlSelfAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import './Score.css';

const getScoreLevel = (score) => {
  if (score >= 90) return { label: 'Xuất sắc', color: 'excellent' };
  if (score >= 80) return { label: 'Tốt', color: 'good' };
  if (score >= 70) return { label: 'Khá', color: 'fair' };
  if (score >= 60) return { label: 'Đạt', color: 'pass' };
  return { label: 'Chưa Đạt', color: 'fail' };
};

const statusLabel = (trangthai, nguoi_duyet_ctsv) => {
  if (trangthai === 'bituchoi') return { text: 'Bị từ chối', color: '#dc2626' };
  if (trangthai === 'choduyet') return { text: 'Chờ GV duyệt', color: '#6b7280' };
  if (trangthai === 'chokhoaduyet') return { text: 'Chờ Khoa duyệt', color: '#d97706' };
  if (trangthai === 'daduyet' && !nguoi_duyet_ctsv) return { text: 'Chờ CTSV chốt', color: '#2563eb' };
  if (trangthai === 'daduyet' && nguoi_duyet_ctsv) return { text: '✅ Đã chốt chính thức', color: '#15803d' };
  return { text: trangthai, color: '#374151' };
};

const ScorePage = () => {
  const [phieuList, setPhieuList] = useState([]);  // tất cả phiếu DRL của SV
  const [scoreMap, setScoreMap] = useState({});    // mahocky -> điểm chính thức
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadAll = async () => {
    if (!user?.mssv) return;
    setLoading(true);
    try {
      const [phieuRes, scoreRes] = await Promise.all([
        drlSelfAPI.getByStudent(user.mssv),
        scoreAPI.getByStudent(user.mssv),
      ]);
      setPhieuList(phieuRes.data || []);
      const map = {};
      (scoreRes.data || []).forEach((s) => { map[s.mahocky] = s; });
      setScoreMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [user]);

  // Realtime: tự reload khi điểm DRL được cập nhật
  useSocketEvent(['drl_score', 'drl:reviewed'], loadAll);

  const toggleExpand = (mahocky) => setExpanded((p) => (p === mahocky ? null : mahocky));

  if (loading) return <div className="score-container"><div className="loading">Đang tải...</div></div>;
  if (phieuList.length === 0) return (
    <div className="score-container">
      <h1>Điểm Rèn Luyện</h1>
      <div className="empty-state">Chưa có phiếu tự đánh giá nào</div>
    </div>
  );

  return (
    <div className="score-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Điểm Rèn Luyện</h1>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}
        >
          🔄 Làm mới
        </button>
      </div>
      <div className="scores-table-wrapper">
        <table className="scores-table">
          <thead>
            <tr>
              <th>Học Kỳ</th>
              <th>Năm Học</th>
              <th>Điểm tự đánh giá</th>
              <th>Điểm chính thức</th>
              <th>Xếp loại</th>
              <th>Trạng thái</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {phieuList.map((phieu) => {
              const score = scoreMap[phieu.mahocky];
              const finalScore = score?.diemtong ?? null;
              const level = finalScore != null ? getScoreLevel(finalScore) : null;
              const st = statusLabel(phieu.trangthai, phieu.nguoi_duyet_ctsv);
              const isOpen = expanded === phieu.mahocky;
              return (
                <React.Fragment key={phieu.id}>
                  <tr>
                    <td>{phieu.tenhocky}</td>
                    <td>{phieu.namhoc}</td>
                    <td className="text-center">{phieu.tong_diem ?? '—'}</td>
                    <td className={`text-center font-bold${level ? ` level-${level.color}` : ''}`}>
                      {finalScore != null ? Number(finalScore).toFixed(1) : '—'}
                    </td>
                    <td className={`text-center font-bold${level ? ` level-${level.color}` : ''}`}>
                      {level ? level.label : '—'}
                    </td>
                    <td className="text-center">
                      <span style={{ color: st.color, fontWeight: 500, fontSize: 13 }}>{st.text}</span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(phieu.mahocky)}
                        style={{
                          background: 'none', border: '1px solid #3b82f6',
                          color: '#3b82f6', borderRadius: 4, padding: '2px 10px',
                          cursor: 'pointer', fontSize: 13,
                        }}
                      >
                        {isOpen ? '▲ Ẩn' : '▼ Xem'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0, background: '#f8faff' }}>
                        <div style={{ padding: '12px 20px' }}>
                          <DetailPanel phieu={phieu} score={score} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MUC_DIEM = [
  { label: '1. Ý thức học tập', key: 'diem_ythuc_hoc_tap', max: 20 },
  { label: '2. Chấp hành nội quy', key: 'diem_noi_quy', max: 25 },
  { label: '3. Tham gia hoạt động', key: 'diem_hoat_dong', max: 20 },
  { label: '4. Công tác cộng đồng', key: 'diem_cong_dong', max: 25 },
  { label: '5. Khen thưởng / Kỷ luật', key: 'diem_khen_thuong_ky_luat', max: 10 },
];

const DetailPanel = ({ phieu, score }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

    {/* Sinh viên */}
    <div style={panelStyle('#e2e8f0')}>
      <div style={titleStyle('#374151')}>📝 Sinh viên tự đánh giá</div>
      {MUC_DIEM.map((m) => (
        <Row key={m.key} label={`${m.label} (/${m.max}đ)`} value={phieu[m.key] ?? '—'} />
      ))}
      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6 }}>
        <Row label="Tổng tự đánh giá" value={<strong>{phieu.tong_diem ?? '—'}</strong>} />
      </div>
      {phieu.nhan_xet_sv && <Note text={phieu.nhan_xet_sv} />}
    </div>

    {/* CVHT */}
    <div style={panelStyle('#bfdbfe')}>
      <div style={titleStyle('#1d4ed8')}>👨‍🏫 Giảng viên / CVHT</div>
      {phieu.nguoi_duyet_cvht ? (
        <>
          <Row label="Người duyệt" value={phieu.nguoi_duyet_cvht} />
          <Row label="Điểm chấm" value={<strong style={{ color: '#1d4ed8', fontSize: 15 }}>{phieu.diem_cvht ?? '—'}</strong>} />
          {phieu.nhan_xet_cvht && <Note text={phieu.nhan_xet_cvht} />}
        </>
      ) : <Pending />}
    </div>

    {/* Khoa */}
    <div style={panelStyle('#fde68a')}>
      <div style={titleStyle('#b45309')}>🏛️ Ban Quản Lý Khoa</div>
      {phieu.nguoi_duyet_khoa ? (
        <>
          <Row label="Người duyệt" value={phieu.nguoi_duyet_khoa} />
          <Row label="Điểm chấm" value={<strong style={{ color: '#b45309', fontSize: 15 }}>{phieu.diem_khoa ?? '—'}</strong>} />
          {phieu.nhan_xet_khoa && <Note text={phieu.nhan_xet_khoa} />}
        </>
      ) : <Pending />}
    </div>

    {/* CTSV */}
    <div style={panelStyle(phieu.nguoi_duyet_ctsv ? '#bbf7d0' : '#e2e8f0')}>
      <div style={titleStyle('#15803d')}>✅ Phòng CTSV (chốt cuối)</div>
      {phieu.nguoi_duyet_ctsv ? (
        <>
          <Row label="Người chốt" value={phieu.nguoi_duyet_ctsv} />
          <Row label="Điểm chính thức" value={
            <strong style={{ color: '#15803d', fontSize: 16 }}>{phieu.diem_ctsv ?? score?.diemtong ?? '—'}</strong>
          } />
          {score?.xeploai && <Row label="Xếp loại" value={<strong>{score.xeploai}</strong>} />}
          {phieu.nhan_xet_ctsv && <Note text={phieu.nhan_xet_ctsv} />}
          <div style={{ marginTop: 8, padding: '6px 8px', background: '#dcfce7', borderRadius: 4, fontSize: 12, color: '#15803d' }}>
            🔒 Điểm đã chốt — không thể chỉnh sửa
          </div>
        </>
      ) : <Pending text="Chưa chốt điểm" />}
    </div>

  </div>
);

const panelStyle = (borderColor) => ({
  flex: '1 1 200px', background: '#fff', borderRadius: 8,
  padding: 12, border: `1px solid ${borderColor}`,
});
const titleStyle = (color) => ({ fontWeight: 600, marginBottom: 8, color, fontSize: 14 });
const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, gap: 8 }}>
    <span style={{ color: '#555' }}>{label}</span>
    <span>{value}</span>
  </div>
);
const Note = ({ text }) => (
  <div style={{ marginTop: 6, fontSize: 12, color: '#666', fontStyle: 'italic', borderTop: '1px solid #f0f0f0', paddingTop: 4 }}>
    Nhận xét: {text}
  </div>
);
const Pending = ({ text = 'Chưa duyệt' }) => (
  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>{text}</div>
);

export default ScorePage;
