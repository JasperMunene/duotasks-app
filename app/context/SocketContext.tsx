import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (userId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const hasRetriedRef = useRef(false);
  const isConnectingRef = useRef(false);

  // Cleanup function to disconnect socket
  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback((userId: string) => {
    console.log('Socket: connect() called with userId:', userId);
    
    // Validate userId
    // if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    //   console.error('Socket: ERROR - Invalid userId provided:', userId);
    //   return;
    // }
    
    // Prevent duplicate connection attempts
    if (socketRef.current?.connected || isConnectingRef.current) {
      console.log('Socket: Already connected or connecting, skipping...');
      console.log('Socket: Current state - connected:', socketRef.current?.connected, 'connecting:', isConnectingRef.current);
      return;
    }

    console.log('Socket: Starting new connection...');
    // Cleanup any existing socket before creating a new one
    cleanup();

    isConnectingRef.current = true;
    lastUserIdRef.current = userId;

    console.log('Socket: Creating new socket connection to:', API_BASE_URL);
    console.log('Socket: With query params:', { user_id: userId });
    
    const newSocket = io(API_BASE_URL, {
      query: { user_id: userId },
      transports: ['websocket'],
      reconnection: false,
      timeout: 10000,
      forceNew: true, // Force a new connection
    });
    
    console.log('Socket: Socket instance created, setting up event handlers...');

    // Set up event handlers
    newSocket.on('connect', () => {
      console.log('Socket: connect event fired');
    });
    
    newSocket.on('connected_ack', () => {
      console.log('Socket: ✅ connected_ack received - Socket is now connected!');
      setIsConnected(true);
      hasRetriedRef.current = false;
      isConnectingRef.current = false;
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      cleanup();

      // Only retry once if we haven't retried yet
      if (lastUserIdRef.current && !hasRetriedRef.current) {
        hasRetriedRef.current = true;
        setTimeout(() => {
          connect(lastUserIdRef.current!);
        }, 3000);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      cleanup();
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      cleanup();
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    lastUserIdRef.current = null;
    hasRetriedRef.current = false;
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      lastUserIdRef.current = null;
      hasRetriedRef.current = false;
    };
  }, [cleanup]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
} 