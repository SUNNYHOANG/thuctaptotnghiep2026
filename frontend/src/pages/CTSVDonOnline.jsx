import React, { useState, useEffect } from 'react';
import { dichVuAPI } from '../api/api';
import './CTSVDonOnline.css';

const CTSVDonOnline = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    dichVuAPI.getAll(statusFilter ? { trangthai: statusFilter } : {})
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatus = async (id, trangthai) => {
    try {
      await dichVuAPI.updateStatus(id, { trangthai });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Cập nhật thất bại.');
    }
  };

  const statusLabel = (s) => ({ 'choduyet': 'Chờ duyệt', 'daduyet': 'Đã duyệt', 'tuchoi': 'Từ chối' }[s] || s);

  return (
    <div className="page-card ctsv-don-online">
      <h1>Duyệt đơn từ online</h1>
      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="choduyet">Chờ duyệt</option>
          <option value="daduyet">Đã duyệt</option>
          <option value="tuchoi">Từ chối</option>
        </select>
        <button type="button" className="btn primary" onClick={load}>Tải lại</button>
      </div>
      {loading ? (
        <p>Đang tải...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">Không có đơn nào.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Loại đơn</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const id = d.madon ?? d.id;
                return (
                <tr key={id}>
                  <td>{d.mssv}</td>
                  <td>{d.tendichvu || d.tenloai || d.maloaidichvu}</td>
                  <td className="noidung">{d.noidung_yeucau || '—'}</td>
                  <td><span className={`badge status-${d.trangthai}`}>{statusLabel(d.trangthai)}</span></td>
                  <td>
                    {d.trangthai === 'choduyet' && (
                      <>
                        <button type="button" className="btn small success" onClick={() => handleStatus(id, 'daduyet')}>Chấp nhận</button>
                        <button type="button" className="btn small danger" onClick={() => handleStatus(id, 'tuchoi')}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CTSVDonOnline;
