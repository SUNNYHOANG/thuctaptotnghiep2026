import React, { useState, useEffect, useRef } from 'react';
import { khenThuongKyLuatAPI, thongBaoAPI, lookupAPI } from '../api/api';
import api from '../api/api';
import { useSocketEvent } from '../context/SocketContext';

const LOAI_LABEL = { khenthuong: 'Khen thưởng', kyluat: 'Kỷ luật', canhcao: 'Cảnh cáo' };

// Dropdown sinh viên có ô tìm kiếm
const StudentSelect = ({ value, onChange }) => {
  const [students, setStudents] = useState([]);
  const [loadingSv, setLoadingSv] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setLoadingSv(true);
    api.get('/users/students/all')
      .then((r) => setStudents(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingSv(false));
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || (s.mssv || '').toLowerCase().includes(q) || (s.hoten || '').toLowerCase().includes(q);
  });

  const selected = students.find((s) => s.mssv === value);

  const handleSelect = (mssv) => {
    onChange(mssv);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4,
          cursor: 'pointer', background: 'white', boxSizing: 'border-box',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ color: selected ? '#000' : '#999' }}>
          {selected ? `${selected.mssv} - ${selected.hoten}` : '-- Chọn sinh viên --'}
        </span>
        <span style={{ fontSize: 10, color: '#666' }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: 'white', border: '1px solid #ccc', borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 260, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <input
              autoFocus
              placeholder="Tìm MSSV hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loadingSv ? (
              <div style={{ padding: 12, color: '#999', textAlign: 'center' }}>Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 12, color: '#999', textAlign: 'center' }}>Không tìm thấy</div>
            ) : (
              filtered.slice(0, 100).map((s) => (
                <div
                  key={s.mssv}
                  onClick={() => handleSelect(s.mssv)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer',
                    background: s.mssv === value ? '#e8f4fd' : 'white',
                    borderBottom: '1px solid #f5f5f5',
                  }}
                  onMouseEnter={(e) => { if (s.mssv !== value) e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={(e) => { if (s.mssv !== value) e.currentTarget.style.background = 'white'; }}
                >
                  <span style={{ fontWeight: 600, marginRight: 8 }}>{s.mssv}</span>
                  <span style={{ color: '#555' }}>{s.hoten}</span>
                  {s.malop && <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>({s.malop})</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminRewards = () => {
  const [list, setList] = useState([]);
  const [hockyList, setHockyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchMssv, setSearchMssv] = useState('');
  const [form, setForm] = useState({
    mssv: '',
    mahocky: '',
    loai: 'khenthuong',
    noidung: '',
    hinhthuc: '',
    soquyetdinh: '',
    ngayquyetdinh: '',
    ghichu: '',
    guiThongBao: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await khenThuongKyLuatAPI.getAll({});
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    lookupAPI.getHocKy().then((r) => setHockyList(r.data || []));
  }, []);

  // Realtime: tự reload khi có khen thưởng/kỷ luật mới
  useSocketEvent('reward_discipline', load);

  const loadBySemester = async (mahocky) => {
    try {
      setLoading(true);
      const res = await khenThuongKyLuatAPI.getAll({ mahocky });
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mssv?.trim() || !form.noidung?.trim()) {
      alert('Vui lòng chọn sinh viên và nhập nội dung.');
      return;
    }
    try {
      if (editingId) {
        await khenThuongKyLuatAPI.update(editingId, form);
        alert('Cập nhật thành công.');
      } else {
        const created = (await khenThuongKyLuatAPI.create(form)).data;
        if (form.guiThongBao && created) {
          const loaiLabel = LOAI_LABEL[form.loai] || form.loai;
          await thongBaoAPI.create({
            tieude: `Thông báo ${loaiLabel}`,
            noidung: `[MSSV ${form.mssv}] Bạn đã nhận ${loaiLabel}: ${form.noidung}`,
            loai: created.malop ? 'lop' : 'truong',
            malop: created.malop || null,
            nguoitao: 'admin',
          });
        }
        alert('Thêm thành công.' + (form.guiThongBao ? ' Đã thông báo đến sinh viên.' : ''));
      }
      setShowModal(false);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await khenThuongKyLuatAPI.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi.');
    }
  };

  const openCreate = () => {
    setForm({
      mssv: searchMssv || '',
      mahocky: hockyList[0]?.mahocky || '',
      loai: 'khenthuong',
      noidung: '',
      hinhthuc: '',
      soquyetdinh: '',
      ngayquyetdinh: '',
      ghichu: '',
      guiThongBao: true,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setForm({
      mssv: r.mssv,
      mahocky: r.mahocky,
      loai: r.loai || 'khenthuong',
      noidung: r.noidung || '',
      hinhthuc: r.hinhthuc || '',
      soquyetdinh: r.soquyetdinh || '',
      ngayquyetdinh: r.ngayquyetdinh ? r.ngayquyetdinh.split('T')[0] : '',
      ghichu: r.ghichu || '',
      guiThongBao: false,
    });
    setEditingId(r.id);
    setShowModal(true);
  };

  const filteredList = list.filter(
    (r) => !searchMssv || (r.mssv || '').toLowerCase().includes(searchMssv.toLowerCase())
  );

  return (
    <div className="admin-page">
      <h2>⭐ Quản Lý Khen Thưởng & Kỷ Luật</h2>
      <p>CTSV tạo khen thưởng/kỷ luật sẽ thông báo đến sinh viên.</p>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={openCreate}
          style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          ➕ Thêm
        </button>
        <select
          onChange={(e) => { const v = e.target.value; v ? loadBySemester(v) : load(); }}
          style={{ padding: 8 }}
        >
          <option value="">Tất cả học kỳ</option>
          {hockyList.map((h) => (
            <option key={h.mahocky} value={h.mahocky}>{h.tenhocky}</option>
          ))}
        </select>
        <input
          placeholder="Tìm MSSV..."
          value={searchMssv}
          onChange={(e) => setSearchMssv(e.target.value)}
          style={{ padding: 8, width: 150 }}
        />
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>MSSV</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Họ tên</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Lớp</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Loại</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Nội dung</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Học kỳ</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10 }}>{r.mssv}</td>
                  <td style={{ padding: 10 }}>{r.hoten}</td>
                  <td style={{ padding: 10 }}>{r.malop}</td>
                  <td style={{ padding: 10 }}>
                    <span style={{
                      background: r.loai === 'khenthuong' ? '#d4edda' : '#f8d7da',
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {LOAI_LABEL[r.loai] || r.loai}
                    </span>
                  </td>
                  <td style={{ padding: 10, maxWidth: 200 }}>
                    {r.noidung ? String(r.noidung).substring(0, 60) + (r.noidung.length > 60 ? '...' : '') : '-'}
                  </td>
                  <td style={{ padding: 10 }}>{r.tenhocky || r.mahocky}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button
                      onClick={() => openEdit(r)}
                      style={{ marginRight: 8, background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredList.length === 0 && <p>Chưa có bản ghi.</p>}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: '90%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{editingId ? 'Sửa' : 'Thêm'} Khen thưởng / Kỷ luật</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Sinh viên *</label>
                <StudentSelect
                  value={form.mssv}
                  onChange={(mssv) => setForm((f) => ({ ...f, mssv }))}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Học kỳ *</label>
                <select
                  value={form.mahocky}
                  onChange={(e) => setForm((f) => ({ ...f, mahocky: e.target.value }))}
                  required
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="">-- Chọn học kỳ --</option>
                  {hockyList.map((h) => (
                    <option key={h.mahocky} value={h.mahocky}>{h.tenhocky}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Loại</label>
                <select
                  value={form.loai}
                  onChange={(e) => setForm((f) => ({ ...f, loai: e.target.value }))}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="khenthuong">Khen thưởng</option>
                  <option value="kyluat">Kỷ luật</option>
                  <option value="canhcao">Cảnh cáo</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Nội dung *</label>
                <textarea
                  value={form.noidung}
                  onChange={(e) => setForm((f) => ({ ...f, noidung: e.target.value }))}
                  required
                  rows={3}
                  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Hình thức</label>
                <input
                  value={form.hinhthuc}
                  onChange={(e) => setForm((f) => ({ ...f, hinhthuc: e.target.value }))}
                  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Số quyết định</label>
                <input
                  value={form.soquyetdinh}
                  onChange={(e) => setForm((f) => ({ ...f, soquyetdinh: e.target.value }))}
                  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Ngày quyết định</label>
                <input
                  type="date"
                  value={form.ngayquyetdinh}
                  onChange={(e) => setForm((f) => ({ ...f, ngayquyetdinh: e.target.value }))}
                  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Ghi chú</label>
                <input
                  value={form.ghichu}
                  onChange={(e) => setForm((f) => ({ ...f, ghichu: e.target.value }))}
                  style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                />
              </div>
              {!editingId && (
                <div style={{ marginBottom: 12 }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.guiThongBao}
                      onChange={(e) => setForm((f) => ({ ...f, guiThongBao: e.target.checked }))}
                    />{' '}
                    Gửi thông báo đến sinh viên
                  </label>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}>Hủy</button>
                <button
                  type="submit"
                  style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;
