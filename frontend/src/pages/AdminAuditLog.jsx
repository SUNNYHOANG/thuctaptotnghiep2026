import React, { useState, useEffect } from 'react';
import { auditLogAPI } from '../api/api';

const PAGE_SIZE = 50;

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ username: '', action: '', entity: '', from: '', to: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { loadLogs(0); }, []);

  const loadLogs = async (pageNum = 0) => {
    setLoading(true);
    setMessage('');
    try {
      const params = { limit: PAGE_SIZE, offset: pageNum * PAGE_SIZE };
      if (filters.username) params.username = filters.username;
      if (filters.action)   params.action   = filters.action;
      if (filters.entity)   params.entity   = filters.entity;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to + ' 23:59:59';
      const res = await auditLogAPI.getAll(params);
      setLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setPage(pageNum);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Không tải được nhật ký');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    const days = window.prompt('Xóa log cũ hơn bao nhiêu ngày?', '90');
    if (!days) return;
    try {
      const res = await auditLogAPI.clear(Number(days));
      setMessage(`Đã xóa ${res.data.deleted} bản ghi log cũ hơn ${days} ngày`);
      loadLogs(0);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Lỗi khi xóa log');
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 className="card-title">🗒️ Nhật Ký Hệ Thống</h1>
            <p style={{ color: '#666', marginTop: 4, marginBottom: 0 }}>Theo dõi các hành động quan trọng trong hệ thống</p>
          </div>
          <button className="btn btn-danger" onClick={handleClear} style={{ fontSize: 13 }}>🗑️ Dọn log cũ</button>
        </div>

        {/* Bộ lọc */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 0', borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
          <input className="form-control" style={{ width: 150 }} placeholder="Tên người dùng" value={filters.username}
            onChange={(e) => setFilters({ ...filters, username: e.target.value })} />
          <input className="form-control" style={{ width: 150 }} placeholder="Hành động" value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
          <input className="form-control" style={{ width: 130 }} placeholder="Đối tượng" value={filters.entity}
            onChange={(e) => setFilters({ ...filters, entity: e.target.value })} />
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 13, color: '#6b7280' }}>Từ</label>
            <input className="form-control" type="date" style={{ width: 140 }} value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 13, color: '#6b7280' }}>Đến</label>
            <input className="form-control" type="date" style={{ width: 140 }} value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={() => loadLogs(0)} disabled={loading}>
            {loading ? 'Đang tải...' : '🔍 Tìm kiếm'}
          </button>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <div style={{ marginBottom: 8, color: '#6b7280', fontSize: 13 }}>
          Tổng: {total} bản ghi — Trang {page + 1}/{totalPages || 1}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người dùng</th>
                <th>Role</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>ID</th>
                <th>Chi tiết</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                  <td>{log.username || '—'}</td>
                  <td>{log.role || '—'}</td>
                  <td><span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4 }}>{log.action}</span></td>
                  <td>{log.entity || '—'}</td>
                  <td>{log.entity_id || '—'}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.detail}>{log.detail || '—'}</td>
                  <td>{log.ip || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Không có bản ghi nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-secondary" disabled={page === 0} onClick={() => loadLogs(page - 1)}>← Trước</button>
            <span style={{ lineHeight: '36px', fontSize: 13 }}>Trang {page + 1} / {totalPages}</span>
            <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => loadLogs(page + 1)}>Sau →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
