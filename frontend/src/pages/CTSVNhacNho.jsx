import React, { useState } from 'react';
import { thongBaoAPI } from '../api/api';
import './CTSVNhacNho.css';

const CTSVNhacNho = () => {
  const [form, setForm] = useState({ tieude: '', noidung: '', loai: 'nhacnho' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tieude?.trim()) {
      setMessage('Vui lòng nhập tiêu đề.');
      return;
    }
    try {
      setSending(true);
      setMessage('');
      await thongBaoAPI.create({
        tieude: form.tieude.trim(),
        noidung: form.noidung?.trim() || '',
        loai: form.loai || 'nhacnho',
      });
      setForm({ tieude: '', noidung: '', loai: 'nhacnho' });
      setMessage('Đã gửi nhắc nhở thành công.');
    } catch (e) {
      setMessage(e.response?.data?.error || 'Gửi thất bại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-card ctsv-nhac-nho">
      <h1>Gửi nhắc nhở sinh viên</h1>
      <p className="intro">Tạo thông báo nhắc nhở (toàn trường hoặc theo đối tượng).</p>
      {message && <div className="message">{message}</div>}
      <form onSubmit={handleSubmit} className="nhac-nho-form">
        <label>Tiêu đề *</label>
        <input value={form.tieude} onChange={(e) => setForm((f) => ({ ...f, tieude: e.target.value }))} placeholder="Tiêu đề thông báo" />
        <label>Nội dung</label>
        <textarea value={form.noidung} onChange={(e) => setForm((f) => ({ ...f, noidung: e.target.value }))} rows={4} placeholder="Nội dung nhắc nhở" />
        <label>Loại thông báo</label>
        <select value={form.loai} onChange={(e) => setForm((f) => ({ ...f, loai: e.target.value }))}>
          <option value="nhacnho">Nhắc nhở</option>
          <option value="khac">Khác</option>
        </select>
        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={sending}>{sending ? 'Đang gửi...' : 'Gửi nhắc nhở'}</button>
        </div>
      </form>
    </div>
  );
};

export default CTSVNhacNho;
