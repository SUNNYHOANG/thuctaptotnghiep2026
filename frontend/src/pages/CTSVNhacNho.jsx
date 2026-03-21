import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { lookupAPI, drlSelfAPI } from '../api/api';
import api from '../api/api';
import './CTSVNhacNho.css';

// Mẫu nhắc nhở nhanh (Task 5.3)
const REMINDER_TEMPLATES = [
  {
    id: 'nhac_nop_drl',
    label: 'Nhắc nộp DRL',
    tieude: 'Nhắc nhở: Nộp phiếu tự đánh giá điểm rèn luyện',
    noidung:
      'Kính gửi các bạn sinh viên,\n\nHạn nộp phiếu tự đánh giá điểm rèn luyện (DRL) đang đến gần. Vui lòng đăng nhập hệ thống và hoàn thành phiếu tự đánh giá trước thời hạn quy định.\n\nTrân trọng,\nPhòng Công tác Sinh viên',
    loai: 'nhacnho_drl',
  },
  {
    id: 'nhac_hoan_thien_ho_so',
    label: 'Nhắc hoàn thiện hồ sơ',
    tieude: 'Nhắc nhở: Hoàn thiện thông tin hồ sơ sinh viên',
    noidung:
      'Kính gửi các bạn sinh viên,\n\nHồ sơ của bạn trong hệ thống còn thiếu một số thông tin bắt buộc. Vui lòng đăng nhập và cập nhật đầy đủ thông tin cá nhân (ngày sinh, giới tính, địa chỉ, v.v.) để tránh ảnh hưởng đến các thủ tục hành chính.\n\nTrân trọng,\nPhòng Công tác Sinh viên',
    loai: 'nhacnho_hoso',
  },
];

const TRANGTHAI_OPTIONS = [
  { value: '', label: '-- Tất cả trạng thái --' },
  { value: 'chua_nop', label: 'Chưa nộp' },
  { value: 'choduyet', label: 'Chờ duyệt (GV)' },
  { value: 'chokhoaduyet', label: 'Chờ khoa duyệt' },
  { value: 'bituchoi', label: 'Bị từ chối' },
  { value: 'daduyet', label: 'Đã duyệt' },
];

