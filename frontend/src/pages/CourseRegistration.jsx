import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPIEndpoints } from '../api/adminAPI';
import { enrollmentAPIEndpoints } from '../api/enrollmentAPI';
import { classSectionAPIEndpoints } from '../api/classSectionAPI';
import './CourseRegistration.css';

const CourseRegistration = () => {
  const { user } = useAuth();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(null);
  const [canceling, setCanceling] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchCourses(selectedSemester);
    }
  }, [selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch registered courses for this student
      const regResp = await enrollmentAPIEndpoints.getByStudent(user?.mssv);
      const regList = regResp?.data || [];
      setRegisteredCourses(regList);
      
      // Also load all class sections so we know which semesters exist even if
      // the student hasn't registered anything yet.
      const allResp = await classSectionAPIEndpoints.getAll();
      const allSections = allResp?.data || [];

      const sems = [...new Set([
        ...regList.map(c => c.mahocky),
        ...allSections.map(s => s.mahocky)
      ])].filter(x => x !== undefined && x !== null);
      sems.sort((a, b) => b - a);
      setSemesters(sems);

      if (sems.length > 0) {
        setSelectedSemester(sems[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (mahocky) => {
    try {
      const response = await adminAPIEndpoints.getAvailableCoursesForRegistration(mahocky);
      setAvailableCourses(response?.data || []);
    } catch (err) {
      console.error('Error fetching available courses:', err);
      setError('Lỗi tải danh sách môn học: ' + err.message);
    }
  };

  const handleRegister = async (malophocphan) => {
    try {
      if (!user?.mssv) {
        alert('Lỗi: Không tìm thấy mã số sinh viên. Vui lòng đăng nhập lại.');
        return;
      }
      
      setRegistering(malophocphan);
      await enrollmentAPIEndpoints.register({
        malophocphan: malophocphan,
        mssv: user.mssv
      });
      alert('Đăng ký môn học thành công!');
      
      // Refresh data
      await fetchData();
      if (selectedSemester) {
        await fetchCourses(selectedSemester);
      }
    } catch (err) {
      console.error('Register error:', err);
      const msg = err.response?.data?.error || err.message;
      alert('Lỗi: ' + msg);
    } finally {
      setRegistering(null);
    }
  };

  const handleCancel = async (madangky) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy đăng ký môn này?')) return;
    
    try {
      setCanceling(madangky);
      await enrollmentAPIEndpoints.cancel(madangky);
      alert('Hủy đăng ký thành công!');
      
      // Refresh data
      await fetchData();
      if (selectedSemester) {
        await fetchCourses(selectedSemester);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setCanceling(null);
    }
  };

  const isAlreadyRegistered = (malophocphan) => {
    return registeredCourses.some(rc => rc.malophocphan === malophocphan);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const getSpacePercentage = (registered, total) => {
    return total > 0 ? Math.round((registered / total) * 100) : 0;
  };

  const registeredInSelectedSemester = registeredCourses.filter(
    (c) => c.mahocky === selectedSemester
  );

  const totalCredits = registeredInSelectedSemester.reduce(
    (sum, c) => sum + (c.sotinchi || 0),
    0
  );

  const totalFee = registeredInSelectedSemester.reduce(
    (sum, c) => sum + (Number(c.hocphi) || 0),
    0
  );

  const visibleAvailableCourses = availableCourses.filter(
    (course) => !isAlreadyRegistered(course.malophocphan)
  );

  if (loading) {
    return <div className="course-registration-container"><div className="loading">Đang tải...</div></div>;
  }

  return (
    <div className="course-registration-container">
      <h2>📚 Đăng Ký Môn Học</h2>
      
      {error && <div className="error-message">{error}</div>}

      {semesters.length === 0 && (
        <div className="no-data">
          Hiện chưa có học kỳ nào để đăng ký môn. Vui lòng liên hệ quản trị viên.
        </div>
      )}

      {/* Semester Filter */}
      {semesters.length > 0 && (
        <div className="semester-filter">
          <label>Chọn học kỳ:</label>
          <select 
            value={selectedSemester || ''} 
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          >
            {semesters.map(sem => (
              <option key={sem} value={sem}>Học kỳ {sem}</option>
            ))}
          </select>
        </div>
      )}

      {/* Registered Courses Section */}
      <div className="registered-courses-section">
        <h3>✅ Các Môn Học Đã Đăng Ký (Kỳ {selectedSemester})</h3>
        {registeredInSelectedSemester.length > 0 && (
          <div className="fee-summary">
            <div>
              <strong>{registeredInSelectedSemester.length}</strong> môn học, tổng{' '}
              <strong>{totalCredits}</strong> tín chỉ
            </div>
            <div>
              Tổng học phí dự kiến:{' '}
              <strong className="fee-total">{formatCurrency(totalFee)}</strong>
            </div>
          </div>
        )}
        {registeredInSelectedSemester.length > 0 ? (
          <div className="courses-list registered">
            {registeredInSelectedSemester.map(course => (
              <div key={course.madangky} className="course-card registered">
                <div className="course-header">
                  <h4>{course.tenmonhoc}</h4>
                  <div className="course-info">
                    <span className="info-badge tinckredits">{course.sotinchi} tín</span>
                    <span className="info-badge fee">{formatCurrency(course.hocphi)}</span>
                  </div>
                </div>
                <div className="course-details">
                  <p><strong>Giảng viên:</strong> {course.magiaovien || '-'}</p>
                  <p><strong>Lịch học:</strong> {course.lichhoc || '-'}</p>
                  <p><strong>Phòng:</strong> {course.maphong || '-'}</p>
                </div>
                <button 
                  className="btn-cancel"
                  onClick={() => handleCancel(course.madangky)}
                  disabled={canceling === course.madangky}
                >
                  {canceling === course.madangky ? 'Đang xử lý...' : 'Hủy Đăng Ký'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">Chưa đăng ký môn nào trong kỳ này</div>
        )}
      </div>

      {/* Available Courses Section */}
      <div className="available-courses-section">
        <h3>📖 Các Môn Học Có Sẵn Để Đăng Ký (Kỳ {selectedSemester})</h3>
        {visibleAvailableCourses.length > 0 ? (
          <div className="courses-list available">
            {visibleAvailableCourses.map(course => {
              const spacePercentage = getSpacePercentage(course.soluongdadangky, course.soluongtoida);
              const isFull = course.soluongdadangky >= course.soluongtoida;
              
              return (
                <div 
                  key={course.malophocphan} 
                  className={`course-card ${isFull ? 'full' : ''}`}
                >
                  <div className="course-header">
                    <h4>{course.tenmonhoc}</h4>
                    <div className="course-info">
                      <span className="info-badge tincredits">{course.sotinchi} tín</span>
                      <span className="info-badge fee">{formatCurrency(course.hocphi)}</span>
                    </div>
                  </div>
                  
                  <div className="course-details">
                    <p><strong>Giảng viên:</strong> {course.tengiangvien || '-'}</p>
                    <p><strong>Lịch học:</strong> {course.lichhoc || '-'}</p>
                    <p><strong>Phòng:</strong> {course.tenphong || '-'}</p>
                  </div>

                  <div className="course-footer">
                    <div className="capacity">
                      <div className="capacity-bar">
                        <div 
                          className="capacity-used" 
                          style={{ width: `${spacePercentage}%` }}
                        ></div>
                      </div>
                      <small>{course.soluongdadangky}/{course.soluongtoida} sinh viên</small>
                    </div>

                    {isFull ? (
                      <div className="btn-full">⊘ Lớp Đầy</div>
                    ) : (
                      <button
                        className="btn-register"
                        onClick={() => handleRegister(course.malophocphan)}
                        disabled={registering === course.malophocphan}
                      >
                        {registering === course.malophocphan ? 'Đang đăng ký...' : 'Đăng Ký'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-data">Không có môn học nào để đăng ký</div>
        )}
      </div>
    </div>
  );
};

export default CourseRegistration;
