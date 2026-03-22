import React, { useState, useEffect } from 'react';
import api, { lookupAPI } from '../api/api';

const ROLE_COLORS = { admin: '#e74c3c', giangvien: '#3498db', ctsv: '#9b59b6', khoa: '#e67e22' };
const ROLE_LABELS = { admin: 'Admin', giangvien: 'Giảng viên', ctsv: 'CTSV', khoa: 'Khoa' };

const EMPTY_STAFF = { username: '', password: '', hoten: '', email: '', role: 'giangvien', makhoa: '', status: 'active' };
const EMPTY_SV = { mssv: '', hoten: '', malop: '', makhoa: '', ngaysinh: '', gioitinh: '', tinhtrang: 'Đang học', khoahoc: '', bacdaotao: 'Đại học', nganh: '' };

const th = { padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: 600, whiteSpace: 'nowrap' };
const td = { padding: '9px 12px', verticalAlign: 'middle' };
const btnEdit = { marginRight: 6, background: '#3498db', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const btnDel = { background: '#e74c3c', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const btnCancel = { padding: '9px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' };
const btnSave = { padding: '9px 24px', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const inp = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </label>
    {children}
  </div>
);

const AdminUsers = () => {
  const [userType, setUserType] = useState('staff');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF);
  const [svForm, setSvForm] = useState(EMPTY_SV);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [svSearch, setSvSearch] = useState('');
  const [khoaList, setKhoaList] = useState([]);
  const [lopList, setLopList] = useState([]);

  useEffect(() => { fetchUsers(); }, [filters, userType]); // eslint-disable-line

  useEffect(() => {
    lookupAPI.getKhoaList()
      .then((r) => setKhoaList(r.data?.data || []))
      .catch(() => setKhoaList([]));
  }, []);

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      if (userType === 'staff') {
        const params = {};
        if (filters.role) params.role = filters.role;
        if (filters.status) params.status = filters.status;
        const res = await api.get('/users', { params });
        setUsers(res.data?.data || res.data || []);
      } else {
        const res = await api.get('/users/students/all');
        setUsers(res.data?.data || res.data || []);
      }
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + (err.response?.data?.error || err.message));
      setUsers([]);
    } finally { setLoading(false); }
  };

  // ── STAFF handlers ──
  const handleStaffSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!staffForm.username.trim()) { setFormError('Vui lòng nhập username.'); return; }
    if (!editingId && !staffForm.password.trim()) { setFormError('Vui lòng nhập mật khẩu.'); return; }
    if ((staffForm.role === 'khoa' || staffForm.role === 'giangvien') && !staffForm.makhoa) {
      setFormError(`Vai trò "${ROLE_LABELS[staffForm.role]}" bắt buộc phải có Mã Khoa.`); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...staffForm };
      if (!payload.makhoa) delete payload.makhoa;
      if (!payload.email) delete payload.email;
      if (!payload.hoten) delete payload.hoten;
      if (editingId) {
        const up = { ...payload }; delete up.username;
        if (!up.password) delete up.password;
        await api.put(`/users/${editingId}`, up);
      } else {
        await api.post('/users', payload);
      }
      closeModal(); fetchUsers();
    } catch (err) {
      setFormError('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally { setSubmitting(false); }
  };

  const openEditStaff = (u) => {
    setStaffForm({ username: u.username || '', password: '', hoten: u.hoten || '', email: u.email || '', role: u.role || 'giangvien', makhoa: u.makhoa || '', status: u.status || 'active' });
    setEditingId(u.id); setFormError(''); setShowModal(true);
  };

  const handleDeleteStaff = async (id, username) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${username}"?`)) return;
    try { await api.delete(`/users/${id}`); fetchUsers(); }
    catch (err) { alert('Lỗi xóa: ' + (err.response?.data?.error || err.message)); }
  };

  // ── SINH VIÊN handlers ──
  const handleSvSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (!svForm.mssv.trim()) { setFormError('Vui lòng nhập MSSV.'); return; }
    if (!svForm.hoten.trim()) { setFormError('Vui lòng nhập họ tên.'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/users/students/${editingId}`, svForm);
      } else {
        await api.post('/users/students', svForm);
      }
      closeModal(); fetchUsers();
    } catch (err) {
      setFormError('Lỗi: ' + (err.response?.data?.error || err.message));
    } finally { setSubmitting(false); }
  };

  const loadLopByKhoa = async (makhoa) => {
    if (!makhoa) { setLopList([]); return []; }
    try {
      const r = await lookupAPI.getLopByKhoa(makhoa);
      const list = r.data?.data || r.data || [];
      setLopList(list);
      return list;
    } catch {
      setLopList([]);
      return [];
    }
  };

  const openEditSv = async (u) => {
    // Load lớp trước khi set form để tránh race condition
    const list = await loadLopByKhoa(u.makhoa || '');
    // Nếu SV chưa có lớp nhưng có khoa → tự động gán lớp đầu tiên của khoa
    const autoMalop = (!u.malop && list.length > 0) ? list[0].malop : (u.malop || '');
    setSvForm({
      mssv: u.mssv || u.id || '',
      hoten: u.hoten || '',
      malop: autoMalop,
      makhoa: u.makhoa || '',
      ngaysinh: u.ngaysinh ? String(u.ngaysinh).split('T')[0] : '',
      gioitinh: u.gioitinh || '',
      tinhtrang: u.tinhtrang || 'Đang học',
      khoahoc: u.khoahoc || '',
      bacdaotao: u.bacdaotao || 'Đại học',
      nganh: u.nganh || '',
    });
    setEditingId(u.mssv || u.id);
    setFormError('');
    setShowModal(true);
  };

  const handleDeleteSv = async (mssv, hoten) => {
    if (!window.confirm(`Xác nhận xóa sinh viên "${hoten}" (${mssv})?`)) return;
    try { await api.delete(`/users/students/${mssv}`); fetchUsers(); }
    catch (err) { alert('Lỗi xóa: ' + (err.response?.data?.error || err.message)); }
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null);
    setStaffForm(EMPTY_STAFF); setSvForm(EMPTY_SV);
    setLopList([]); setFormError('');
  };

  const displayedUsers = userType === 'students' && svSearch.trim()
    ? users.filter((u) => {
        const q = svSearch.trim().toLowerCase();
        return (
          (u.mssv || u.id || '').toString().toLowerCase().includes(q) ||
          (u.hoten || '').toLowerCase().includes(q) ||
          (u.malop || '').toLowerCase().includes(q) ||
          (u.makhoa || '').toLowerCase().includes(q)
        );
      })
    : users;

  const needsMakhoa = staffForm.role === 'khoa' || staffForm.role === 'giangvien';

  return (
    <div className="admin-page">
      <h2>👥 Quản Lý Người Dùng</h2>

      {/* Tabs */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, borderBottom: '2px solid #ddd', paddingBottom: 10 }}>
        <button onClick={() => { setUserType('staff'); setError(null); }}
          style={{ padding: '10px 20px', background: userType === 'staff' ? '#3498db' : '#ecf0f1', color: userType === 'staff' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          👔 Cán Bộ
        </button>
        <button onClick={() => { setUserType('students'); setError(null); }}
          style={{ padding: '10px 20px', background: userType === 'students' ? '#27ae60' : '#ecf0f1', color: userType === 'students' ? 'white' : '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          🎓 Sinh Viên
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {userType === 'staff' && (
          <>
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #ddd' }}>
              <option value="">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="giangvien">Giảng viên</option>
              <option value="ctsv">CTSV</option>
              <option value="khoa">Khoa</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #ddd' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={() => { setStaffForm(EMPTY_STAFF); setEditingId(null); setFormError(''); setShowModal(true); }}
              style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
              ➕ Thêm Cán Bộ
            </button>
          </>
        )}
        {userType === 'students' && (
          <>
            <input type="text" placeholder="Tìm theo MSSV, họ tên, lớp, khoa..."
              value={svSearch} onChange={(e) => setSvSearch(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 4, border: '1px solid #ddd', width: 280 }} />
            <button onClick={() => { setSvForm(EMPTY_SV); setLopList([]); setEditingId(null); setFormError(''); setShowModal(true); }}
              style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
              ➕ Thêm Sinh Viên
            </button>
          </>
        )}
        <button onClick={fetchUsers}
          style={{ padding: '7px 14px', background: '#ecf0f1', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}>
          🔄 Làm mới
        </button>
      </div>

      {!loading && !error && (
        <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          Tổng: <strong>{displayedUsers.length}</strong>
          {userType === 'students' && svSearch && ` / ${users.length}`} bản ghi
        </p>
      )}

      {/* Bảng dữ liệu */}
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>⏳ Đang tải...</div>
      ) : error ? (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626' }}>
          ⚠️ {error}
          <button onClick={fetchUsers} style={{ marginLeft: 12, padding: '4px 10px', cursor: 'pointer' }}>Thử lại</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {userType === 'staff' ? (
                  <>
                    <th style={th}>Username</th><th style={th}>Họ Tên</th><th style={th}>Email</th>
                    <th style={th}>Vai Trò</th><th style={th}>Mã Khoa</th><th style={th}>Trạng Thái</th>
                    <th style={{ ...th, textAlign: 'center' }}>Hành Động</th>
                  </>
                ) : (
                  <>
                    <th style={th}>MSSV</th><th style={th}>Họ Tên</th><th style={th}>Lớp</th>
                    <th style={th}>Khoa</th><th style={th}>Tình Trạng</th>
                    <th style={{ ...th, textAlign: 'center' }}>Hành Động</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Không có dữ liệu.</td></tr>
              ) : displayedUsers.map((u) => (
                <tr key={userType === 'staff' ? u.id : (u.mssv || u.id)} style={{ borderBottom: '1px solid #eee' }}>
                  {userType === 'staff' ? (
                    <>
                      <td style={td}>{u.username}</td>
                      <td style={td}>{u.hoten || '-'}</td>
                      <td style={td}>{u.email || '-'}</td>
                      <td style={td}>
                        <span style={{ background: ROLE_COLORS[u.role] || '#95a5a6', color: 'white', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td style={td}>{u.makhoa || '-'}</td>
                      <td style={td}>
                        <span style={{ background: u.status === 'active' ? '#27ae60' : '#95a5a6', color: 'white', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>
                          {u.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button onClick={() => openEditStaff(u)} style={btnEdit}>✏️ Sửa</button>
                        <button onClick={() => handleDeleteStaff(u.id, u.username)} style={btnDel}>🗑️ Xóa</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={td}>{u.mssv || u.id}</td>
                      <td style={td}>{u.hoten || '-'}</td>
                      <td style={td}>{u.malop || <span style={{ color: '#e74c3c', fontSize: 12 }}>⚠️ Chưa có lớp</span>}</td>
                      <td style={td}>{u.makhoa || '-'}</td>
                      <td style={td}>{u.tinhtrang || '-'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button onClick={() => openEditSv(u)} style={btnEdit}>✏️ Sửa</button>
                        <button onClick={() => handleDeleteSv(u.mssv || u.id, u.hoten)} style={btnDel}>🗑️ Xóa</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cán bộ */}
      {showModal && userType === 'staff' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? '✏️ Cập Nhật Cán Bộ' : '➕ Thêm Cán Bộ Mới'}</h3>
            {formError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>⚠️ {formError}</div>}
            <form onSubmit={handleStaffSubmit}>
              <Field label="Username" required>
                <input type="text" value={staffForm.username} onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  disabled={!!editingId} style={{ ...inp, background: editingId ? '#f9f9f9' : 'white' }} placeholder="Username đăng nhập" required />
              </Field>
              <Field label={editingId ? 'Mật Khẩu Mới (để trống nếu không đổi)' : 'Mật Khẩu'} required={!editingId}>
                <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  style={inp} placeholder={editingId ? 'Để trống nếu không thay đổi' : 'Nhập mật khẩu'} required={!editingId} />
              </Field>
              <Field label="Họ Tên">
                <input type="text" value={staffForm.hoten} onChange={(e) => setStaffForm({ ...staffForm, hoten: e.target.value })} style={inp} placeholder="Họ và tên đầy đủ" />
              </Field>
              <Field label="Email">
                <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} style={inp} placeholder="example@email.com" />
              </Field>
              <Field label="Vai Trò" required>
                <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value, makhoa: '' })} style={inp}>
                  <option value="admin">Admin</option>
                  <option value="giangvien">Giảng Viên</option>
                  <option value="ctsv">CTSV</option>
                  <option value="khoa">Khoa</option>
                </select>
              </Field>
              {needsMakhoa && (
                <Field label="Mã Khoa" required>
                  <select value={staffForm.makhoa} onChange={(e) => setStaffForm({ ...staffForm, makhoa: e.target.value })} style={inp} required>
                    <option value="">-- Chọn khoa --</option>
                    {khoaList.map((k) => <option key={k.makhoa} value={k.makhoa}>{k.makhoa} – {k.tenkhoa}</option>)}
                  </select>
                  <small style={{ color: '#666', fontSize: 12 }}>
                    {staffForm.role === 'khoa' ? 'Tài khoản Khoa chỉ quản lý sinh viên thuộc khoa này.' : 'Giảng viên chỉ xem/duyệt sinh viên thuộc khoa này.'}
                  </small>
                </Field>
              )}
              <Field label="Trạng Thái">
                <select value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })} style={inp}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={closeModal} style={btnCancel}>Hủy</button>
                <button type="submit" disabled={submitting} style={{ ...btnSave, background: submitting ? '#aaa' : '#27ae60' }}>
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập Nhật' : 'Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sinh viên */}
      {showModal && userType === 'students' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 8, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? '✏️ Cập Nhật Sinh Viên' : '➕ Thêm Sinh Viên Mới'}</h3>
            {formError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#dc2626', marginBottom: 14, fontSize: 13 }}>⚠️ {formError}</div>}
            <form onSubmit={handleSvSubmit}>
              <Field label="MSSV" required>
                <input type="text" value={svForm.mssv} onChange={(e) => setSvForm({ ...svForm, mssv: e.target.value })}
                  disabled={!!editingId} style={{ ...inp, background: editingId ? '#f9f9f9' : 'white' }} placeholder="Mã số sinh viên" required />
              </Field>
              <Field label="Họ Tên" required>
                <input type="text" value={svForm.hoten} onChange={(e) => setSvForm({ ...svForm, hoten: e.target.value })} style={inp} placeholder="Họ và tên đầy đủ" required />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Mã Khoa">
                  <select value={svForm.makhoa} onChange={async (e) => {
                    const mk = e.target.value;
                    setSvForm((prev) => ({ ...prev, makhoa: mk, malop: '' }));
                    const list = await loadLopByKhoa(mk);
                    // Tự động chọn lớp đầu tiên nếu có
                    if (list.length > 0) {
                      setSvForm((prev) => ({ ...prev, makhoa: mk, malop: list[0].malop }));
                    }
                  }} style={inp}>
                    <option value="">-- Chọn khoa --</option>
                    {khoaList.map((k) => <option key={k.makhoa} value={k.makhoa}>{k.makhoa} – {k.tenkhoa}</option>)}
                  </select>
                </Field>
                <Field label="Lớp">
                  <select value={svForm.malop} onChange={(e) => setSvForm((prev) => ({ ...prev, malop: e.target.value }))} style={inp}>
                    <option value="">-- Chọn lớp --</option>
                    {lopList.map((l) => <option key={l.malop} value={l.malop}>{l.malop}{l.tenlop ? ` – ${l.tenlop}` : ''}</option>)}
                    {svForm.malop && !lopList.find((l) => l.malop === svForm.malop) && (
                      <option value={svForm.malop}>{svForm.malop}</option>
                    )}
                  </select>
                  {!svForm.makhoa && <small style={{ color: '#e67e22', fontSize: 12 }}>Chọn khoa trước để lọc danh sách lớp.</small>}
                </Field>
                <Field label="Ngày Sinh">
                  <input type="date" value={svForm.ngaysinh} onChange={(e) => setSvForm((prev) => ({ ...prev, ngaysinh: e.target.value }))} style={inp} />
                </Field>
                <Field label="Giới Tính">
                  <select value={svForm.gioitinh} onChange={(e) => setSvForm((prev) => ({ ...prev, gioitinh: e.target.value }))} style={inp}>
                    <option value="">-- Chọn --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </Field>
                <Field label="Khóa học">
                  <select value={svForm.khoahoc} onChange={(e) => setSvForm((prev) => ({ ...prev, khoahoc: e.target.value }))} style={inp}>
                    <option value="">-- Chọn khóa --</option>
                    {Array.from({ length: 9 }, (_, i) => {
                      const start = 2022 + i;
                      const val = `${start}-${start + 4}`;
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </Field>
                <Field label="Bậc đào tạo">
                  <select value={svForm.bacdaotao} onChange={(e) => setSvForm((prev) => ({ ...prev, bacdaotao: e.target.value }))} style={inp}>
                    <option value="Đại học">Đại học</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                  </select>
                </Field>
              </div>
              <Field label="Ngành">
                <input type="text" value={svForm.nganh} onChange={(e) => setSvForm((prev) => ({ ...prev, nganh: e.target.value }))} style={inp} placeholder="VD: Công nghệ thông tin" />
              </Field>
              <Field label="Tình Trạng">
                <select value={svForm.tinhtrang} onChange={(e) => setSvForm((prev) => ({ ...prev, tinhtrang: e.target.value }))} style={inp}>
                  <option value="Đang học">Đang học</option>
                  <option value="Tốt nghiệp">Tốt nghiệp</option>
                  <option value="Bảo lưu">Bảo lưu</option>
                  <option value="Thôi học">Thôi học</option>
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" onClick={closeModal} style={btnCancel}>Hủy</button>
                <button type="submit" disabled={submitting} style={{ ...btnSave, background: submitting ? '#aaa' : '#27ae60' }}>
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập Nhật' : 'Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
