import React, { useState, useEffect } from 'react';
import { gradeAPI } from '../api/api';
import './StudentGrades.css';

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const XL_COLOR = {
  'Xuất sắc': '#27ae60',
  'Giỏi': '#2980b9',
  'Khá': '#f39c12',
  'Trung bình': '#e67e22',
  'Yếu': '#e74c3c',
  'Chưa xếp loại': '#95a5a6',
};

function xepLoai(tongket) {
  if (tongket === null || tongket === undefined) return 'Chưa xếp loại';
  if (tongket >= 9) return 'Xuất sắc';
  if (tongket >= 8) return 'Giỏi';
  if (tongket >= 7) return 'Khá';
  if (tongket >= 5) return 'Trung bình';
  return 'Yếu';
}

const StudentGrades = () => {
  const user = getUser();
  const [grades, setGrades] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user.mssv) loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const res = await gradeAPI.getByStudent(user.mssv);
      const data = res.data || [];
      setGrades(data);

      // Lấy danh sách học kỳ duy nhất
      const hkSet = [...new Set(data.map(g => g.mahocky).filter(Boolean))];
      hkSet.sort((a, b) => b - a);
      setSemesters(hkSet);
      if (hkSet.length > 0) setSelectedSemester(String(hkSet[0]));
    } catch (err) {
      setError('Lỗi tải điểm: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = selectedSemester
    ? grades.filter(g => String(g.mahocky) === selectedSemester)
    : grades;

  // GPA học kỳ (trung bình có trọng số tín chỉ)
  const totalTinChi = filtered.reduce((s, g) => s + (g.sotinchi || 0), 0);
  const gpaHocKy = totalTinChi > 0
    ? Math.round(filtered.reduce((s, g) => s + (g.gpa || 0) * (g.sotinchi || 0), 0) / totalTinChi * 100) / 100
    : null;

  const xlHocKy = xepLoai(gpaHocKy !== null ? (gpaHocKy / 4) * 10 : null);

  if (loading) return <div className="sg-loading">Đang tải bảng điểm...</div>;
  if (error) return <div className="sg-error">{error}</div>;

  return (
    <div className="sg-container">
      <div className="sg-header">
        <h1>📊 Bảng điểm của tôi</h1>
        <p>Xin chào, <strong>{user.hoten || user.username}</strong> – MSSV: {user.mssv}</p>
      </div>

      {/* Chọn học kỳ */}
      {semesters.length > 0 && (
        <div className="sg-filter">
          <label>Học kỳ:</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
            <option value="">Tất cả học kỳ</option>
            {semesters.map(hk => (
              <option key={hk} value={String(hk)}>
                {filtered.find(g => String(g.mahocky) === String(hk))?.tenhocky || `HK ${hk}`}
                {filtered.find(g => String(g.mahocky) === String(hk))?.namhoc
                  ? ` – ${filtered.find(g => String(g.mahocky) === String(hk))?.namhoc}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Thẻ tóm tắt */}
      <div className="sg-summary">
        <div className="sg-card">
          <div className="sg-card-label">Số môn</div>
          <div className="sg-card-value">{filtered.length}</div>
        </div>
        <div className="sg-card">
          <div className="sg-card-label">Tổng tín chỉ</div>
          <div className="sg-card-value">{totalTinChi}</div>
        </div>
        <div className="sg-card">
          <div className="sg-card-label">GPA học kỳ</div>
          <div className="sg-card-value" style={{ color: '#8e44ad' }}>
            {gpaHocKy !== null ? gpaHocKy : '–'}
          </div>
        </div>
        <div className="sg-card">
          <div className="sg-card-label">Xếp loại</div>
          <div className="sg-card-value">
            <span className="xl-badge" style={{ background: XL_COLOR[xlHocKy] || '#95a5a6' }}>
              {xlHocKy}
            </span>
          </div>
        </div>
      </div>

      {/* Bảng điểm */}
      {filtered.length === 0 ? (
        <div className="sg-empty">Chưa có điểm chính thức nào được công bố.</div>
      ) : (
        <div className="sg-table-wrapper">
          <table className="sg-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên môn học</th>
                <th>Tín chỉ</th>
                <th>Chuyên cần</th>
                <th>Giữa kỳ</th>
                <th>Cuối kỳ</th>
                <th>Tổng kết</th>
                <th>GPA</th>
                <th>Xếp loại</th>
                <th>Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const xl = xepLoai(g.diemtongket);
                return (
                  <tr key={g.mabangdiem}>
                    <td>{i + 1}</td>
                    <td className="sg-subject">{g.tenmonhoc}</td>
                    <td>{g.sotinchi}</td>
                    <td>{g.diemchuyencan ?? '–'}</td>
                    <td>{g.diemgiuaky ?? '–'}</td>
                    <td>{g.diemcuoiky ?? '–'}</td>
                    <td><strong>{g.diemtongket ?? '–'}</strong></td>
                    <td><strong style={{ color: '#8e44ad' }}>{g.gpa ?? '–'}</strong></td>
                    <td>
                      <span className="xl-badge" style={{ background: XL_COLOR[xl] || '#95a5a6' }}>
                        {xl}
                      </span>
                    </td>
                    <td>
                      {g.canhbao ? (
                        <span className="sg-warning">{g.canhbao}</span>
                      ) : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ghi chú cách tính */}
      <div className="sg-note">
        <strong>Cách tính điểm:</strong> Tổng kết = Chuyên cần × 10% + Giữa kỳ × 30% + Cuối kỳ × 60% &nbsp;|&nbsp;
        GPA = (Tổng kết ÷ 10) × 4 &nbsp;|&nbsp;
        Chỉ hiển thị điểm đã được công bố chính thức.
      </div>
    </div>
  );
};

export default StudentGrades;
