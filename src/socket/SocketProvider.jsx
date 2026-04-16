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

    const socket = io(window.location.origin, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    // ─── Realtime Event Listeners ─────────────────────────────────────────────
    // Instead of local mutation, we invalidate queries to ensure fresh, 
    // server-authoritative state across all clients.
    
    socket.on('task:moved', ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    });

    socket.on('task:created', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] });
    });

    socket.on('task:deleted', ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    });

    socket.on('task:updated', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] });
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
