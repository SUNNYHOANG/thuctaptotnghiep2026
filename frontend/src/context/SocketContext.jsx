import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const s = io(SOCKET_URL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('activity_approval', (data) => {
      if (user?.mssv === data.mssv) {
        const type = data.status === 'duocduyet' ? 'success' : 'error';
        setNotifications((prev) => [...prev.slice(-4), { id: Date.now(), type, message: data.message }]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('realtime-notification', { detail: { type, message: data.message } }));
        }
      }
    });

    s.on('drl_score', (data) => {
      if (user?.mssv === data.mssv) {
        setNotifications((prev) => [...prev.slice(-4), { id: Date.now(), type: 'info', message: data.message }]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('realtime-notification', { detail: { type: 'info', message: data.message } }));
        }
      }
    });

    return () => {
      s.disconnect();
    };
  }, [user?.mssv]);

  useEffect(() => {
    if (socket && user?.mssv && user?.role === 'sinhvien') {
      socket.emit('join-student', user.mssv);
    }
  }, [socket, user?.mssv, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
      {/* Toast notifications */}
      {notifications.slice(-3).map((n) => (
        <div
          key={n.id}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            padding: '12px 20px',
            borderRadius: 8,
            background: n.type === 'success' ? '#d4edda' : n.type === 'error' ? '#f8d7da' : '#cce5ff',
            color: n.type === 'error' ? '#721c24' : '#155724',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease',
            maxWidth: 360,
          }}
        >
          {n.message}
        </div>
      ))}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
