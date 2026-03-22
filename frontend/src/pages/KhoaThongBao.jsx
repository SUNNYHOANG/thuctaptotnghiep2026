import React, { useState, useEffect } from 'react';
import { thongBaoAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';

const KhoaThongBao = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tieude: '', noidung: '', loai: 'thong_bao' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await thongBaoAPI.getAll({});
      setList(res.data?.data || res.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  // Realtime: tự reload khi có thông báo mới
  useSocketEvent('thongbao:new', fetchList);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tieude.trim() || !form.noidung.trim()) {
      setMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      await thongBaoAPI.create({ ...form, makhoa: user?.makhoa, nguoitao: user?.id });
      setMsg('Đăng thông báo thành công.');
      setForm({ tieude: '', noidung: '', loai: 'thong_bao' });
      setShowForm(false);
      fetchList();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi khi đăng thông báo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    try {
      await thongBaoAPI.delete(id);
      fetchList();
    } catch {
      alert('Lỗi khi xóa thông báo.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Thông báo nội bộ khoa</h2>
          <button
            onClick={() => { setShowForm(!showForm); setMsg(''); }}
            style={{ padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            {showForm ? 'Hủy' : '+ Đăng thông báo'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: '#f5f7fa', padding: 20, borderRadius: 8, marginBottom: 24, border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0 }}>Thông báo mới</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Tiêu đề *</label>
              <input
                value={form.tieude}
                onChange={e => setForm(f => ({ ...f, tieude: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box' }}
                placeholder="Nhập tiêu đề thông báo"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Loại</label>
              <select
                value={form.loai}
                onChange={e => setForm(f => ({ ...f, loai: e.target.value }))}
                style={{ padding: '8px 10px', borderRadius: 5, border: '1px solid #ccc' }}
              >
                <option value="thong_bao">Thông báo</option>
                <option value="lich_hoc">Lịch học</option>
                <option value="su_kien">Sự kiện</option>
                <option value="khan_cap">Khẩn cấp</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Nội dung *</label>
              <textarea
                value={form.noidung}
                onChange={e => setForm(f => ({ ...f, noidung: e.target.value }))}
                rows={5}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 5, border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Nhập nội dung thông báo..."
              />
            </div>
            {msg && <div style={{ marginBottom: 10, color: msg.includes('thành công') ? 'green' : 'red' }}>{msg}</div>}
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 22px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              {submitting ? 'Đang gửi...' : 'Đăng thông báo'}
            </button>
          </form>
        )}

        {!showForm && msg && (
          <div style={{ marginBottom: 14, color: msg.includes('thành công') ? 'green' : 'red' }}>{msg}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chưa có thông báo nào.</div>
        ) : (
          <div>
            {list.map(tb => (
              <div
                key={tb.mathongbao}
                style={{
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: '16px 20px',
                  marginBottom: 14,
                  cursor: 'pointer',
                  boxShadow: selected?.mathongbao === tb.mathongbao ? '0 0 0 2px #1976d2' : 'none'
                }}
                onClick={() => setSelected(selected?.mathongbao === tb.mathongbao ? null : tb)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: tb.loai === 'khan_cap' ? '#ffebee' : '#e3f2fd',
                      color: tb.loai === 'khan_cap' ? '#c62828' : '#1565c0',
                      marginRight: 8
                    }}>
                      {tb.loai === 'thong_bao' ? 'Thông báo' : tb.loai === 'lich_hoc' ? 'Lịch học' : tb.loai === 'su_kien' ? 'Sự kiện' : 'Khẩn cấp'}
                    </span>
                    <strong>{tb.tieude}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>{formatDate(tb.ngaytao)}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(tb.mathongbao); }}
                      style={{ padding: '3px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                {selected?.mathongbao === tb.mathongbao && (
                  <div style={{ marginTop: 12, color: '#333', whiteSpace: 'pre-wrap', borderTop: '1px solid #eee', paddingTop: 10 }}>
                    {tb.noidung}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
};

export default KhoaThongBao;
