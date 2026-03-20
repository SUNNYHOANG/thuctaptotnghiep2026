import React, { useState, useEffect } from 'react';
import { lookupAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './TeacherClassStudents.css';

const TeacherClassStudents = () => {
  const { user } = useAuth();
  const isGV = user?.role === 'giangvien';
  const makhoa = user?.makhoa || null;

  const [lopList, setLopList] = useState([]);
  const [selectedLop, setSelectedLop] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // GV chỉ load lớp thuộc khoa mình
    const fetchLop = isGV && makhoa
      ? lookupAPI.getLopByKhoa(makhoa)
      : lookupAPI.getLop();

    fetchLop
      .then((res) => setLopList(res.data?.data || res.data || []))
      .catch(() => setLopList([]));
  }, [isGV, makhoa]);

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
        let data = res.data?.data || [];
        // Double-check: GV chỉ thấy SV khoa mình (phòng thủ phía client)
        if (isGV && makhoa) {
          data = data.filter((s) => s.makhoa === makhoa);
        }
        setStudents(data);
        setLoaded(true);
      })
      .catch(() => {
        setStudents([]);
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [selectedLop, isGV, makhoa]);

  return (
    <div className="page-card teacher-class-students">
      <h1>Quản lý sinh viên trong lớp</h1>

      {isGV && makhoa && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#eff6ff', borderRadius: 6, color: '#2563eb', fontSize: 14 }}>
          🏛️ Khoa: <strong>{makhoa}</strong> — chỉ hiển thị lớp và sinh viên thuộc khoa này
        </div>
      )}

      <div className="filter-row">
        <label>Chọn lớp:</label>
        <select value={selectedLop} onChange={(e) => setSelectedLop(e.target.value)}>
          <option value="">-- Chọn lớp --</option>
          {(Array.isArray(lopList) ? lopList : []).map((item) => {
            const val = typeof item === 'object' ? item.malop : item;
            const label = typeof item === 'object' ? (item.tenlop || item.malop) : item;
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
      </div>

      {loading && <p>Đang tải...</p>}
      {loaded && !loading && (
        <>
          <p className="summary">Tổng: <strong>{students.length}</strong> sinh viên{selectedLop ? ` — Lớp ${selectedLop}` : ''}.</p>
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
