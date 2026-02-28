import React, { useState, useEffect } from 'react';
import { scoreAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './Score.css';

const Score = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadScores();
  }, [user]);

  const loadScores = async () => {
    try {
      setLoading(true);
      if (user?.mssv) {
        const res = await scoreAPI.getByStudent(user.mssv);
        setScores(res.data || []);
      }
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return { label: 'Xuất sắc', color: 'excellent' };
    if (score >= 80) return { label: 'Tốt', color: 'good' };
    if (score >= 70) return { label: 'Khá', color: 'fair' };
    if (score >= 60) return { label: 'Đạt', color: 'pass' };
    return { label: 'Chưa Đạt', color: 'fail' };
  };

  return (
    <div className="score-container">
      <h1>Điểm Rèn Luyện</h1>
      
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : scores.length === 0 ? (
        <div className="empty-state">Chưa có điểm rèn luyện nào</div>
      ) : (
        <div className="scores-table-wrapper">
          <table className="scores-table">
            <thead>
              <tr>
                <th>Học Kỳ</th>
                <th>Năm Học</th>
                <th>Điểm Hoạt Động</th>
                <th>Điểm Khen Thưởng</th>
                <th>Điểm Kỷ Luật</th>
                <th>Tổng Điểm</th>
                <th>Đánh Giá</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(score => {
                const level = getScoreLevel(score.tong_diem || 0);
                return (
                  <tr key={score.id}>
                    <td>{score.tenhocky}</td>
                    <td>{score.namhoc}</td>
                    <td className="text-center">{(score.diem_hoatdong || 0).toFixed(1)}</td>
                    <td className="text-center">{(score.diem_khenthuong || 0).toFixed(1)}</td>
                    <td className="text-center">{(score.diem_kyluat || 0).toFixed(1)}</td>
                    <td className={`text-center font-bold level-${level.color}`}>
                      {(score.tong_diem || 0).toFixed(1)}
                    </td>
                    <td className={`text-center font-bold level-${level.color}`}>
                      {level.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Score;
