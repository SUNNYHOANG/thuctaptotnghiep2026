import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const timeoutsRef = useRef([]);
  const listenersRef = useRef({});

  const pushNotification = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev.slice(-4), { id, type, message }]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('realtime-notification', { detail: { type, message } }));
    }
    const timeout = window.setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
    timeoutsRef.current.push(timeout);
  }, []);

  const addListener = useCallback((event, cb) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = new Set();
    listenersRef.current[event].add(cb);
    return () => listenersRef.current[event]?.delete(cb);
  }, []);

  useEffect(() => {
    if (!user) return;

    const s = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    setSocket(s);

    const dispatch = (event, data) => {
      listenersRef.current[event]?.forEach(cb => { try { cb(data); } catch (_) {} });
    };

    s.on('connect', () => {
      if (user.mssv) s.emit('join-student', user.mssv);
      if (user.role) s.emit('join-role', user.role);
      if (user.makhoa) s.emit('join-khoa', user.makhoa);
    });

    s.on('activity_approval', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      pushNotification(data.status === 'duocduyet' ? 'success' : 'error', data.message);
      dispatch('activity_approval', data);
    });

    s.on('drl_score', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      pushNotification('info', data.message);
      dispatch('drl_score', data);
    });

    s.on('drl:reviewed', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      const type = data.trangthai === 'daduyet' ? 'success' : data.trangthai === 'bituchoi' ? 'error' : 'info';
      pushNotification(type, data.message);
      dispatch('drl:reviewed', data);
    });

    s.on('reward_discipline', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      pushNotification(data.loai === 'khenthuong' ? 'success' : 'error', data.message);
      dispatch('reward_discipline', data);
    });

    s.on('dichvu:status', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      const type = data.trangthai === 'duyet' ? 'success' : data.trangthai === 'tuchoi' ? 'error' : 'info';
      pushNotification(type, data.message);
      dispatch('dichvu:status', data);
    });

    s.on('phuckhao:status', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      const type = data.trangthai === 'duyet' ? 'success' : data.trangthai === 'tuchoi' ? 'error' : 'info';
      pushNotification(type, data.message);
      dispatch('phuckhao:status', data);
    });

    s.on('don-online:status', (data) => {
      if (user.mssv && user.mssv !== data.mssv) return;
      const type = data.trangthai === 'duyet' ? 'success' : data.trangthai === 'tuchoi' ? 'error' : 'info';
      pushNotification(type, data.message);
      dispatch('don-online:status', data);
    });

    s.on('drl:submitted', (data) => {
      if (['admin', 'ctsv', 'giangvien', 'khoa'].includes(user.role)) {
        pushNotification('info', `Sinh viên ${data.mssv} vừa gửi phiếu tự đánh giá DRL.`);
        dispatch('drl:submitted', data);
      }
    });

    s.on('drl:updated', (data) => {
      dispatch('drl:updated', data);
    });

    s.on('thongbao:new', (data) => {
      pushNotification('info', `📢 Thông báo mới: ${data.tieude || 'Có thông báo mới'}`);
      dispatch('thongbao:new', data);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] Không kết nối được:', err.message);
    });

    return () => {
      s.disconnect();
      setSocket(null);
      setNotifications([]);
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [user?.id, user?.role, user?.mssv, user?.makhoa]);

  return (
    <SocketContext.Provider value={{ socket, notifications, addListener }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
        {notifications.slice(-3).map((n) => (
          <div key={n.id} style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: n.type === 'success' ? '#d4edda' : n.type === 'error' ? '#f8d7da' : '#cce5ff',
            color: n.type === 'error' ? '#721c24' : n.type === 'success' ? '#155724' : '#004085',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 13,
            lineHeight: 1.4,
            borderLeft: `4px solid ${n.type === 'success' ? '#28a745' : n.type === 'error' ? '#dc3545' : '#007bff'}`,
          }}>
            {n.message}
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Hook lắng nghe socket event để tự động refresh data.
 * @param {string|string[]} events
 * @param {function} callback
 */
export function useSocketEvent(events, callback) {
  const ctx = useContext(SocketContext);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!ctx?.addListener) return;
    const eventList = Array.isArray(events) ? events : [events];
    const handler = (data) => cbRef.current(data);
    const cleanups = eventList.map(ev => ctx.addListener(ev, handler));
    return () => cleanups.forEach(fn => fn());
  }, [ctx]);
}
