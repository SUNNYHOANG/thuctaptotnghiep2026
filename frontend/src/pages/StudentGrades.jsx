import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradesAPIEndpoints } from '../api/gradesAPI';
import { calculateGPA, getClassification, formatScore, getAcademicWarning } from '../utils/gradeUtils';
import './StudentGrades.css';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradesAPIEndpoints.getStudentGrades(user?.mssv);
      setGrades(response.data);
      
      // Lấy danh sách học kỳ
      const semesters = [...new Set(response.data.map(g => g.mahocky))];
      setSemesters(semesters.sort((a, b) => b - a));
      if (semesters.length > 0) {
        setSelectedSemester(semesters[0]);
      }
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = selectedSemester 
    ? grades.filter(g => g.mahocky === selectedSemester)
    : grades;

  const totalGPA = filteredGrades.length > 0 
    ? (filteredGrades.reduce((sum, g) => sum + (g.gpa || 0), 0) / filteredGrades.length).toFixed(2)
    : 0;

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-grades-container">
      <div className="grades-header">
        <h1>📊 Bảng Điểm Của Tôi</h1>
        <p>Xin chào, {user?.hoten}</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Môn Học</h3>
          <p className="value">{filteredGrades.length}</p>
        </div>
        <div className="summary-card">
          <h3>GPA Trung Bình</h3>
          <p className="value">{parseFloat(totalGPA).toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Xếp Loại</h3>
          <p className="value">{getClassification(parseFloat(totalGPA))}</p>
        </div>
      </div>

      {/* Semester Filter */}
      {semesters.length > 1 && (
        <div className="semester-filter">
          <label>Chọn học kỳ:</label>
          <select value={selectedSemester || ''} onChange={(e) => setSelectedSemester(Number(e.target.value))}>
            <option value="">Tất cả học kỳ</option>
            {semesters.map(sem => (
              <option key={sem} value={sem}>Học kỳ {sem}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grades Table */}
      <div className="grades-table-container">
        {filteredGrades.length === 0 ? (
          <div className="no-data">Chưa có điểm nào</div>
        ) : (
          <table className="grades-table">
            <thead>
              <tr>
                <th>Mã Môn</th>
                <th>Tên Môn Học</th>
                <th>Giảng Viên</th>
                <th>Chuyên Cần</th>
                <th>Giữa Kỳ</th>
                <th>Cuối Kỳ</th>
                <th>Tổng Kết</th>
                <th>GPA</th>
                <th>Xếp Loại</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade, idx) => {
                const classification = getClassification(grade.gpa);
                const warning = getAcademicWarning(grade.gpa);
                
                return (
                  <tr key={grade.mabangdiem} className={warning ? 'row-warning' : ''}>
                    <td>{idx + 1}</td>
                    <td className="subject-name">{grade.tenmonhoc}</td>
                    <td>{grade.tengiangvien}</td>
                    <td>{formatScore(grade.diemchuyencan)}</td>
                    <td>{formatScore(grade.diemgiuaky)}</td>
                    <td>{formatScore(grade.diemcuoiky)}</td>
                    <td className="total-score">{formatScore(grade.diemtongket)}</td>
                    <td className="gpa-cell"><strong>{formatScore(grade.gpa)}</strong></td>
                    <td>
                      <span className="classification-badge" style={{
                        backgroundColor: getClassificationColor(classification)
                      }}>
                        {classification}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${grade.trangthai}`}>
                        {grade.trangthai === 'dangnhap' ? 'Đang nhập' : 'Đã khóa'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Academic Warning */}
      {filteredGrades.some(g => getAcademicWarning(g.gpa)) && (
        <div className="warning-box">
          <h3>⚠️ Cảnh Báo Học Vụ</h3>
          {filteredGrades.map(grade => {
            const warning = getAcademicWarning(grade.gpa);
            return warning ? (
              <div key={grade.mabangdiem} className={`warning-item warning-${warning.severity}`}>
                <strong>{grade.tenmonhoc}:</strong> {warning.message}
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Score Details */}
      <div className="score-details">
        <h3>📌 Ghi Chú Về Cách Tính Điểm</h3>
        <div className="details-content">
          <p><strong>Điểm Tổng Kết = </strong>Chuyên cần × 10% + Giữa kỳ × 30% + Cuối kỳ × 60%</p>
          <p><strong>GPA = </strong>Điểm Tổng Kết ÷ 10 × 4 (Thang điểm 0-4)</p>
          <div className="classification-legend">
            <h4>Xếp Loại Học Lực:</h4>
            <ul>
              <li><span className="legend-badge" style={{backgroundColor: '#27ae60'}}>Xuất sắc</span>: GPA ≥ 3.6</li>
              <li><span className="legend-badge" style={{backgroundColor: '#3498db'}}>Tốt</span>: GPA 3.2 - 3.5</li>
              <li><span className="legend-badge" style={{backgroundColor: '#f39c12'}}>Khá</span>: GPA 2.8 - 3.1</li>
              <li><span className="legend-badge" style={{backgroundColor: '#e67e22'}}>Trung bình</span>: GPA 2.4 - 2.7</li>
              <li><span className="legend-badge" style={{backgroundColor: '#e74c3c'}}>Yếu</span>: GPA 2.0 - 2.3</li>
              <li><span className="legend-badge" style={{backgroundColor: '#c0392b'}}>Kém</span>: GPA &lt; 2.0</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;

// Helper function
const getClassificationColor = (classification) => {
  const colors = {
    'Xuất sắc': '#27ae60',
    'Tốt': '#3498db',
    'Khá': '#f39c12',
    'Trung bình': '#e67e22',
    'Yếu': '#e74c3c',
    'Kém': '#c0392b',
    'Chưa xếp loại': '#95a5a6'
  };
  return colors[classification] || '#95a5a6';
};
