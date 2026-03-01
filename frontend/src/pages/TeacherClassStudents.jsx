import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';
import './TeacherClassStudents.css';

const TeacherClassStudents = () => {
  const [lopList, setLopList] = useState([]);
  const [selectedLop, setSelectedLop] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    lookupAPI.getLop()
      .then((res) => setLopList(res.data?.data || []))
      .catch(() => setLopList([]));
  }, []);

  useEffect(() => {
    if (!selectedLop) {
      setStudents([]);
      setLoaded(false);
      return;
    }
    setLoading(true);
    setLoaded(false);
    lookupAPI.getStudentsByClass(selectedLop)
      .then((res) => {
        setStudents(res.data?.data || []);
        setLoaded(true);
      })
      .catch(() => {
        setStudents([]);
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [selectedLop]);

  return (
    <div className="page-card teacher-class-students">
      <h1>Quản lý sinh viên trong lớp</h1>
      <div className="filter-row">
        <label>Chọn lớp:</label>
        <select value={selectedLop} onChange={(e) => setSelectedLop(e.target.value)}>
          <option value="">-- Chọn lớp --</option>
          {lopList.map((item) => (
            <option key={item.malop} value={item.malop}>
              {item.tenlop || item.malop}
            </option>
          ))}
        </select>
      </div>
      {loading && <p>Đang tải...</p>}
      {loaded && !loading && (
        <>
          <p className="summary">Tổng: {students.length} sinh viên.</p>
          {students.length === 0 ? (
            <div className="empty-state">Không có sinh viên trong lớp này.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Khoa</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.mssv}>
                      <td>{s.mssv}</td>
                      <td>{s.hoten}</td>
                      <td>{s.malop}</td>
                      <td>{s.makhoa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherClassStudents;
