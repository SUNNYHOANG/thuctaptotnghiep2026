import React, { useState, useEffect, useCallback } from 'react';
import { khoaAPI, lopAPI } from '../api/api';

const EMPTY_KHOA = { makhoa: '', tenkhoa: '' };
const EMPTY_LOP = { malop: '', tenlop: '', makhoa: '', namtuyensinh: '' };

// ── Styles ──
const th = { padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 600, whiteSpace: 'nowrap' };
const td = { padding: '9px 12px', verticalAlign: 'middle' };
const btnEdit = { marginRight: 6, background: '#3498db', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const btnDel = { background: '#e74c3c', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const inp = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const lbl = { display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 14 };

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={lbl}>{label} {required && <span style={{ color: 'red' }}>*</span>}</label>
    {children}
  </div>
);

// ════════════════════════════════════════
//  Tab Quản lý Khoa
// ════════════════════════════════════════
const TabKhoa = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_KHOA);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await khoaAPI.getAll(); setList(r.data?.data || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm(EMPTY_KHOA); setEditing(null); setFormError(''); setShowModal(true); };
  const openEdit = (k) => { setForm({ makhoa: k.makhoa, tenkhoa: k.tenkhoa }); setEditing(k.makhoa); setFormError(''); setShowModal(true); };
  const close = () => { setShowModal(false); setEditing(null); setForm(EMPTY_KHOA); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.makhoa.trim()) { setFormError('Vui lòng nhập mã khoa.'); return; }
    if (!form.tenkhoa.trim()) { setFormError('Vui lòng nhập tên khoa.'); return; }
    setSubmitting(true);
    try {
      if (editing) await khoaAPI.update(editing, { tenkhoa: form.tenkhoa });
      else await khoaAPI.create({ makhoa: form.makhoa, tenkhoa: form.tenkhoa });
      close(); fetch();
    } catch (e) { setFormError('Lỗi: ' + (e.response?.data?.error || e.message)); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (makhoa, tenkhoa) => {
    if (!window.confirm(`Xác nhận xóa khoa "${tenkhoa}" (${makhoa})?`)) return;
    try { await khoaAPI.delete(makhoa); fetch(); }
    catch (e) { alert('Lỗi: ' + (e.response?.data?.error || e.message)); }
  };

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <button onClick={openAdd} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>➕ Thêm Khoa</button>
        <button onClick={fetch} style={{ padding: '7px 14px', background: '#ecf0f1', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}>🔄 Làm mới</button>
      </div>

      {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>⏳ Đang tải...</div>
        : error ? <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626' }}>⚠️ {error}</div>
        : (
          <>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Tổng: <strong>{list.length}</strong> khoa</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>#</th><th style={th}>Mã Khoa</th><th style={th}>Tên Khoa</th>
                  <th style={{ ...th, textAlign: 'center' }}>Hành Động</th>
                </tr></thead>
                <tbody>
                  {list.length === 0
                    ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Chưa có khoa nào.</td></tr>
                    : list.map((k, i) => (
                      <tr key={k.makhoa} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={td}>{i + 1}</td>
                        <td style={td}><span style={{ fontWeight: 600, color: '#e67e22', fontFamily: 'monospace' }}>{k.makhoa}</span></td>
                        <td style={td}>{k.tenkhoa}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button onClick={() => openEdit(k)} style={btnEdit}>✏️ Sửa</button>
                          <button onClick={() => handleDelete(k.makhoa, k.tenkhoa)} style={btnDel}>🗑️ Xóa</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: '100%', maxWidth: 420 }}>
            <h3 style={{ marginTop: 0 }}>{editing ? '✏️ Cập Nhật Khoa' : '➕ Thêm Khoa Mới'}</h3>
            {formError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>⚠️ {formError}</div>}
            <form onSubmit={handleSubmit}>
              <Field label="Mã Khoa" required>
                <input type="text" value={form.makhoa} onChange={(e) => setForm({ ...form, makhoa: e.target.value })}
                  disabled={!!editing} style={{ ...inp, background: editing ? '#f9f9f9' : 'white', textTransform: 'uppercase' }}
                  placeholder="VD: CNTT, KTCK..." required />
                {!editing && <small style={{ color: '#666', fontSize: 12 }}>Tự động chuyển thành chữ hoa.</small>}
              </Field>
              <Field label="Tên Khoa" required>
                <input type="text" value={form.tenkhoa} onChange={(e) => setForm({ ...form, tenkhoa: e.target.value })}
                  style={inp} placeholder="VD: Khoa Công nghệ Thông tin" required />
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={close} style={{ padding: '9px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 24px', background: submitting ? '#aaa' : '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                  {submitting ? 'Đang lưu...' : (editing ? 'Cập Nhật' : 'Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ════════════════════════════════════════
//  Tab Quản lý Lớp
// ════════════════════════════════════════
const TabLop = ({ khoaList }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterKhoa, setFilterKhoa] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // malop đang sửa
  const [form, setForm] = useState(EMPTY_LOP);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLop = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await lopAPI.getAll(filterKhoa || undefined); setList(r.data?.data || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  }, [filterKhoa]);

  useEffect(() => { fetchLop(); }, [fetchLop]);

  const openAdd = () => { setForm({ ...EMPTY_LOP, makhoa: filterKhoa }); setEditing(null); setFormError(''); setShowModal(true); };
  const openEdit = (l) => {
    setForm({ malop: l.malop, tenlop: l.tenlop, makhoa: l.makhoa || '', namtuyensinh: l.namtuyensinh || '' });
    setEditing(l.malop); setFormError(''); setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); setForm(EMPTY_LOP); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.malop.trim()) { setFormError('Vui lòng nhập mã lớp.'); return; }
    if (!form.tenlop.trim()) { setFormError('Vui lòng nhập tên lớp.'); return; }
    setSubmitting(true);
    try {
      const payload = { tenlop: form.tenlop, makhoa: form.makhoa || null, namtuyensinh: form.namtuyensinh ? Number(form.namtuyensinh) : null };
      if (editing) await lopAPI.update(editing, payload);
      else await lopAPI.create({ malop: form.malop, ...payload });
      close(); fetchLop();
    } catch (e) { setFormError('Lỗi: ' + (e.response?.data?.error || e.message)); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (malop, tenlop) => {
    if (!window.confirm(`Xác nhận xóa lớp "${tenlop}" (${malop})?`)) return;
    try { await lopAPI.delete(malop); fetchLop(); }
    catch (e) { alert('Lỗi: ' + (e.response?.data?.error || e.message)); }
  };

  const displayed = search.trim()
    ? list.filter((l) => {
        const q = search.toLowerCase();
        return l.malop.toLowerCase().includes(q) || l.tenlop.toLowerCase().includes(q) || (l.makhoa || '').toLowerCase().includes(q);
      })
    : list;

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterKhoa} onChange={(e) => setFilterKhoa(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #ddd', minWidth: 180 }}>
          <option value="">Tất cả khoa</option>
          {khoaList.map((k) => <option key={k.makhoa} value={k.makhoa}>{k.makhoa} – {k.tenkhoa}</option>)}
        </select>
        <input type="text" placeholder="Tìm mã lớp, tên lớp..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 4, border: '1px solid #ddd', width: 220 }} />
        <button onClick={openAdd} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>➕ Thêm Lớp</button>
        <button onClick={fetchLop} style={{ padding: '7px 14px', background: '#ecf0f1', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}>🔄 Làm mới</button>
      </div>

      {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>⏳ Đang tải...</div>
        : error ? <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626' }}>⚠️ {error}</div>
        : (
          <>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              Hiển thị: <strong>{displayed.length}</strong>{search && ` / ${list.length}`} lớp
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={th}>#</th>
                  <th style={th}>Mã Lớp</th>
                  <th style={th}>Tên Lớp</th>
                  <th style={th}>Khoa</th>
                  <th style={th}>Năm tuyển sinh</th>
                  <th style={th}>Số SV</th>
                  <th style={{ ...th, textAlign: 'center' }}>Hành Động</th>
                </tr></thead>
                <tbody>
                  {displayed.length === 0
                    ? <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Không có lớp nào.</td></tr>
                    : displayed.map((l, i) => (
                      <tr key={l.malop} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={td}>{i + 1}</td>
                        <td style={td}><span style={{ fontWeight: 600, color: '#2980b9', fontFamily: 'monospace' }}>{l.malop}</span></td>
                        <td style={td}>{l.tenlop}</td>
                        <td style={td}>
                          {l.makhoa
                            ? <span style={{ background: '#e67e22', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{l.makhoa}</span>
                            : <span style={{ color: '#999' }}>—</span>}
                        </td>
                        <td style={td}>{l.namtuyensinh || '—'}</td>
                        <td style={td}>
                          <span style={{ background: '#ecf0f1', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                            {l.so_sinh_vien ?? 0} SV
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button onClick={() => openEdit(l)} style={btnEdit}>✏️ Sửa</button>
                          <button onClick={() => handleDelete(l.malop, l.tenlop)} style={btnDel}>🗑️ Xóa</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: '100%', maxWidth: 460 }}>
            <h3 style={{ marginTop: 0 }}>{editing ? '✏️ Cập Nhật Lớp' : '➕ Thêm Lớp Mới'}</h3>
            {formError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>⚠️ {formError}</div>}
            <form onSubmit={handleSubmit}>
              <Field label="Mã Lớp" required>
                <input type="text" value={form.malop} onChange={(e) => setForm({ ...form, malop: e.target.value })}
                  disabled={!!editing} style={{ ...inp, background: editing ? '#f9f9f9' : 'white', textTransform: 'uppercase' }}
                  placeholder="VD: CNTT01, QTKD02..." required />
              </Field>
              <Field label="Tên Lớp" required>
                <input type="text" value={form.tenlop} onChange={(e) => setForm({ ...form, tenlop: e.target.value })}
                  style={inp} placeholder="VD: CNTT K20 Lớp 1" required />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Khoa">
                  <select value={form.makhoa} onChange={(e) => setForm({ ...form, makhoa: e.target.value })} style={inp}>
                    <option value="">-- Chọn khoa --</option>
                    {khoaList.map((k) => <option key={k.makhoa} value={k.makhoa}>{k.makhoa} – {k.tenkhoa}</option>)}
                  </select>
                </Field>
                <Field label="Năm tuyển sinh">
                  <input type="number" value={form.namtuyensinh} onChange={(e) => setForm({ ...form, namtuyensinh: e.target.value })}
                    style={inp} placeholder="VD: 2022" min="2000" max="2099" />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={close} style={{ padding: '9px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={submitting} style={{ padding: '9px 24px', background: submitting ? '#aaa' : '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                  {submitting ? 'Đang lưu...' : (editing ? 'Cập Nhật' : 'Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ════════════════════════════════════════
//  Trang chính AdminKhoa
// ════════════════════════════════════════
const AdminKhoa = () => {
  const [tab, setTab] = useState('khoa');
  const [khoaList, setKhoaList] = useState([]);

  useEffect(() => {
    khoaAPI.getAll().then((r) => setKhoaList(r.data?.data || [])).catch(() => {});
  }, []);

  const tabBtn = (key, label) => (
    <button onClick={() => setTab(key)} style={{
      padding: '10px 24px', border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: 'bold',
      background: tab === key ? 'white' : '#ecf0f1',
      color: tab === key ? '#2c3e50' : '#666',
      borderBottom: tab === key ? '3px solid #3498db' : '3px solid transparent',
    }}>{label}</button>
  );

  return (
    <div className="admin-page">
      <h2>🏫 Quản Lý Khoa & Lớp</h2>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #ddd', marginBottom: 20 }}>
        {tabBtn('khoa', '🏫 Danh Sách Khoa')}
        {tabBtn('lop', '🏷️ Danh Sách Lớp')}
      </div>

      {tab === 'khoa' && <TabKhoa />}
      {tab === 'lop' && <TabLop khoaList={khoaList} />}
    </div>
  );
};

export default AdminKhoa;
