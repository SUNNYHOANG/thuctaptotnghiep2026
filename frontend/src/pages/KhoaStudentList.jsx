import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DrlNavigationButton from '../components/DrlNavigationButton';

const API_BASE = 'http://localhost:5000/api';

const KhoaStudentList = () => {
  const { user, token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users/students/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-role': user?.role || '',
          'x-user-makhoa': user?.makhoa || '',
        },
      });
      const data = await res.json();
      setStudents(data.data || []);
    } catch (err) {
      setError('Không tải được danh sách sinh viên: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewProfile = async (mssv) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/students/profile/${mssv}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-role': user?.role || '',
          'x-user-makhoa': user?.makhoa || '',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Không thể xem hồ sơ sinh viên này.');
        return;
      }
      const data = await res.json();
      setSelected(data);
      setError('');
    } catch (err) {
      setError('Lỗi: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.id || '').toLowerCase().includes(q) ||
      (s.hoten || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🎓 Danh Sách Sinh Viên Khoa {user?.makhoa}</h1>
          <div className="d-flex gap-2 align-center" style={{ marginTop: 12 }}>
            <input
              type="text"
              className="form-control"
              style={{ width: 280 }}
              placeholder="Tìm kiếm theo MSSV hoặc họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ color: 'red' }}>{error}</div>}

        <div className="grid grid-2 mt-2">
          <div>
            {loading ? (
              <div className="spinner" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Tình trạng</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sv) => (
                    <tr
                      key={sv.id}
                      style={{ cursor: 'pointer', background: selected?.mssv === sv.id ? '#eff6ff' : undefined }}
                      onClick={() => viewProfile(sv.id)}
                    >
                      <td>{sv.id}</td>
                      <td>{sv.hoten || '-'}</td>
                      <td>{sv.malop || '-'}</td>
                      <td>{sv.tinhtrang || '-'}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <DrlNavigationButton mssv={sv.id} role="khoa" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>
                        {search ? 'Không tìm thấy sinh viên phù hợp.' : 'Chưa có sinh viên trong khoa.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div>
            {profileLoading ? (
              <div className="card" style={{ padding: 16 }}><div className="spinner" /></div>
            ) : selected ? (
              <div className="card" style={{ padding: 16 }}>
                <h2 style={{ marginBottom: 12 }}>Hồ sơ sinh viên</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['MSSV', selected.mssv],
                      ['Họ tên', selected.hoten],
                      ['Lớp', selected.malop],
                      ['Khoa', selected.makhoa],
                      ['Ngành', selected.nganh],
                      ['Bậc đào tạo', selected.bacdaotao],
                      ['Khóa học', selected.khoahoc],
                      ['Giới tính', selected.gioitinh],
                      ['Ngày sinh', selected.ngaysinh],
                      ['Quê quán', selected.quequan],
                      ['Địa chỉ', selected.diachi],
                      ['Tình trạng', selected.tinhtrang],
                    ].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#555', width: '40%' }}>{label}</td>
                        <td style={{ padding: '6px 8px' }}>{value || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ padding: 16 }}>
                <p>Chọn một sinh viên bên trái để xem hồ sơ chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhoaStudentList;
