import React, { useState, useEffect } from 'react';
import { lookupAPI, drlSelfAPI } from '../api/api';
import api from '../api/api';

const CTSVBaoCao = () => {
  const [hockyList, setHockyList] = useState([]);
  const [mahocky, setMahocky] = useState('');
  const [khoaList, setKhoaList] = useState([]);
  const [makhoa, setMakhoa] = useState('');
  const [exporting, setExporting] = useState('');
  const [message, setMessage] = useState('');
  const [drlStats, setDrlStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
    lookupAPI.getKhoaList().then(r => setKhoaList(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mahocky) loadStats();
  }, [mahocky, makhoa]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const params = { mahocky };
      if (makhoa) params.makhoa = makhoa;
      const res = await api.get('/drl-self/manage', { params });
      const data = res.data?.data || [];
      const total = data.length;
      const daduyet = data.filter(r => r.trangthai === 'daduyet' && r.nguoi_duyet_ctsv).length;
      const choduyet = data.filter(r => r.trangthai === 'choduyet').length;
      const chokhoa = data.filter(r => r.trangthai === 'chokhoaduyet').length;
      const bituchoi = data.filter(r => r.trangthai === 'bituchoi').length;
      const avgDiem = data.filter(r => r.diem_ctsv != null).reduce((s, r) => s + Number(r.diem_ctsv), 0) /
        (data.filter(r => r.diem_ctsv != null).length || 1);
      setDrlStats({ total, daduyet, choduyet, chokhoa, bituchoi, avgDiem: avgDiem.toFixed(1) });
    } catch { setDrlStats(null); } finally { setLoadingStats(false); }
  };

  const exportDRL = async () => {
    if (!mahocky) { setMessage('⚠️ Vui lòng chọn học kỳ.'); return; }
    try {
      setExporting('drl');
      setMessage('');
      const params = { mahocky };
      if (makhoa) params.makhoa = makhoa;
      const res = await drlSelfAPI.exportExcel(params);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-drl-hk${mahocky}${makhoa ? '-' + makhoa : ''}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('✅ Xuất báo cáo DRL thành công.');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xuất báo cáo.'));
    } finally { setExporting(''); }
  };

  const exportDonOnline = async () => {
    try {
      setExporting('don');
      setMessage('');
      const params = {};
      if (mahocky) params.mahocky = mahocky;
      const res = await api.get('/don-online', { params });
      const data = res.data?.data || [];
      // Tạo CSV đơn giản
      const headers = ['Mã đơn', 'MSSV', 'Họ tên', 'Lớp', 'Loại đơn', 'Tiêu đề', 'Trạng thái', 'Ngày nộp'];
      const rows = data.map(d => [
        d.madon, d.mssv, d.hoten, d.malop, d.loaidon, d.tieude, d.trangthai,
        new Date(d.ngaygui).toLocaleDateString('vi-VN')
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-don-online.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('✅ Xuất danh sách đơn online thành công.');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xuất.'));
    } finally { setExporting(''); }
  };

  const exportHocBong = async () => {
    if (!mahocky) { setMessage('⚠️ Vui lòng chọn học kỳ.'); return; }
    try {
      setExporting('hocbong');
      setMessage('');
      const res = await api.get('/hoc-bong', { params: { mahocky } });
      const data = Array.isArray(res.data) ? res.data : [];
      const headers = ['Mã HB', 'Tên học bổng', 'Giá trị', 'Số lượng', 'Học kỳ'];
      const rows = data.map(h => [h.mahocbong, h.tenhocbong, h.giatri, h.soluong, h.mahocky]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-hoc-bong-hk${mahocky}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('✅ Xuất danh sách học bổng thành công.');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Lỗi khi xuất.'));
    } finally { setExporting(''); }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📤 Xuất báo cáo tổng hợp</h1>
        </div>

        {message && (
          <div className={`alert ${message.startsWith('✅') ? 'alert-success' : message.startsWith('⚠️') ? 'alert-warning' : 'alert-danger'}`}
            style={{ margin: '8px 0' }}>{message}</div>
        )}

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Học kỳ</label>
            <select className="form-control" style={{ width: 200 }} value={mahocky} onChange={e => setMahocky(e.target.value)}>
              <option value="">-- Tất cả học kỳ --</option>
              {hockyList.map(h => <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Khoa</label>
            <select className="form-control" style={{ width: 200 }} value={makhoa} onChange={e => setMakhoa(e.target.value)}>
              <option value="">-- Tất cả khoa --</option>
              {khoaList.map(k => <option key={k.makhoa} value={k.makhoa}>{k.tenkhoa || k.makhoa}</option>)}
            </select>
          </div>
        </div>

        {/* Thống kê DRL nhanh */}
        {mahocky && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Tổng quan DRL học kỳ {hockyList.find(h => h.mahocky == mahocky)?.tenhocky}</h3>
            {loadingStats ? <div className="spinner" /> : drlStats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Tổng phiếu', value: drlStats.total, color: '#3498db' },
                  { label: 'Đã duyệt cuối', value: drlStats.daduyet, color: '#27ae60' },
                  { label: 'Chờ GV duyệt', value: drlStats.choduyet, color: '#f39c12' },
                  { label: 'Chờ Khoa duyệt', value: drlStats.chokhoa, color: '#e67e22' },
                  { label: 'Bị từ chối', value: drlStats.bituchoi, color: '#e74c3c' },
                  { label: 'Điểm TB', value: drlStats.avgDiem, color: '#9b59b6' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}`,
                    borderRadius: 6, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Các nút xuất */}
        <h3 style={{ marginBottom: 16 }}>Xuất dữ liệu</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            {
              key: 'drl', icon: '📊', title: 'Báo cáo điểm rèn luyện',
              desc: 'Xuất toàn bộ phiếu DRL theo học kỳ (Excel)',
              action: exportDRL, color: '#9b59b6', note: '* Cần chọn học kỳ'
            },
            {
              key: 'don', icon: '📋', title: 'Danh sách đơn online',
              desc: 'Xuất tất cả đơn hành chính (CSV)',
              action: exportDonOnline, color: '#e67e22', note: ''
            },
            {
              key: 'hocbong', icon: '🎓', title: 'Danh sách học bổng',
              desc: 'Xuất danh sách học bổng theo học kỳ (CSV)',
              action: exportHocBong, color: '#27ae60', note: '* Cần chọn học kỳ'
            },
          ].map(item => (
            <div key={item.key} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, background: '#fff' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{item.desc}</div>
              {item.note && <div style={{ fontSize: 12, color: '#e67e22', marginBottom: 8 }}>{item.note}</div>}
              <button className="btn btn-primary btn-sm" disabled={exporting === item.key}
                onClick={item.action}
                style={{ background: item.color, borderColor: item.color }}>
                {exporting === item.key ? '⏳ Đang xuất...' : '📥 Xuất'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CTSVBaoCao;
