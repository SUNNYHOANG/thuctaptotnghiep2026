import React, { useState, useEffect } from 'react';
import { tieuChiDrlAPI, tieuChiChiTietAPI } from '../api/api';

const LOAI_OPTIONS = [
  { value: 'hoatdong', label: 'Hoạt động' },
  { value: 'hoc_tap',  label: 'Học tập' },
  { value: 'ky_luat',  label: 'Kỷ luật' },
  { value: 'khac',     label: 'Khác' },
];
const LOAI_LABEL = { hoatdong: 'Hoạt động', hoc_tap: 'Học tập', ky_luat: 'Kỷ luật', khac: 'Khác' };

const EMPTY_MUC = { ten: '', diem_toi_da: 20, loai: 'hoatdong', mo_ta: '' };
const EMPTY_ITEM = { noidung: '', diemtoida: 5, diemtoithieu: 0, ghichu: '', la_diem_tru: false, thutu: 0 };

const AdminTieuChiDRL = () => {
  const [mucs, setMucs] = useState([]);
  const [chitietMap, setChitietMap] = useState({}); // { matieuchi: [...items] }
  const [openMuc, setOpenMuc] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal thêm/sửa mục lớn
  const [mucModal, setMucModal] = useState(null); // null | { mode: 'add'|'edit', data }

  // Modal thêm/sửa tiêu chí con
  const [itemModal, setItemModal] = useState(null); // null | { mode, matieuchi, data, id? }

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mucRes, itemRes] = await Promise.all([
        tieuChiDrlAPI.getAll(),
        tieuChiChiTietAPI.getAllGrouped(),
      ]);
      const mucList = mucRes.data?.data || [];
      setMucs(mucList);
      // Build chitietMap từ grouped response
      const grouped = itemRes.data?.data || [];
      const map = {};
      grouped.forEach(g => { map[g.id] = g.items || []; });
      setChitietMap(map);
    } catch {
      setMsg('Lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Mục lớn ──────────────────────────────────────────────
  const handleSaveMuc = async () => {
    if (!mucModal) return;
    setSaving(true); setMsg('');
    try {
      const { mode, data, id } = mucModal;
      if (mode === 'add') {
        await tieuChiDrlAPI.create({ ten: data.ten, diem_toi_da: data.diem_toi_da, loai: data.loai, mo_ta: data.mo_ta });
      } else {
        await tieuChiDrlAPI.update(id, { ten: data.ten, diem_toi_da: data.diem_toi_da, loai: data.loai, mo_ta: data.mo_ta });
      }
      setMsg(mode === 'add' ? 'Thêm mục thành công.' : 'Cập nhật mục thành công.');
      setMucModal(null);
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi khi lưu mục.');
    } finally { setSaving(false); }
  };

  const handleDeleteMuc = async (muc) => {
    if (!window.confirm(`Xóa mục "${muc.ten}"? Tất cả tiêu chí con cũng sẽ bị xóa.`)) return;
    try {
      await tieuChiDrlAPI.delete(muc.id);
      fetchAll();
    } catch { setMsg('Lỗi khi xóa mục.'); }
  };

  // ── Tiêu chí con ─────────────────────────────────────────
  const handleSaveItem = async () => {
    if (!itemModal) return;
    setSaving(true); setMsg('');
    try {
      const { mode, matieuchi, data, id } = itemModal;
      const payload = {
        matieuchi,
        noidung: data.noidung,
        diemtoida: data.la_diem_tru ? 0 : Number(data.diemtoida),
        diemtoithieu: data.la_diem_tru ? Number(data.diemtoithieu) : 0,
        ghichu: data.ghichu,
        la_diem_tru: data.la_diem_tru ? 1 : 0,
        thutu: Number(data.thutu) || 0,
      };
      if (mode === 'add') {
        await tieuChiChiTietAPI.create(payload);
      } else {
        await tieuChiChiTietAPI.update(id, payload);
      }
      setMsg(mode === 'add' ? 'Thêm tiêu chí thành công.' : 'Cập nhật tiêu chí thành công.');
      setItemModal(null);
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lỗi khi lưu tiêu chí.');
    } finally { setSaving(false); }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Xóa tiêu chí "${item.noidung}"?`)) return;
    try {
      await tieuChiChiTietAPI.delete(item.id);
      fetchAll();
    } catch { setMsg('Lỗi khi xóa tiêu chí.'); }
  };

  const totalMax = mucs.reduce((s, m) => s + Number(m.diem_toi_da || 0), 0);

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Cấu hình tiêu chí DRL</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            Tổng điểm tối đa:{' '}
            <strong style={{ color: totalMax === 100 ? 'green' : 'red' }}>{totalMax}/100</strong>
            {totalMax !== 100 && <span style={{ color: 'red', marginLeft: 8 }}>⚠ Tổng phải bằng 100</span>}
          </p>
        </div>
        <button onClick={() => setMucModal({ mode: 'add', data: { ...EMPTY_MUC } })}
          style={btnStyle('#1976d2')}>+ Thêm mục</button>
      </div>

      {msg && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 6, background: msg.includes('thành công') ? '#e8f5e9' : '#ffebee', color: msg.includes('thành công') ? '#2e7d32' : '#c62828' }}>
          {msg}
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Đang tải...</div> : (
        <div>
          {mucs.map((muc, idx) => {
            const items = chitietMap[muc.id] || [];
            const isOpen = openMuc[muc.id];
            return (
              <div key={muc.id} style={{ marginBottom: 12, border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                {/* Header mục */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: isOpen ? '#e3f2fd' : '#f5f7fa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}
                    onClick={() => setOpenMuc(o => ({ ...o, [muc.id]: !o[muc.id] }))}>
                    <span style={{ fontSize: 12 }}>{isOpen ? '▾' : '▸'}</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{idx + 1}. {muc.ten}</span>
                    {muc.loai && <span style={{ fontSize: 11, background: '#e0e0e0', borderRadius: 8, padding: '1px 8px', color: '#555' }}>{LOAI_LABEL[muc.loai] || muc.loai}</span>}
                    <span style={{ fontSize: 13, color: '#1976d2', fontWeight: 600 }}>Tối đa: {muc.diem_toi_da}đ</span>
                    <span style={{ fontSize: 12, color: '#888' }}>({items.length} tiêu chí)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setMucModal({ mode: 'edit', id: muc.id, data: { ten: muc.ten, diem_toi_da: muc.diem_toi_da, loai: muc.loai || 'hoatdong', mo_ta: muc.mo_ta || '' } })}
                      style={btnStyle('#1976d2', true)}>Sửa mục</button>
                    <button onClick={() => handleDeleteMuc(muc)} style={btnStyle('#c62828', true)}>Xóa mục</button>
                  </div>
                </div>

                {/* Body: danh sách tiêu chí con */}
                {isOpen && (
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <button onClick={() => setItemModal({ mode: 'add', matieuchi: muc.id, data: { ...EMPTY_ITEM } })}
                        style={btnStyle('#2e7d32')}>+ Thêm tiêu chí con</button>
                    </div>

                    {items.length === 0 ? (
                      <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Chưa có tiêu chí con. Nhấn "+ Thêm tiêu chí con" để thêm.</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#fafafa' }}>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Nội dung tiêu chí</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>Loại</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: 90 }}>Khung điểm</th>
                            <th style={{ ...thStyle, width: 100 }}>Ghi chú</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: 120 }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={item.id} style={{ borderTop: '1px solid #f0f0f0', background: item.la_diem_tru ? '#fff8f8' : undefined }}>
                              <td style={{ ...tdStyle, color: '#999', textAlign: 'center' }}>{i + 1}</td>
                              <td style={tdStyle}>
                                {item.la_diem_tru && <span style={{ color: '#c62828', marginRight: 4 }}>[-]</span>}
                                {item.noidung}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: item.la_diem_tru ? '#ffebee' : '#e8f5e9', color: item.la_diem_tru ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
                                  {item.la_diem_tru ? 'Trừ' : 'Cộng'}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: item.la_diem_tru ? '#c62828' : '#1976d2' }}>
                                {item.la_diem_tru ? `${item.diemtoithieu} – 0` : `0 – ${item.diemtoida}`}đ
                              </td>
                              <td style={{ ...tdStyle, color: '#888' }}>{item.ghichu || '—'}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button onClick={() => setItemModal({
                                  mode: 'edit', id: item.id, matieuchi: muc.id,
                                  data: { noidung: item.noidung, diemtoida: item.diemtoida, diemtoithieu: item.diemtoithieu, ghichu: item.ghichu || '', la_diem_tru: !!item.la_diem_tru, thutu: item.thutu }
                                })} style={{ ...btnStyle('#1976d2', true), marginRight: 4 }}>Sửa</button>
                                <button onClick={() => handleDeleteItem(item)} style={btnStyle('#c62828', true)}>Xóa</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal mục lớn */}
      {mucModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginTop: 0 }}>{mucModal.mode === 'add' ? 'Thêm mục DRL' : 'Sửa mục DRL'}</h3>
            <div className="form-group">
              <label style={labelStyle}>Tên mục *</label>
              <input className="form-control" value={mucModal.data.ten}
                onChange={e => setMucModal(m => ({ ...m, data: { ...m.data, ten: e.target.value } }))}
                placeholder="VD: I. Ý thức tham gia học tập" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label style={labelStyle}>Điểm tối đa</label>
                <input type="number" min={0} max={100} className="form-control" value={mucModal.data.diem_toi_da}
                  onChange={e => setMucModal(m => ({ ...m, data: { ...m.data, diem_toi_da: Number(e.target.value) } }))} />
              </div>
              <div className="form-group">
                <label style={labelStyle}>Loại</label>
                <select className="form-control" value={mucModal.data.loai}
                  onChange={e => setMucModal(m => ({ ...m, data: { ...m.data, loai: e.target.value } }))}>
                  {LOAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Mô tả</label>
              <input className="form-control" value={mucModal.data.mo_ta}
                onChange={e => setMucModal(m => ({ ...m, data: { ...m.data, mo_ta: e.target.value } }))}
                placeholder="Mô tả ngắn về mục này" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setMucModal(null)} style={btnStyle('#888')}>Hủy</button>
              <button onClick={handleSaveMuc} disabled={saving || !mucModal.data.ten.trim()} style={btnStyle('#1976d2')}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tiêu chí con */}
      {itemModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginTop: 0 }}>{itemModal.mode === 'add' ? 'Thêm tiêu chí con' : 'Sửa tiêu chí con'}</h3>
            <div className="form-group">
              <label style={labelStyle}>Nội dung tiêu chí *</label>
              <textarea className="form-control" style={{ minHeight: 70 }} value={itemModal.data.noidung}
                onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, noidung: e.target.value } }))}
                placeholder="VD: Đi học chuyên cần, đúng giờ, đóng góp xây dựng bài" />
            </div>
            <div className="form-group">
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={itemModal.data.la_diem_tru}
                  onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, la_diem_tru: e.target.checked, diemtoida: e.target.checked ? 0 : m.data.diemtoida, diemtoithieu: e.target.checked ? m.data.diemtoithieu : 0 } }))} />
                Là điểm trừ (nhập số âm)
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {!itemModal.data.la_diem_tru ? (
                <div className="form-group">
                  <label style={labelStyle}>Điểm tối đa</label>
                  <input type="number" min={0} max={100} className="form-control" value={itemModal.data.diemtoida}
                    onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, diemtoida: Number(e.target.value) } }))} />
                </div>
              ) : (
                <div className="form-group">
                  <label style={labelStyle}>Điểm tối thiểu (âm)</label>
                  <input type="number" max={0} className="form-control" value={itemModal.data.diemtoithieu}
                    onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, diemtoithieu: Number(e.target.value) } }))} />
                </div>
              )}
              <div className="form-group">
                <label style={labelStyle}>Ghi chú</label>
                <input className="form-control" value={itemModal.data.ghichu}
                  onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, ghichu: e.target.value } }))}
                  placeholder="VD: 2đ/lần" />
              </div>
              <div className="form-group">
                <label style={labelStyle}>Thứ tự</label>
                <input type="number" min={0} className="form-control" value={itemModal.data.thutu}
                  onChange={e => setItemModal(m => ({ ...m, data: { ...m.data, thutu: Number(e.target.value) } }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setItemModal(null)} style={btnStyle('#888')}>Hủy</button>
              <button onClick={handleSaveItem} disabled={saving || !itemModal.data.noidung.trim()} style={btnStyle('#2e7d32')}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const btnStyle = (bg, small = false) => ({
  padding: small ? '4px 10px' : '8px 16px',
  background: bg, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: small ? 12 : 14,
});
const thStyle = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#555', borderBottom: '1px solid #e0e0e0' };
const tdStyle = { padding: '8px 10px', fontSize: 13 };
const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalStyle = { background: '#fff', borderRadius: 10, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' };

export default AdminTieuChiDRL;
