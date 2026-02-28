import React, { useState, useEffect } from 'react';
import { scoresAPI, lookupAPI } from '../api/api';
import './Scores.css';

const Scores = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mssv, setMssv] = useState('');
  const [mahocky, setMahocky] = useState('');
  const [viewMode, setViewMode] = useState('mssv'); // 'mssv' | 'semester'
  const [hockyList, setHockyList] = useState([]);
  const [selectedHocky, setSelectedHocky] = useState('');

  useEffect(() => {
    lookupAPI.getHocKy().then(r => setHockyList(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewMode === 'mssv' && mssv) {
      loadScores();
    } else if (viewMode === 'semester' && selectedHocky) {
      loadScoresBySemester();
    } else {
      setScores([]);
      setLoading(false);
    }
  }, [mssv, viewMode, selectedHocky]);

  const loadScores = async () => {
    try {
      setLoading(true);
      const res = await scoresAPI.getByStudent(mssv);
      setScores(Array.isArray(res.data) ? res.data : [res.data].filter(Boolean));
    } catch (error) {
      console.error('Error loading scores:', error);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const loadScoresBySemester = async () => {
    try {
      setLoading(true);
      const res = await scoresAPI.getBySemester(selectedHocky);
      setScores(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading scores:', error);
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (scores.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['MSSV', 'Họ tên', 'Lớp', 'Học kỳ', 'Điểm hoạt động', 'Điểm học tập', 'Điểm kỷ luật', 'Tổng điểm', 'Xếp loại'];
    const rows = scores.map(s => [
      s.mssv || '',
      s.hoten || '',
      s.malop || '',
      (s.tenhocky || '') + ' ' + (s.namhoc || ''),
      s.diemhoatdong ?? '',
      s.diemhoctap ?? '',
      s.diemkyluat ?? '',
      s.diemtong ?? '',
      s.xeploai || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diem-ren-luyen-${viewMode === 'semester' ? selectedHocky : mssv}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCalculate = async () => {
    if (!mssv || !mahocky) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await scoresAPI.calculate({ mssv, mahocky });
      loadScores();
      alert('Tính điểm thành công!');
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể tính điểm');
    }
  };

  const getScoreColor = (diemtong) => {
    if (diemtong >= 90) return '#28a745';
    if (diemtong >= 80) return '#17a2b8';
    if (diemtong >= 70) return '#ffc107';
    if (diemtong >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getRankColor = (xeploai) => {
    const colors = {
      'Xuất sắc': '#28a745',
      'Tốt': '#17a2b8',
      'Khá': '#ffc107',
      'Trung bình': '#fd7e14',
      'Yếu': '#dc3545',
      'Chưa đạt': '#6c757d'
    };
    return colors[xeploai] || '#6c757d';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Điểm Rèn Luyện</h1>
      </div>

      <div className="card">
        <div className="score-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Chế độ xem:</label>
            <select className="form-control" value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ minWidth: '140px' }}>
              <option value="mssv">Theo MSSV</option>
              <option value="semester">Theo học kỳ (báo cáo)</option>
            </select>
          </div>
          {viewMode === 'mssv' && (
            <>
              <div className="form-group">
                <label className="form-label">Mã sinh viên:</label>
                <input
                  type="text"
                  className="form-control"
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  placeholder="Nhập MSSV"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mã học kỳ (tính điểm):</label>
                <input
                  type="text"
                  className="form-control"
                  value={mahocky}
                  onChange={(e) => setMahocky(e.target.value)}
                  placeholder="Nhập mã học kỳ"
                />
              </div>
              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button className="btn btn-primary" onClick={handleCalculate}>
                  Tính Điểm
                </button>
              </div>
            </>
          )}
          {viewMode === 'semester' && (
            <div className="form-group">
              <label className="form-label">Học kỳ:</label>
              <select className="form-control" value={selectedHocky} onChange={(e) => setSelectedHocky(e.target.value)} style={{ minWidth: '180px' }}>
                <option value="">-- Chọn học kỳ --</option>
                {hockyList.map(h => (
                  <option key={h.mahocky} value={h.mahocky}>{h.tenhocky} - {h.namhoc}</option>
                ))}
              </select>
            </div>
          )}
          {scores.length > 0 && (
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              Xuất báo cáo CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : scores.length === 0 ? (
          <div className="text-center mt-4">
            <p>Chưa có điểm rèn luyện.</p>
          </div>
        ) : (
          <>
            <div className="scores-summary">
              {scores.map((score, index) => (
                <div key={index} className="score-card">
                  <div className="score-header">
                    <h3>{score.tenhocky} - {score.namhoc}</h3>
                    <div 
                      className="score-total"
                      style={{ color: getScoreColor(score.diemtong) }}
                    >
                      {score.diemtong} điểm
                    </div>
                  </div>
                  <div className="score-details">
                    <div className="score-item">
                      <span className="score-label">Điểm hoạt động:</span>
                      <span className="score-value">{score.diemhoatdong}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Điểm học tập:</span>
                      <span className="score-value">{score.diemhoctap}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Điểm kỷ luật:</span>
                      <span className="score-value">{score.diemkyluat}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Xếp loại:</span>
                      <span 
                        className="score-rank"
                        style={{ color: getRankColor(score.xeploai) }}
                      >
                        {score.xeploai}
                      </span>
                    </div>
                  </div>
                  {score.ghichu && (
                    <div className="score-note">
                      <strong>Ghi chú:</strong> {score.ghichu}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="table-responsive mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Học Kỳ</th>
                    <th>Năm Học</th>
                    <th>Điểm Hoạt Động</th>
                    <th>Điểm Học Tập</th>
                    <th>Điểm Kỷ Luật</th>
                    <th>Tổng Điểm</th>
                    <th>Xếp Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, index) => (
                    <tr key={index}>
                      <td>{score.tenhocky}</td>
                      <td>{score.namhoc}</td>
                      <td>{score.diemhoatdong}</td>
                      <td>{score.diemhoctap}</td>
                      <td>{score.diemkyluat}</td>
                      <td style={{ color: getScoreColor(score.diemtong), fontWeight: 'bold' }}>
                        {score.diemtong}
                      </td>
                      <td>
                        <span 
                          className="badge"
                          style={{ 
                            backgroundColor: getRankColor(score.xeploai) + '20',
                            color: getRankColor(score.xeploai)
                          }}
                        >
                          {score.xeploai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Scores;
