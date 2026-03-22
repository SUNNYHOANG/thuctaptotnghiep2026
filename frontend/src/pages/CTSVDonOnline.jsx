import React, { useState, useEffect, useCallback } from 'react';
import { dichVuAPI } from '../api/api';
import { useSocketEvent } from '../context/SocketContext';

// Enum DB thực tế: 'cho', 'dangxuly', 'duyet', 'tuchoi'
const STATUS_CONFIG = {
  cho:       { label: 'Chờ duyệt',    bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  dangxuly:  { label: 'Đang xử lý',  bg: '#e0f2fe', color: '#0369a1', dot: '#38bdf8' },
  duyet:     { label: 'Đã duyệt',    bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  tuchoi:    { label: 'Từ chối',     bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

const STATS_CONFIG = [
  { key: 'all',      label: 'Tất cả',      color: '#6366f1', icon: '📋' },
  { key: 'cho',      label: 'Chờ duyệt',   color: '#d97706', icon: '⏳' },
  { key: 'dangxuly', label: 'Đang xử lý',  color: '#0369a1', icon: '🔄' },
  { key: 'duyet',    label: 'Đã duyệt',    color: '#15803d', icon: '✅' },
  { key: 'tuchoi',   label: 'Từ chối',     color: '#dc2626', icon: '❌' },
];

const CTSVDonOnline = () => {
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchMssv, setSearchMssv]   = useState('');
  const [loaiList, setLoaiList]       = useState([]);
  const [loaiFilter, setLoaiFilter]   = useState('');
  const [selected, setSelected]       = useState(null);
  const [processing, setProcessing]   = useState(null);
  const [rejectNote, setRejectNote]   = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchList = (sf, lf) => {
    setLoading(true);
    const params = {};
    if (sf) params.trangthai = sf;
    if (lf) params.maloaidichvu = lf;
    dichVuAPI.getAll(params)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setList(data);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  const reload = () => fetchList(statusFilter, loaiFilter);

  useEffect(() => {
    dichVuAPI.getLoai().then((r) => setLoaiList(r.data?.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchList(statusFilter, loaiFilter); }, [statusFilter, loaiFilter, reloadKey]);

  // Realtime: tự reload khi có đơn mới hoặc trạng thái thay đổi
  useSocketEvent('dichvu:status', reload);

  const updateListItem = (updatedItem) => {
    const id = updatedItem?.madon ?? updatedItem?.id;
    setList(prev => prev.map(d => (d.madon ?? d.id) === id ? { ...d, ...updatedItem } : d));
    setSelected(prev => prev && (prev.madon ?? prev.id) === id ? { ...prev, ...updatedItem } : prev);
  };

  const getId = (d) => d?.madon ?? d?.id;

  const handleApprove = async (id) => {
    if (!id) { alert('Không xác định được mã đơn.'); return; }
    try {
      setProcessing(id);
      const res = await dichVuAPI.updateStatus(id, { trangthai: 'duyet' });
      updateListItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || `Cập nhật thất bại (${e.response?.status ?? 'network error'}).`);
    } finally {
      setProcessing(null);
    }
  };

  const handleSetDangXuLy = async (id) => {
    if (!id) return;
    try {
      setProcessing(id);
      const res = await dichVuAPI.updateStatus(id, { trangthai: 'dangxuly' });
      updateListItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Cập nhật thất bại.');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (don) => {
    setRejectTarget(don);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const id = getId(rejectTarget);
    if (!id) { alert('Không xác định được mã đơn.'); return; }
    try {
      setProcessing(id);
      const res = await dichVuAPI.updateStatus(id, { trangthai: 'tuchoi', ketqua: rejectNote });
      setShowRejectModal(false);
      setRejectTarget(null);
      updateListItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || `Cập nhật thất bại (${e.response?.status ?? 'network error'}).`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReset = async (id) => {
    if (!id) return;
    if (!window.confirm('Hoàn tác về trạng thái "Chờ duyệt"?')) return;
    try {
      setProcessing(id);
      const res = await dichVuAPI.updateStatus(id, { trangthai: 'cho', ketqua: null });
      updateListItem(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Cập nhật thất bại.');
    } finally {
      setProcessing(null);
    }
  };

  const stats = {
    all:      list.length,
    cho:      list.filter((d) => d.trangthai === 'cho').length,
    dangxuly: list.filter((d) => d.trangthai === 'dangxuly').length,
    duyet:    list.filter((d) => d.trangthai === 'duyet').length,
    tuchoi:   list.filter((d) => d.trangthai === 'tuchoi').length,
  };

  const filtered = list.filter((d) => {
    if (searchMssv && !(d.mssv || '').toLowerCase().includes(searchMssv.toLowerCase())) return false;
    return true;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

  const isDone = (d) => d.trangthai === 'duyet' || d.trangthai === 'tuchoi';

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          📄 Duyệt đơn dịch vụ sinh viên
        </h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          Xem và xử lý các đơn yêu cầu dịch vụ từ sinh viên
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATS_CONFIG.map((s) => (
          <div
            key={s.key}
            onClick={() => setStatusFilter(s.key === 'all' ? '' : s.key)}
            style={{
              flex: '1 1 120px', background: 'white', borderRadius: 12, padding: '16px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
              border: `2px solid ${(statusFilter === s.key || (s.key === 'all' && !statusFilter)) ? s.color : 'transparent'}`,
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1.2, marginTop: 4 }}>
              {stats[s.key]}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'white', borderRadius: 12, padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          placeholder="🔍 Tìm MSSV..."
          value={searchMssv}
          onChange={(e) => setSearchMssv(e.target.value)}
          style={{
            padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, width: 180, outline: 'none',
          }}
        />
        <select
          value={loaiFilter}
          onChange={(e) => setLoaiFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
        >
          <option value="">Tất cả loại đơn</option>
          {loaiList.map((l) => (
            <option key={l.maloaidichvu} value={l.maloaidichvu}>{l.tendichvu}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="cho">Chờ duyệt</option>
          <option value="dangxuly">Đang xử lý</option>
          <option value="duyet">Đã duyệt</option>
          <option value="tuchoi">Từ chối</option>
        </select>
        <button
          onClick={reload}
          style={{
            padding: '8px 16px', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          🔄 Tải lại
        </button>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13 }}>
          {filtered.length} đơn
        </span>
      </div>

      {/* Main layout: table + detail panel */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{
          flex: 1, background: 'white', borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              Không có đơn nào
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['MSSV', 'Họ tên', 'Loại đơn', 'Ngày gửi', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const id = getId(d);
                  const isSelected = getId(selected) === id;
                  return (
                    <tr
                      key={id}
                      onClick={() => setSelected(isSelected ? null : d)}
                      style={{
                        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : 'white',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{d.mssv}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155' }}>{d.hoten || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155' }}>
                        {d.tieude ? (
                          <span>
                            {d.tieude}
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>({d.tendichvu || d.tenloai})</span>
                          </span>
                        ) : (d.tendichvu || d.tenloai || '—')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(d.ngaygui)}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={d.trangthai} /></td>
                      <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {d.trangthai === 'cho' && (
                            <button
                              onClick={() => handleSetDangXuLy(id)}
                              disabled={processing === id}
                              style={{ padding: '5px 10px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >
                              🔄 Xử lý
                            </button>
                          )}
                          {d.trangthai !== 'duyet' && (
                            <button
                              onClick={() => handleApprove(id)}
                              disabled={processing === id}
                              style={{ padding: '5px 10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >
                              ✓ Duyệt
                            </button>
                          )}
                          {d.trangthai !== 'tuchoi' && (
                            <button
                              onClick={() => openRejectModal(d)}
                              disabled={processing === id}
                              style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >
                              ✕ Từ chối
                            </button>
                          )}
                          {isDone(d) && (
                            <button
                              onClick={() => handleReset(id)}
                              disabled={processing === id}
                              style={{ padding: '5px 10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >
                              ↩ Hoàn tác
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            width: 340, background: 'white', borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20,
            position: 'sticky', top: 20, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Chi tiết đơn</h3>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <StatusBadge status={selected.trangthai} />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Mã đơn',    selected.madon ?? selected.id],
                ['MSSV',      selected.mssv],
                ['Họ tên',    selected.hoten],
                ['Lớp',       selected.malop],
                ['Loại đơn',  selected.tendichvu || selected.tenloai],
                ['Ngày gửi',  formatDate(selected.ngaygui)],
                ['Ngày duyệt',formatDate(selected.ngayduyet)],
                ['Người duyệt',selected.nguoiduyet],
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#1e293b', marginTop: 2 }}>{value}</div>
                </div>
              ) : null)}

              {selected.tieude && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tiêu đề đơn</div>
                  <div style={{ fontSize: 14, color: '#1e293b', marginTop: 2, fontWeight: 600 }}>{selected.tieude}</div>
                </div>
              )}

              {selected.noidung_yeucau && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nội dung yêu cầu</div>
                  <div style={{
                    fontSize: 14, color: '#334155', marginTop: 4,
                    background: '#f8fafc', borderRadius: 8, padding: '10px 12px', lineHeight: 1.6,
                  }}>
                    {selected.noidung_yeucau}
                  </div>
                </div>
              )}

              {selected.ghichu && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ghi chú</div>
                  <div style={{ fontSize: 14, color: '#334155', marginTop: 2 }}>{selected.ghichu}</div>
                </div>
              )}

              {selected.file_dinh_kem && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>File đính kèm</div>
                  <a
                    href={`http://localhost:5000/api/dich-vu/file/${selected.file_dinh_kem}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 6, padding: '7px 14px',
                      background: '#eff6ff', color: '#1d4ed8',
                      borderRadius: 7, fontSize: 13, fontWeight: 500,
                      textDecoration: 'none', border: '1px solid #bfdbfe',
                    }}
                  >
                    📎 Xem / Tải file đính kèm
                  </a>
                </div>
              )}

              {selected.ketqua && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {selected.trangthai === 'tuchoi' ? 'Lý do từ chối' : 'Kết quả / Phản hồi'}
                  </div>
                  <div style={{
                    fontSize: 14, color: '#334155', marginTop: 4,
                    background: selected.trangthai === 'tuchoi' ? '#fef2f2' : '#f0fdf4',
                    borderRadius: 8, padding: '10px 12px', lineHeight: 1.6,
                  }}>
                    {selected.ketqua}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons in detail panel */}
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.trangthai === 'cho' && (
                <button
                  onClick={() => handleSetDangXuLy(getId(selected))}
                  disabled={processing === getId(selected)}
                  style={{ flex: 1, padding: '10px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                >
                  🔄 Đang xử lý
                </button>
              )}
              {selected.trangthai !== 'duyet' && (
                <button
                  onClick={() => handleApprove(getId(selected))}
                  disabled={processing === getId(selected)}
                  style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                >
                  ✓ Duyệt
                </button>
              )}
              {selected.trangthai !== 'tuchoi' && (
                <button
                  onClick={() => openRejectModal(selected)}
                  disabled={processing === getId(selected)}
                  style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                >
                  ✕ Từ chối
                </button>
              )}
              {isDone(selected) && (
                <button
                  onClick={() => handleReset(getId(selected))}
                  disabled={processing === getId(selected)}
                  style={{ flex: 1, padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                >
                  ↩ Hoàn tác
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28, width: '90%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
              Từ chối đơn
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
              MSSV: <strong>{rejectTarget?.mssv}</strong> — {rejectTarget?.tieude || rejectTarget?.tendichvu || rejectTarget?.tenloai}
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
              Lý do từ chối (tùy chọn)
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Nhập lý do từ chối để thông báo cho sinh viên..."
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTSVDonOnline;
