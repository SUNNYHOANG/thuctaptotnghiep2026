import React, { useState } from 'react';
import { nrlAPI } from '../api/api';
import './Scores.css';

const NrlTracker = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Vui lòng nhập MSSV hoặc Họ tên');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await nrlAPI.search(query.trim());
      setResults(res.data?.results || []);
    } catch (err) {
      console.error('Error searching NRL:', err);
      setError(err.response?.data?.message || 'Không thể tra cứu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Tra Cứu Ngày Rèn Luyện</h1>
        <p className="text-muted">
          Nhập MSSV (ví dụ: 22130001) hoặc Họ tên (ví dụ: Nguyễn Văn A) để tra cứu lịch sử tham gia hoạt động và tổng số ngày rèn luyện.
        </p>
      </div>

      <div className="card">
        <form className="score-actions" onSubmit={handleSearch}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Từ khóa tìm kiếm:</label>
            <input
              type="text"
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập MSSV hoặc Họ tên"
            />
          </div>
          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button type="submit" className="btn btn-primary">
              🔍 Tìm kiếm
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="scores-summary" style={{ marginTop: '1.5rem' }}>
            {results.length === 0 && !error && (
              <p className="text-center text-muted">
                Nhập MSSV hoặc Họ tên ở trên để bắt đầu tra cứu.
              </p>
            )}

            {results.map((item) => (
              <div key={item.mssv} className="score-card">
                <div className="score-header">
                  <h3>{item.info?.name || 'Không rõ tên'}</h3>
                  <div className="score-total">
                    MSSV: {item.mssv}
                  </div>
                </div>
                <div className="score-details">
                  <div className="score-item">
                    <span className="score-label">Lớp:</span>
                    <span className="score-value">
                      {item.info?.student_class || 'Chưa có thông tin'}
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Tổng số NRL:</span>
                    <span className="score-value">
                      {item.stats?.total_score ?? 0}
                    </span>
                  </div>
                  <div className="score-item">
                    <span className="score-label">Số hoạt động:</span>
                    <span className="score-value">
                      {item.stats?.activity_count ?? 0}
                    </span>
                  </div>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Chương trình</th>
                        <th>Điểm / NRL</th>
                        <th>Link gốc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.history && item.history.length > 0 ? (
                        item.history.map((h, idx) => (
                          <tr key={idx}>
                            <td>{h.stt}</td>
                            <td>{h.activity_name}</td>
                            <td>{h.score}</td>
                            <td>
                              {h.activity_link ? (
                                <a
                                  href={h.activity_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Mở file
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            Chưa có dữ liệu hoạt động.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NrlTracker;


