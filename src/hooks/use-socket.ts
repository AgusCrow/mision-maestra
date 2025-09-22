'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  userId?: string;
  username?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: any[];
  error: string | null;
}

export const useSocket = ({ userId, username }: UseSocketProps = {}): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to socket server');

      // Authenticate user if credentials are provided
      if (userId && username) {
        socket.emit('user:authenticate', { userId, username });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setIsConnected(false);
      console.error('Socket connection error:', err);
    });

    // Handle online users updates
    socket.on('users:online:list', (data: { users: any[]; count: number; error?: string }) => {
      if (data.error) {
        setError(data.error);
      } else {
        setOnlineUsers(data.users);
      }
    });

    // Handle authentication response
    socket.on('user:authenticated', (data: { success: boolean; message: string }) => {
      if (data.success) {
        console.log('Socket authentication successful');
      } else {
        setError(data.message);
      }
    });

    // Request online users list when connected
    if (isConnected) {
      socket.emit('users:online');
    }

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [userId, username]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    error,
  };
};