const CTSVNhacNho = () => {
  const { user } = useAuth();

  // --- Task 5.1: FilterPanel state ---
  const [hockyList, setHockyList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);
  const [lopList, setLopList] = useState([]);
  const [filterHocky, setFilterHocky] = useState('');
  const [filterTrangthai, setFilterTrangthai] = useState('chua_nop');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [filterLop, setFilterLop] = useState('');

  // --- Task 5.2: Preview state ---
  const [previewList, setPreviewList] = useState(null); // null = chưa xem trước
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // --- Task 5.3 + 5.4: Form state ---
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [form, setForm] = useState({ tieude: '', noidung: '', loai: 'nhacnho_drl' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  // --- Task 5.5: History state ---
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load danh sách học kỳ, khoa, lớp khi mount (Task 5.1)
  useEffect(() => {
    loadLookupData();
    loadHistory();
  }, []);

  // Khi filterKhoa thay đổi, load lại danh sách lớp
  useEffect(() => {
    loadLopList(filterKhoa);
    setFilterLop('');
  }, [filterKhoa]);

  const loadLookupData = async () => {
    try {
      const [hkRes, lopRes] = await Promise.all([
        lookupAPI.getHocKyDangMo(),
        lookupAPI.getLop(),
      ]);
      const hkData = Array.isArray(hkRes.data) ? hkRes.data : hkRes.data?.data || [];
      setHockyList(hkData);
      if (hkData.length > 0) setFilterHocky(String(hkData[0].mahocky));

      // Load khoa từ report-stats
      const khoaRes = await api.get('/lookup/report-stats', { params: { group: 'makhoa' } });
      const khoaData = khoaRes.data?.data || [];
      setKhoaList(khoaData.map((k) => ({ makhoa: k.name, tenkhoaLabel: k.name })));

      const lopData = lopRes.data?.data || [];
      setLopList(lopData);
    } catch (err) {
      console.error('Lỗi load lookup:', err);
    }
  };

  const loadLopList = async (makhoa) => {
    try {
      const res = await lookupAPI.getLopByKhoa(makhoa || '');
      setLopList(res.data?.data || []);
    } catch {
      setLopList([]);
    }
  };

  // Task 5.5: Load lịch sử nhắc nhở
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/thongbao/reminder-history');
      setHistoryRows(res.data?.data || res.data || []);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Task 5.2: Xem trước danh sách sinh viên
  const handlePreview = async () => {
    if (!filterHocky) {
      setPreviewError('Vui lòng chọn học kỳ trước khi xem trước.');
      return;
    }
    if (!filterTrangthai) {
      setPreviewError('Vui lòng chọn trạng thái DRL.');
      return;
    }
    setPreviewing(true);
    setPreviewError('');
    setPreviewList(null);
    try {
      const params = { mahocky: filterHocky, trangthai: filterTrangthai };
      if (filterKhoa) params.makhoa = filterKhoa;
      if (filterLop) params.malop = filterLop;
      const res = await api.get('/drl-self/students-by-status', { params });
      setPreviewList(res.data?.data || []);
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Không thể tải danh sách sinh viên.');
      setPreviewList([]);
    } finally {
      setPreviewing(false);
    }
  };

  // Task 5.3: Chọn mẫu nhắc nhở
  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplate(id);
    if (!id) return;
    const tpl = REMINDER_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      setForm({ tieude: tpl.tieude, noidung: tpl.noidung, loai: tpl.loai });
    }
  };

  // Task 5.4: Gửi nhắc nhở
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tieude?.trim()) {
      setMessage('Vui lòng nhập tiêu đề.');
      setMessageType('error');
      return;
    }
    if (!previewList || previewList.length === 0) {
      setMessage('Không có sinh viên nào để gửi. Vui lòng xem trước danh sách trước.');
      setMessageType('error');
      return;
    }
    try {
      setSending(true);
      setMessage('');
      const mssvList = previewList.map((sv) => sv.mssv);
      const payload = {
        tieude: form.tieude.trim(),
        noidung: form.noidung?.trim() || '',
        loai: form.loai || 'nhacnho_drl',
        mahocky: filterHocky ? Number(filterHocky) : undefined,
        mssv_list: mssvList,
      };
      const res = await api.post('/thongbao/reminder', payload);
      const soNguoi = res.data?.so_nguoi_nhan ?? mssvList.length;
      setMessage(`Đã gửi nhắc nhở đến ${soNguoi} sinh viên.`);
      setMessageType('success');
      setForm({ tieude: '', noidung: '', loai: 'nhacnho_drl' });
      setSelectedTemplate('');
      setPreviewList(null);
      loadHistory();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Gửi thất bại.');
      setMessageType('error');
    } finally {
      setSending(false);
    }
  };

  const canSend = previewList && previewList.length > 0;

  return (
    <div className="page-card ctsv-nhac-nho">
      <h1>Gửi nhắc nhở sinh viên</h1>
      <p className="intro">Lọc sinh viên theo trạng thái DRL, xem trước danh sách rồi gửi thông báo nhắc nhở.</p>

      {/* Task 5.1: FilterPanel */}
      <section className="filter-panel">
        <h2>Bộ lọc</h2>
        <div className="filter-row">
          <div className="filter-field">
            <label>Học kỳ *</label>
            <select value={filterHocky} onChange={(e) => setFilterHocky(e.target.value)}>
              <option value="">-- Chọn học kỳ --</option>
              {hockyList.map((hk) => (
                <option key={hk.mahocky} value={String(hk.mahocky)}>
                  {hk.tenhocky || hk.mahocky}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Trạng thái DRL *</label>
            <select value={filterTrangthai} onChange={(e) => setFilterTrangthai(e.target.value)}>
              {TRANGTHAI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Khoa</label>
            <select value={filterKhoa} onChange={(e) => setFilterKhoa(e.target.value)}>
              <option value="">-- Tất cả khoa --</option>
              {khoaList.map((k) => (
                <option key={k.makhoa} value={k.makhoa}>
                  {k.makhoa}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Lớp</label>
            <select value={filterLop} onChange={(e) => setFilterLop(e.target.value)}>
              <option value="">-- Tất cả lớp --</option>
              {lopList.map((l) => (
                <option key={l.malop} value={l.malop}>
                  {l.tenlop ? `${l.malop} – ${l.tenlop}` : l.malop}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn secondary"
          onClick={handlePreview}
          disabled={previewing || !filterHocky || !filterTrangthai}
        >
          {previewing ? 'Đang tải...' : '🔍 Xem trước'}
        </button>
      </section>

      {/* Task 5.2: PreviewTable */}
      {previewError && <div className="message error">{previewError}</div>}

      {previewList !== null && (
        <section className="preview-section">
          <h2>Danh sách sinh viên sẽ nhận thông báo ({previewList.length})</h2>
          {previewList.length === 0 ? (
            <div className="message warning">
              ⚠️ Không có sinh viên nào phù hợp với bộ lọc đã chọn.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Khoa</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {previewList.map((sv, idx) => (
                    <tr key={sv.mssv}>
                      <td>{idx + 1}</td>
                      <td>{sv.mssv}</td>
                      <td>{sv.hoten}</td>
                      <td>{sv.malop}</td>
                      <td>{sv.makhoa}</td>
                      <td>{sv.trangthai || filterTrangthai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Task 5.3 + 5.4: Form gửi nhắc nhở */}
      <section className="reminder-form-section">
        <h2>Soạn nhắc nhở</h2>

        {message && (
          <div className={`message ${messageType}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="nhac-nho-form">
          {/* Task 5.3: Tiêu đề dạng dropdown chọn từ mẫu hoặc tự nhập */}
          <label>Tiêu đề *</label>
          <select
            value={REMINDER_TEMPLATES.some((t) => t.tieude === form.tieude) ? form.tieude : '__custom__'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__custom__') {
                setForm((f) => ({ ...f, tieude: '' }));
                setSelectedTemplate('');
              } else {
                const tpl = REMINDER_TEMPLATES.find((t) => t.tieude === val);
                if (tpl) {
                  setForm({ tieude: tpl.tieude, noidung: tpl.noidung, loai: tpl.loai });
                  setSelectedTemplate(tpl.id);
                }
              }
            }}
          >
            <option value="">-- Chọn tiêu đề --</option>
            {REMINDER_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.tieude}>
                {tpl.tieude}
              </option>
            ))}
            <option value="__custom__">✏️ Tự nhập tiêu đề...</option>
          </select>

          {/* Hiện input tự nhập khi chọn "Tự nhập" hoặc tiêu đề không khớp mẫu nào */}
          {(!REMINDER_TEMPLATES.some((t) => t.tieude === form.tieude)) && (
            <input
              value={form.tieude}
              onChange={(e) => setForm((f) => ({ ...f, tieude: e.target.value }))}
              placeholder="Nhập tiêu đề thông báo"
              maxLength={255}
              style={{ marginTop: '6px' }}
            />
          )}

          <label>Nội dung</label>
          <textarea
            value={form.noidung}
            onChange={(e) => setForm((f) => ({ ...f, noidung: e.target.value }))}
            rows={5}
            placeholder="Nội dung nhắc nhở"
          />

          <label>Loại thông báo</label>
          <select
            value={form.loai}
            onChange={(e) => setForm((f) => ({ ...f, loai: e.target.value }))}
          >
            <option value="nhacnho_drl">Nhắc nộp DRL</option>
            <option value="nhacnho_hoso">Nhắc hoàn thiện hồ sơ</option>
            <option value="nhacnho">Nhắc nhở chung</option>
          </select>

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary"
              disabled={sending || !canSend}
              title={!canSend ? 'Vui lòng xem trước danh sách sinh viên trước khi gửi' : ''}
            >
              {sending ? 'Đang gửi...' : '📨 Gửi nhắc nhở'}
            </button>
            {previewList !== null && previewList.length === 0 && (
              <span className="send-disabled-hint">Không có sinh viên để gửi</span>
            )}
          </div>
        </form>
      </section>

      {/* Task 5.5: HistoryTable */}
      <section className="history-section">
        <h2>Lịch sử nhắc nhở</h2>
        {historyLoading ? (
          <p>Đang tải lịch sử...</p>
        ) : historyRows.length === 0 ? (
          <p className="no-data">Chưa có lịch sử nhắc nhở nào.</p>
        ) : (
          <div className="table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thời gian gửi</th>
                  <th>Tiêu đề</th>
                  <th>Loại</th>
                  <th>Số người nhận</th>
                  <th>Người gửi</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.mathongbao || row.id}>
                    <td>{row.ngaytao ? new Date(row.ngaytao).toLocaleString('vi-VN') : '—'}</td>
                    <td>{row.tieude}</td>
                    <td>{row.loai}</td>
                    <td>{row.so_nguoi_nhan ?? (Array.isArray(row.nguoi_nhan) ? row.nguoi_nhan.length : '—')}</td>
                    <td>{row.nguoi_gui || row.ten_nguoi_gui || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default CTSVNhacNho;
