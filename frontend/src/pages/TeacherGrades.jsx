import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradesAPIEndpoints } from '../api/gradesAPI';
import { classSectionAPIEndpoints } from '../api/classSectionAPI';
import { 
  calculateTotalScore, 
  calculateGPA, 
  getClassification, 
  formatScore,
  validateGradeInput 
} from '../utils/gradeUtils';
import './TeacherGrades.css';

const TeacherGrades = () => {
  const { user } = useAuth();
  const [classSections, setClassSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    malophocphan: '',
    mssv: '',
    diemchuyencan: '',
    diemgiuaky: '',
    diemcuoiky: '',
    ghichu: ''
  });
  const [logData, setLogData] = useState(null);

  useEffect(() => {
    fetchClassSections();
  }, []);

  const fetchClassSections = async () => {
    try {
      setLoading(true);
      const isCtsv = user?.role === 'ctsv';
      const response = isCtsv
        ? await classSectionAPIEndpoints.getAll()
        : await classSectionAPIEndpoints.getByTeacher(user?.magiaovien);
      setClassSections(response.data || []);
      if (response.data?.length > 0) {
        setSelectedClass(response.data[0].malophocphan);
      }
    } catch (err) {
      setError('Lỗi tải danh sách lớp: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchGrades();
    }
  }, [selectedClass]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await gradesAPIEndpoints.getClassGrades(selectedClass);
      setGrades(response.data);
    } catch (err) {
      setError('Lỗi tải bảng điểm: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitGrades = async () => {
    if (!selectedClass) {
      setError('Vui lòng chọn lớp học phần');
      return;
    }

    try {
      await gradesAPIEndpoints.initGrades(selectedClass);
      await fetchGrades();
      alert('Đã tạo bảng điểm cho tất cả sinh viên đã đăng ký');
    } catch (err) {
      setError('Lỗi: ' + err.message);
    }
  };

  const handleSaveGrade = async (grade) => {
    const data = editData[grade.mabangdiem] || {};
    
    const validation = validateGradeInput({
      malophocphan: selectedClass,
      mssv: grade.mssv,
      diemchuyencan: data.diemchuyencan !== undefined ? data.diemchuyencan : grade.diemchuyencan,
      diemgiuaky: data.diemgiuaky !== undefined ? data.diemgiuaky : grade.diemgiuaky,
      diemcuoiky: data.diemcuoiky !== undefined ? data.diemcuoiky : grade.diemcuoiky,
    });

    if (!validation.isValid) {
      setError('Lỗi: ' + JSON.stringify(validation.errors));
      return;
    }

    try {
      await gradesAPIEndpoints.updateGrade(grade.mabangdiem, {
        diemchuyencan: data.diemchuyencan !== undefined ? data.diemchuyencan : grade.diemchuyencan,
        diemgiuaky: data.diemgiuaky !== undefined ? data.diemgiuaky : grade.diemgiuaky,
        diemcuoiky: data.diemcuoiky !== undefined ? data.diemcuoiky : grade.diemcuoiky,
        ghichu: data.ghichu || ''
      });
      setEditingId(null);
      setEditData({});
      await fetchGrades();
      alert('Cập nhật điểm thành công');
    } catch (err) {
      setError('Lỗi cập nhật: ' + err.message);
    }
  };

  const handleLockGrades = async () => {
    if (!selectedClass) return;
    
    if (window.confirm('Bạn có chắc muốn khóa bảng điểm? (Không thể sửa sau khi khóa)')) {
      try {
        await gradesAPIEndpoints.lockGrades(selectedClass, new Date());
        await fetchGrades();
        alert('Đã khóa bảng điểm');
      } catch (err) {
        setError('Lỗi khóa: ' + err.message);
      }
    }
  };

  const handleExport = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await gradesAPIEndpoints.exportGrades(selectedClass);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bangdiem_${selectedClass}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Lỗi xuất: ' + err.message);
    }
  };

  const handleViewLog = async (grade) => {
    try {
      const res = await gradesAPIEndpoints.getGradeLog(grade.mabangdiem);
      setLogData({ grade, logs: res.data || [] });
    } catch (err) {
      setError('Lỗi tải log: ' + err.message);
    }
  };

  const selectedClassInfo = classSections.find(c => c.malophocphan === selectedClass);

  return (
    <div className="teacher-grades-container">
      <div className="grades-header">
        <h1>📊 {user?.role === 'ctsv' ? 'Quản lý điểm (Kiểm tra & khóa)' : 'Quản Lý Điểm Sinh Viên'}</h1>
        <p>{user?.role === 'ctsv' ? 'Phòng CTSV – Kiểm tra và duyệt bảng điểm các lớp học phần' : `Giảng viên: ${user?.hoten}`}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Class Selection */}
      <div className="class-selection">
        <label>Chọn lớp học phần:</label>
        <select value={selectedClass || ''} onChange={(e) => setSelectedClass(Number(e.target.value))}>
          <option value="">-- Chọn lớp --</option>
          {classSections.map(cls => (
            <option key={cls.malophocphan} value={cls.malophocphan}>
              {cls.tenmonhoc} - {cls.lichhoc} {cls.tenphong ? `(${cls.tenphong})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          {/* Class Info & Actions */}
          <div className="class-info">
            <div className="info-details">
              <h3>{selectedClassInfo?.tenmonhoc}</h3>
              <p>
                Học kỳ: {selectedClassInfo?.tenhocky} | Phòng: {selectedClassInfo?.tenphong || 'N/A'} | 
                Lịch học: {selectedClassInfo?.lichhoc}
              </p>
            </div>
            <div className="class-actions">
              <button className="btn-init" onClick={handleInitGrades}>
                ➕ Tạo Bảng Điểm
              </button>
              <button className="btn-export" onClick={handleExport}>
                📥 Xuất Excel
              </button>
              <button className="btn-lock" onClick={handleLockGrades}>
                🔒 Khóa Điểm
              </button>
            </div>
          </div>

          {/* Grades Table */}
          <div className="grades-table-container">
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : grades.length === 0 ? (
              <div className="no-data">Chưa có sinh viên trong lớp này</div>
            ) : (
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>MSSV</th>
                    <th>Họ Tên</th>
                    <th>Chuyên Cần</th>
                    <th>Giữa Kỳ</th>
                    <th>Cuối Kỳ</th>
                    <th>Tổng Kết</th>
                    <th>GPA</th>
                    <th>Xếp Loại</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade, idx) => {
                    const editInfo = editData[grade.mabangdiem] || {};
                    const cc = editInfo.diemchuyencan !== undefined ? editInfo.diemchuyencan : grade.diemchuyencan;
                    const gk = editInfo.diemgiuaky !== undefined ? editInfo.diemgiuaky : grade.diemgiuaky;
                    const ck = editInfo.diemcuoiky !== undefined ? editInfo.diemcuoiky : grade.diemcuoiky;
                    const totalScore = calculateTotalScore(cc || 0, gk || 0, ck || 0);
                    const gpa = calculateGPA(totalScore);
                    const classification = getClassification(gpa);
                    const isEditing = editingId === grade.mabangdiem;

                    return (
                      <tr key={grade.mabangdiem}>
                        <td>{idx + 1}</td>
                        <td>{grade.mssv}</td>
                        <td>{grade.hoten}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={editInfo.diemchuyencan !== undefined ? editInfo.diemchuyencan : (grade.diemchuyencan || '')}
                              onChange={(e) => setEditData({
                                ...editData,
                                [grade.mabangdiem]: { ...editInfo, diemchuyencan: e.target.value ? parseFloat(e.target.value) : '' }
                              })}
                              className="grade-input"
                            />
                          ) : (
                            formatScore(grade.diemchuyencan)
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={editInfo.diemgiuaky !== undefined ? editInfo.diemgiuaky : (grade.diemgiuaky || '')}
                              onChange={(e) => setEditData({
                                ...editData,
                                [grade.mabangdiem]: { ...editInfo, diemgiuaky: e.target.value ? parseFloat(e.target.value) : '' }
                              })}
                              className="grade-input"
                            />
                          ) : (
                            formatScore(grade.diemgiuaky)
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={editInfo.diemcuoiky !== undefined ? editInfo.diemcuoiky : (grade.diemcuoiky || '')}
                              onChange={(e) => setEditData({
                                ...editData,
                                [grade.mabangdiem]: { ...editInfo, diemcuoiky: e.target.value ? parseFloat(e.target.value) : '' }
                              })}
                              className="grade-input"
                            />
                          ) : (
                            formatScore(grade.diemcuoiky)
                          )}
                        </td>
                        <td className="total-score">{formatScore(totalScore)}</td>
                        <td className="gpa-cell"><strong>{formatScore(gpa)}</strong></td>
                        <td>
                          <span className="classification-badge" style={{
                            backgroundColor: getClassificationColor(classification)
                          }}>
                            {classification}
                          </span>
                        </td>
                        <td className="action-buttons">
                          {isEditing ? (
                            <>
                              <button className="btn-save" onClick={() => handleSaveGrade(grade)}>✓</button>
                              <button className="btn-cancel" onClick={() => { setEditingId(null); setEditData({}); }}>✕</button>
                            </>
                          ) : (
                            <>
                              <button className="btn-edit" onClick={() => setEditingId(grade.mabangdiem)}>✏️</button>
                              <button className="btn-log" onClick={() => handleViewLog(grade)}>📋</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {logData && (
            <div className="grade-log-panel">
              <h3>Nhật ký sửa điểm - {logData.grade.mssv} / {logData.grade.hoten}</h3>
              {logData.logs.length === 0 ? (
                <p>Chưa có lịch sử sửa điểm.</p>
              ) : (
                <ul>
                  {logData.logs.map((log) => (
                    <li key={log.id}>
                      <strong>{log.loaidiem}</strong>: {log.giatricu} → {log.giatrimoi} bởi {log.nguoisua} lúc {new Date(log.ngaysua).toLocaleString('vi-VN')} ({log.lydo})
                    </li>
                  ))}
                </ul>
              )}
              <button className="btn-close-log" onClick={() => setLogData(null)}>Đóng</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

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

export default TeacherGrades;
