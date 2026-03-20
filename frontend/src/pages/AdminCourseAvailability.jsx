import React, { useState, useEffect } from 'react';
import { adminAPIEndpoints } from '../api/adminAPI';
import { classSectionAPIEndpoints } from '../api/classSectionAPI';
import { lookupAPIEndpoints } from '../api/lookupAPI';
import './AdminCourseAvailability.css';

const AdminCourseAvailability = () => {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // new section form
  const [coursesList, setCoursesList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [hocKyList, setHocKyList] = useState([]);
  const [newSection, setNewSection] = useState({
    mamonhoc: '',
    mahocky: '',
    lichhoc: '',
    soluongtoida: 60,
    magiaovien: '',
    maphong: ''
  });
  const [editingSection, setEditingSection] = useState(null);
  const [editForm, setEditForm] = useState({
    malophocphan: '',
    lichhoc: '',
    soluongtoida: 60,
    magiaovien: '',
    maphong: '',
    trangthai: 'dangmo',
    ngaymodangky: '',
    ngaykhoadangky: ''
  });
  const [currentOpenSemester, setCurrentOpenSemester] = useState(null);
  const [savingOpenSemester, setSavingOpenSemester] = useState(false);

  useEffect(() => {
    fetchData();
    // also load lists for form
    fetchCoursesList();
    fetchTeachersList();
    fetchRoomsList();
    fetchHocKyList();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchCoursesForSemester(selectedSemester);
    }
  }, [selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // fetch all class sections to build semester list
      const response = await classSectionAPIEndpoints.getAll();
      const allSections = response?.data || [];
      
      // extract unique semesters
      const uniqueSemesters = [...new Set(allSections.map(s => s.mahocky || 1))].sort((a, b) => b - a);
      setSemesters(uniqueSemesters);
      
      if (uniqueSemesters.length > 0) {
        setSelectedSemester(uniqueSemesters[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesList = async () => {
    try {
      const resp = await adminAPIEndpoints.getCourses();
      setCoursesList(resp?.data || []);
    } catch (err) {
      console.error('Error loading course list:', err);
    }
  };

  const fetchTeachersList = async () => {
    try {
      const resp = await lookupAPIEndpoints.getGiangVienList();
      setTeachersList(resp?.data || []);
    } catch (err) {
      console.error('Error loading teachers list:', err);
    }
  };

  const fetchRoomsList = async () => {
    try {
      const resp = await lookupAPIEndpoints.getPhongHocList();
      setRoomsList(resp?.data || []);
    } catch (err) {
      console.error('Error loading rooms list:', err);
    }
  };

  const fetchHocKyList = async () => {
    try {
      const resp = await lookupAPIEndpoints.getHocKyList();
      setHocKyList(resp?.data || []);
    } catch (err) {
      console.error('Error loading hoc ky list:', err);
    }
  };

  useEffect(() => {
    adminAPIEndpoints.getCurrentRegistrationSemester().then((r) => {
      const v = r?.data?.mahocky;
      setCurrentOpenSemester(v != null ? v : '');
    }).catch(() => setCurrentOpenSemester(''));
  }, []);

  const saveOpenSemester = async () => {
    try {
      setSavingOpenSemester(true);
      const mahocky = currentOpenSemester === '' || currentOpenSemester == null ? null : Number(currentOpenSemester);
      await adminAPIEndpoints.setCurrentRegistrationSemester(mahocky);
      alert(mahocky != null ? `Đã mở đăng ký học kỳ ${mahocky} cho sinh viên.` : 'Đã bỏ đặt học kỳ mở đăng ký.');
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Không lưu được'));
    } finally {
      setSavingOpenSemester(false);
    }
  };

  const fetchCoursesForSemester = async (mahocky) => {
    try {
      // fetch class sections filtered by semester
      const response = await classSectionAPIEndpoints.getAll({ mahocky });
      const sections = response?.data || [];
      setCourses(sections);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Lỗi tải khóa học: ' + err.message);
    }
  };

  const handleToggleStatus = async (malophocphan, currentStatus) => {
    try {
      setUpdating(malophocphan);
      
      // Determine new status
      const newStatus = currentStatus === 'dangmo' ? 'dong' : 'dangmo';
      
      // Update via API
      await classSectionAPIEndpoints.update(malophocphan, { trangthai: newStatus });
      
      // Update local state
      setCourses(courses.map(c => 
        c.malophocphan === malophocphan ? { ...c, trangthai: newStatus } : c
      ));
      
      alert(`Cập nhật trạng thái thành công! Trạng thái mới: ${newStatus === 'dangmo' ? 'Đang mở' : 'Đã đóng'}`);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'dangmo': 'Đang Mở',
      'dong': 'Đã Đóng',
      'huy': 'Đã Hủy'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'dangmo': '#4caf50',
      'dong': '#f44336',
      'huy': '#999'
    };
    return colors[status] || '#999';
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.tenmonhoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.malophocphan?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') {
      return matchesSearch;
    }
    return matchesSearch && course.trangthai === filterStatus;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const createNewSection = async () => {
    if (!newSection.mamonhoc || !newSection.mahocky) {
      alert('Vui lòng chọn môn và nhập học kỳ.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        mamonhoc: newSection.mamonhoc,
        mahocky: parseInt(newSection.mahocky),
        lichhoc: newSection.lichhoc || '',
        soluongtoida: newSection.soluongtoida || 60,
        trangthai: 'dangmo',
        magiaovien: newSection.magiaovien || null,
        maphong: newSection.maphong || null
      };
      await classSectionAPIEndpoints.create(payload);
      alert('Thêm lớp học phần thành công');
      // refresh lists
      await fetchData();
      if (selectedSemester === payload.mahocky) {
        await fetchCoursesForSemester(selectedSemester);
      }
      setNewSection({ mamonhoc: '', mahocky: '', lichhoc: '', soluongtoida: 60, magiaovien: '', maphong: '' });
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toDatetimeLocal = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  const startEditSection = (course) => {
    setEditingSection(course.malophocphan);
    setEditForm({
      malophocphan: course.malophocphan,
      lichhoc: course.lichhoc || '',
      soluongtoida: course.soluongtoida || 60,
      magiaovien: course.magiaovien || '',
      maphong: course.maphong || '',
      trangthai: course.trangthai || 'dangmo',
      ngaymodangky: toDatetimeLocal(course.ngaymodangky),
      ngaykhoadangky: toDatetimeLocal(course.ngaykhoadangky)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEditSection = async () => {
    if (!editingSection) return;
    try {
      setUpdating(editingSection);
      const payload = {
        lichhoc: editForm.lichhoc || '',
        soluongtoida: editForm.soluongtoida || 60,
        magiaovien: editForm.magiaovien || null,
        maphong: editForm.maphong || null,
        trangthai: editForm.trangthai || 'dangmo',
        ngaymodangky: (() => {
          if (!editForm.ngaymodangky) return null;
          const d = new Date(editForm.ngaymodangky);
          if (isNaN(d.getTime())) return null;
          const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0'), min = String(d.getMinutes()).padStart(2, '0');
          return `${y}-${m}-${day} ${h}:${min}:00`;
        })(),
        ngaykhoadangky: (() => {
          if (!editForm.ngaykhoadangky) return null;
          const d = new Date(editForm.ngaykhoadangky);
          if (isNaN(d.getTime())) return null;
          const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0'), min = String(d.getMinutes()).padStart(2, '0');
          return `${y}-${m}-${day} ${h}:${min}:00`;
        })()
      };
      await classSectionAPIEndpoints.update(editingSection, payload);
      alert('Cập nhật lớp học phần thành công');
      await fetchCoursesForSemester(selectedSemester);
      setEditingSection(null);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteSection = async (malophocphan) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa lớp học phần này?')) return;
    try {
      setUpdating(malophocphan);
      await classSectionAPIEndpoints.delete(malophocphan);
      setCourses(courses.filter(c => c.malophocphan !== malophocphan));
      if (editingSection === malophocphan) {
        setEditingSection(null);
      }
      alert('Xóa lớp học phần thành công');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="admin-course-availability"><div className="loading">Đang tải...</div></div>;
  }

  return (
    <div className="admin-course-availability">
      <h2>⚙️ Quản Lý Mở/Đóng Đăng Ký Môn Học</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="open-semester-box" style={{ marginBottom: 20, padding: 16, background: '#f0f7ff', borderRadius: 8, border: '1px solid #b3d9ff' }}>
        <h3 style={{ marginTop: 0 }}>📅 Học kỳ đang mở đăng ký (sinh viên chỉ được đăng ký 1 học kỳ)</h3>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ minWidth: 120 }}>Chọn học kỳ mở đăng ký:</label>
          <select
            value={currentOpenSemester ?? ''}
            onChange={e => setCurrentOpenSemester(e.target.value === '' ? '' : e.target.value)}
            style={{ padding: 8, minWidth: 200 }}
          >
            <option value="">-- Không mở học kỳ nào --</option>
            {hocKyList.map(hk => (
              <option key={hk.mahocky} value={hk.mahocky}>{hk.tenhocky} {hk.namhoc ? `(${hk.namhoc})` : ''}</option>
            ))}
          </select>
          <button type="button" className="btn-save" onClick={saveOpenSemester} disabled={savingOpenSemester}>
            {savingOpenSemester ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555' }}>
          Sinh viên chỉ thấy và đăng ký môn trong học kỳ được chọn. Đặt thời hạn đăng ký từng lớp ở form sửa bên dưới (vd: 3 ngày).
        </p>
      </div>

      <div className="forms-row">
        {/* New section form */}
        <div className="new-section-form">
          <h3>➕ Thêm Lớp Học Phần</h3>
          <div className="form-row">
            <label>Môn học:</label>
            <select
              value={newSection.mamonhoc}
              onChange={e => setNewSection({ ...newSection, mamonhoc: e.target.value })}
            >
              <option value="">-- Chọn môn --</option>
              {coursesList.map(c => (
                <option key={c.mamonhoc} value={c.mamonhoc}>{c.tenmonhoc}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Học kỳ:</label>
            <select
              value={newSection.mahocky}
              onChange={e => setNewSection({ ...newSection, mahocky: e.target.value })}
            >
              <option value="">-- Chọn học kỳ --</option>
              {hocKyList.map(hk => (
                <option key={hk.mahocky} value={hk.mahocky}>
                  {hk.tenhocky} ({hk.namhoc})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Thời gian (lịch học):</label>
            <input
              type="text"
              value={newSection.lichhoc}
              onChange={e => setNewSection({ ...newSection, lichhoc: e.target.value })}
              placeholder="VD: Thứ 2-4-6 7h-9h"
            />
          </div>
          <div className="form-row">
            <label>Phòng học:</label>
            <select
              value={newSection.maphong}
              onChange={e => setNewSection({ ...newSection, maphong: e.target.value })}
            >
              <option value="">-- Chọn phòng --</option>
              {roomsList.map(r => (
                <option key={r.maphong} value={r.maphong}>
                  {r.tenphong} ({r.toanha})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Giảng viên:</label>
            <select
              value={newSection.magiaovien}
              onChange={e => setNewSection({ ...newSection, magiaovien: e.target.value })}
            >
              <option value="">-- Chọn giảng viên --</option>
              {teachersList.map(t => (
                <option key={t.magiaovien} value={t.magiaovien}>
                  {t.hoten}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Số lượng tối đa:</label>
            <input
              type="number"
              value={newSection.soluongtoida}
              onChange={e => setNewSection({ ...newSection, soluongtoida: e.target.value })}
              min={1}
            />
          </div>
          <button className="btn-create" onClick={createNewSection} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo lớp'}
          </button>
        </div>

        {editingSection && (
          <div className="edit-section-form">
            <h3>✏️ Sửa Lớp Học Phần {editForm.malophocphan}</h3>
            <div className="form-row">
              <label>Thời gian (lịch học):</label>
              <input
                type="text"
                value={editForm.lichhoc}
                onChange={e => setEditForm({ ...editForm, lichhoc: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Phòng học:</label>
              <select
                value={editForm.maphong}
                onChange={e => setEditForm({ ...editForm, maphong: e.target.value })}
              >
                <option value="">-- Chọn phòng --</option>
                {roomsList.map(r => (
                  <option key={r.maphong} value={r.maphong}>
                    {r.tenphong} ({r.toanha})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Số lượng tối đa:</label>
              <input
                type="number"
                value={editForm.soluongtoida}
                onChange={e => setEditForm({ ...editForm, soluongtoida: e.target.value })}
                min={1}
              />
            </div>
            <div className="form-row">
              <label>Giảng viên:</label>
              <select
                value={editForm.magiaovien}
                onChange={e => setEditForm({ ...editForm, magiaovien: e.target.value })}
              >
                <option value="">-- Chọn giảng viên --</option>
                {teachersList.map(t => (
                  <option key={t.magiaovien} value={t.magiaovien}>
                    {t.hoten}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Trạng thái:</label>
              <select
                value={editForm.trangthai}
                onChange={e => setEditForm({ ...editForm, trangthai: e.target.value })}
              >
                <option value="dangmo">Đang Mở</option>
                <option value="dong">Đã Đóng</option>
                <option value="huy">Đã Hủy</option>
              </select>
            </div>
            <div className="form-row">
              <label>Thời gian mở đăng ký:</label>
              <input
                type="datetime-local"
                value={editForm.ngaymodangky}
                onChange={e => setEditForm({ ...editForm, ngaymodangky: e.target.value })}
              />
              <small style={{ display: 'block', color: '#666' }}>Để trống = mở ngay</small>
            </div>
            <div className="form-row">
              <label>Hết hạn đăng ký:</label>
              <input
                type="datetime-local"
                value={editForm.ngaykhoadangky}
                onChange={e => setEditForm({ ...editForm, ngaykhoadangky: e.target.value })}
              />
              <small style={{ display: 'block', color: '#666' }}>VD: 3 ngày sau khi mở. Để trống = không giới hạn</small>
            </div>
            <div className="edit-actions">
              <button
                className="btn-save"
                onClick={saveEditSection}
                disabled={updating === editingSection}
              >
                {updating === editingSection ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                className="btn-cancel-edit"
                onClick={() => setEditingSection(null)}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="control-group">
          <label>Chọn học kỳ:</label>
          <select 
            value={selectedSemester || ''} 
            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          >
            {semesters.map(sem => {
              const info = hocKyList.find(h => h.mahocky === sem);
              const label = info ? `${info.tenhocky} (${info.namhoc})` : `Học kỳ ${sem}`;
              return (
                <option key={sem} value={sem}>{label}</option>
              );
            })}
          </select>
        </div>

        <div className="control-group">
          <label>Lọc theo trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="dangmo">Đang Mở</option>
            <option value="dong">Đã Đóng</option>
            <option value="huy">Đã Hủy</option>
          </select>
        </div>

        <div className="control-group search">
          <label>Tìm kiếm:</label>
          <input 
            type="text" 
            placeholder="Tên môn học hoặc mã lớp..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="courses-table-container">
        {filteredCourses.length > 0 ? (
          <table className="courses-table">
            <thead>
              <tr>
                <th>Mã Lớp</th>
                <th>Tên Môn Học</th>
                <th>Số Tín Chỉ</th>
                <th>Học Phí</th>
                <th>Thời Gian</th>
                <th>Phòng</th>
                <th>Giảng Viên</th>
                <th>Sĩ Số</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course.malophocphan}>
                  <td><strong>{course.malophocphan}</strong></td>
                  <td>{course.tenmonhoc}</td>
                  <td className="center">{course.sotinchi}</td>
                  <td className="right">{formatCurrency(course.hocphi)}</td>
                  <td>{course.lichhoc || '-'}</td>
                  <td>{course.tenphong || '-'}</td>
                  <td>{course.tengiangvien || '-'}</td>
                  <td className="center">{course.soluongdadangky || 0}/{course.soluongtoida || 0}</td>
                  <td className="center">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(course.trangthai) }}
                    >
                      {getStatusLabel(course.trangthai)}
                    </span>
                  </td>
                  <td className="center">
                    <div className="actions-column">
                      {course.trangthai !== 'huy' && (
                        <button
                          className={`btn-toggle ${course.trangthai === 'dangmo' ? 'btn-close' : 'btn-open'}`}
                          onClick={() => handleToggleStatus(course.malophocphan, course.trangthai)}
                          disabled={updating === course.malophocphan}
                        >
                          {updating === course.malophocphan ? (
                            '⏳ Đang xử lý...'
                          ) : course.trangthai === 'dangmo' ? (
                            '🔒 Đóng Đk'
                          ) : (
                            '🔓 Mở Đk'
                          )}
                        </button>
                      )}
                      <button
                        className="btn-small btn-edit"
                        onClick={() => startEditSection(course)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-small btn-delete"
                        onClick={() => handleDeleteSection(course.malophocphan)}
                        disabled={updating === course.malophocphan}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">Không có môn học nào phù hợp</div>
        )}
      </div>

      {/* Legend */}
      <div className="legend-section">
        <h4>📌 Chú Thích Trạng Thái:</h4>
        <ul>
          <li><span className="legend-badge" style={{ backgroundColor: '#4caf50' }}>Đang Mở</span> - Sinh viên có thể đăng ký</li>
          <li><span className="legend-badge" style={{ backgroundColor: '#f44336' }}>Đã Đóng</span> - Sinh viên không thể đăng ký</li>
          <li><span className="legend-badge" style={{ backgroundColor: '#999' }}>Đã Hủy</span> - Lớp đã bị hủy</li>
        </ul>
      </div>

      {/* Summary Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <h4>Tổng Số Lớp</h4>
          <p className="stat-number">{filteredCourses.length}</p>
        </div>
        <div className="stat-card">
          <h4>Đang Mở Đk</h4>
          <p className="stat-number" style={{ color: '#4caf50' }}>
            {filteredCourses.filter(c => c.trangthai === 'dangmo').length}
          </p>
        </div>
        <div className="stat-card">
          <h4>Đã Đóng Đk</h4>
          <p className="stat-number" style={{ color: '#f44336' }}>
            {filteredCourses.filter(c => c.trangthai === 'dong').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseAvailability;
