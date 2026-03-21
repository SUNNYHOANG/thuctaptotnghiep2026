import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './ReminderPopup.css';

const STORAGE_KEY = 'reminder_read_ids';

function getReadIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function markRead(id) {
  const ids = getReadIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); }
}

const ReminderPopup = () => {
  const { user } = useAuth();
  const [allReminders, setAllReminders] = useState([]); // tất cả nhắc nhở của SV này
  const [queue, setQueue] = useState([]);               // chưa đọc, hiện popup
  const [current, setCurrent] = useState(null);         // đang hiện popup
  const [bellOpen, setBellOpen] = useState(false);      // dropdown chuông

  const isStudent = user?.role === 'sinhvien';

  const fetchReminders = useCallback(async () => {
    if (!isStudent) return;
    try {
      const mssv = user?.mssv;
      const res = await api.get('/thongbao/my-reminders', {
        headers: mssv ? { 'x-user-mssv': mssv } : {},
      });
      const all = res.data?.data || [];
      setAllReminders(all);
      const readIds = getReadIds();
      const unread = all.filter((r) => !readIds.includes(r.mathongbao));
      setQueue(unread);
    } catch (err) {
      console.error('[ReminderPopup] fetch error:', err);
    }
  }, [isStudent, user?.mssv]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Khi queue thay đổi, hiện cái đầu tiên
  useEffect(() => {
    if (queue.length > 0 && !current) setCurrent(queue[0]);
  }, [queue, current]);

  const handleClose = () => {
    if (current) markRead(current.mathongbao);
    const remaining = queue.filter((r) => r.mathongbao !== current?.mathongbao);
    setQueue(remaining);
    setCurrent(remaining.length > 0 ? remaining[0] : null);
  };

  const unreadCount = queue.length;

  if (!isStudent) return null;

  return (
    <>
      {/* Icon chuông trên topbar */}
      <div className="reminder-bell-wrap">
        <button
          className="reminder-bell-btn"
          onClick={() => setBellOpen((v) => !v)}
          aria-label="Thông báo nhắc nhở"
          title="Thông báo nhắc nhở"
        >
          🔔
          {unreadCount > 0 && (
            <span className="reminder-bell-badge">{unreadCount}</span>
          )}
        </button>

        {bellOpen && (
          <div className="reminder-bell-dropdown">
            <div className="reminder-bell-dropdown__header">
              Thông báo nhắc nhở
              <button className="reminder-bell-dropdown__close" onClick={() => setBellOpen(false)}>✕</button>
            </div>
            {allReminders.length === 0 ? (
              <div className="reminder-bell-dropdown__empty">Chưa có thông báo nào.</div>
            ) : (
              <ul className="reminder-bell-dropdown__list">
                {allReminders.map((r) => {
                  const isRead = getReadIds().includes(r.mathongbao);
                  return (
                    <li key={r.mathongbao} className={`reminder-bell-item ${isRead ? 'read' : 'unread'}`}>
                      <div className="reminder-bell-item__title">{r.tieude}</div>
                      <div className="reminder-bell-item__meta">
                        {r.ngaytao ? new Date(r.ngaytao).toLocaleString('vi-VN') : ''}
                        {!isRead && <span className="reminder-bell-item__dot" />}
                      </div>
                      {r.noidung && (
                        <div className="reminder-bell-item__body">{r.noidung}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Popup modal cho thông báo chưa đọc */}
      {current && (
        <div className="reminder-overlay" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
          <div className="reminder-modal">
            <div className="reminder-modal__header">
              <span>THÔNG BÁO SINH VIÊN</span>
              <button className="reminder-modal__close" onClick={handleClose} aria-label="Đóng">✕</button>
            </div>
            <div className="reminder-modal__body">
              <p className="reminder-modal__label">Tiêu đề:</p>
              <p className="reminder-modal__title" id="reminder-title">{current.tieude}</p>
              {current.noidung && (
                <p className="reminder-modal__content">{current.noidung}</p>
              )}
            </div>
            <div className="reminder-modal__footer">
              <button className="btn-dong-y" onClick={handleClose}>Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReminderPopup;
