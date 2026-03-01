import React, { useState, useEffect } from 'react';
import { phucKhaoAPI } from '../api/api';
import './CTSVPhucKhao.css';

const TRANGTHAI_LABEL = {
  cho: 'Chờ xử lý',
  dangxuly: 'Đang xử lý',
  chapnhan: 'Đã chấp nhận',
  tuchoi: 'Đã từ chối',
};

const CTSVPhucKhao = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filter ? { trangthai: filter } : {};
      const res = await phucKhaoAPI.getAll(params);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (maphuckhao, trangthai, ketqua) => {
    try {
      await phucKhaoAPI.updateStatus(maphuckhao, { trangthai, ketqua: ketqua || null });
      await loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật thất bại');
    }
  };

  const handleChapNhan = (req) => {
    const ketqua = window.prompt('Nhập nội dung phản hồi cho sinh viên (tùy chọn):', req.ketqua || '');
    if (ketqua === null) return;
    handleStatus(req.maphuckhao, 'chapnhan', ketqua);
  };

  const handleTuchoi = (req) => {
    const ketqua = window.prompt('Lý do từ chối / nội dung phản hồi:', req.ketqua || '');
    if (ketqua === null) return;
    handleStatus(req.maphuckhao, 'tuchoi', ketqua);
  };

  return (
    <div className="page-card ctsv-phuckhao">
      <h1>Duyệt đơn phúc khảo điểm</h1>
      <p className="page-desc">Xem và duyệt/từ chối đơn phúc khảo của sinh viên. Sau khi xử lý, sinh viên sẽ thấy kết quả tại mục Phúc khảo điểm.</p>

      <div className="filter-row">
        <label>Trạng thái:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="cho">Chờ xử lý</option>
          <option value="dangxuly">Đang xử lý</option>
          <option value="chapnhan">Đã chấp nhận</option>
          <option value="tuchoi">Đã từ chối</option>
        </select>
        <button type="button" className="btn-refresh" onClick={loadRequests}>Tải lại</button>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">Không có đơn phúc khảo nào.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã PK</th>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Môn học</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th>Kết quả / Phản hồi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.maphuckhao}>
                  <td>{req.maphuckhao}</td>
                  <td>{req.mssv}</td>
                  <td>{req.hoten}</td>
                  <td>{req.tenmonhoc}</td>
                  <td className="cell-lydo">{req.lydo}</td>
                  <td><span className={`status-badge status-${req.trangthai}`}>{TRANGTHAI_LABEL[req.trangthai] || req.trangthai}</span></td>
                  <td>{req.ngaygui ? new Date(req.ngaygui).toLocaleString('vi-VN') : '-'}</td>
                  <td className="cell-ketqua">{req.ketqua || '-'}</td>
                  <td>
                    {(req.trangthai === 'cho' || req.trangthai === 'dangxuly') && (
                      <>
                        <button type="button" className="btn-approve" onClick={() => handleChapNhan(req)}>Chấp nhận</button>
                        <button type="button" className="btn-reject" onClick={() => handleTuchoi(req)}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CTSVPhucKhao;
