import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { accessToken } = useAuth();
  const socketRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Derive socket URL from API URL (strip /api suffix if present)
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl.endsWith('/api') 
      ? apiUrl.slice(0, -4) 
      : (apiUrl || window.location.origin);

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    // ─── Realtime Event Listeners ─────────────────────────────────────────────
    // Instead of local mutation, we invalidate queries to ensure fresh, 
    // server-authoritative state across all clients.
    
    // ─── Instant Sync: Direct Cache Patching ──────────────────────────────────
    // This removes the need for a follow-up HTTP request, resulting in 
    // near-zero latency updates across all devices.
    socket.on('task:sync', ({ boardId, tasks }) => {
      console.log('Realtime sync received for board:', boardId);
      queryClient.setQueryData(['tasks', boardId], tasks);
    });

    socket.on('error', (msg) => {
      console.error('Socket error:', msg);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  const joinBoard = (boardId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinBoard', boardId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinBoard }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within React Query and SocketProvider');
  return context;
};
