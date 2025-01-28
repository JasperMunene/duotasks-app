import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

// Socket/Real-time notification interface (your existing one)
export interface SocketNotification {
  id: string;
  title: string;
  message: string;
  image?: string;
  route?: '/(tabs)' | '/(auth)' | '/(screens)' | string;
  timestamp: Date;
}

// API notification interfaces
export interface NotificationSender {
  name: string;
  source: string;
  image?: string;
  link?: string | null;
}

export interface ApiNotification {
  id: number;
  message: string;
  is_important: boolean;
  is_read: boolean;
  created_at: string;
  sender: NotificationSender;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Unified notification type for internal use
export interface UnifiedNotification {
  id: string | number;
  title?: string;
  message: string;
  image?: string;
  route?: string;
  timestamp: Date;
  isRead?: boolean;
  isImportant?: boolean;
  sender?: NotificationSender;
  type: 'socket' | 'api';
}

interface NotificationContextType {
  // Socket notifications (existing functionality)
  showNotification: (notification: Omit<SocketNotification, 'id' | 'timestamp'>) => void;
  hideNotification: () => void;
  currentNotification: SocketNotification | null;
  
  // API notifications (new functionality)
  apiNotifications: ApiNotification[];
  fetchNotifications: (page?: number, perPage?: number) => Promise<{ hasMore: boolean; totalPages: number }>;
  markAsRead: (notificationId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Combined functionality
  allNotifications: UnifiedNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Pagination info
  currentPage: number;
  totalPages: number;
  hasMoreData: boolean;

  // Network status (new functionality)
  networkStatusMessage: string | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ 
  children,
  baseUrl = API_BASE_URL,
}: { 
  children: React.ReactNode;
  baseUrl?: string;
}) {
  // Socket notification state (existing)
  const [currentNotification, setCurrentNotification] = useState<SocketNotification | null>(null);
  
  // API notification state (new)
  const [apiNotifications, setApiNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  // Network status state (new)
  const [networkStatusMessage, setNetworkStatusMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const { accessToken, user, updateProfile } = useAuth();
  const { isConnected } = useSocket();
  // Effect to manage network status messages
  useEffect(() => {
    console.log('NotificationContext useEffect - user:', user ? user.id : 'null', 'isConnected:', isConnected);

    // Only show network status message if a user is logged in
    if (!user) {
      console.log('NotificationContext: User is null, clearing network status message.');
      setNetworkStatusMessage(null);
      return;
    }

    if (isConnected) {
      console.log('NotificationContext: User is connected, setting "Back online".');
      setNetworkStatusMessage('Back online');
      // Optionally, hide the message after a few seconds
      const timer = setTimeout(() => {
        console.log('NotificationContext: Hiding "Back online" message.');
        setNetworkStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (user && !isConnected) { // Add explicit check for user before showing offline
      console.log('NotificationContext: User is NOT connected, setting "You are offline".');
      setNetworkStatusMessage('You are offline');
    }
  }, [isConnected, user]);

  // Existing socket notification functionality
  const showNotification = (notification: Omit<SocketNotification, 'id' | 'timestamp'>) => {
    const newNotification: SocketNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setCurrentNotification(newNotification);

    // Auto hide notification after 5 seconds
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => setCurrentNotification(null);

  // Improved API notification functionality
  const fetchNotifications = useCallback(async (page = 1, perPage = 10) => {
    // Only fetch notifications when user is authenticated
    if (!accessToken || !user) {
      console.log('Notifications fetch skipped: user not authenticated');
      setLoading(false);
      return { hasMore: false, totalPages: 1 };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${baseUrl}/user/notifications?page=${page}&per_page=${perPage}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data: NotificationsResponse = await response.json();
      
      // If it's the first page, replace notifications; otherwise, append for pagination
      if (page === 1) {
        setApiNotifications(data.notifications);
        setHasMoreData(data.pages > 1);
        updateProfile({ notifications_count: data.notifications.filter(n => !n.is_read).length });
      } else {
        setApiNotifications(prev => [...prev, ...data.notifications]);
        setHasMoreData(page < data.pages);
        // If not the first page, we need to re-calculate the total unread count
        // This is a simplified approach, a more robust solution might involve the API returning the total unread count across all pages
        updateProfile({ notifications_count: (user?.notifications_count || 0) + data.notifications.filter(n => !n.is_read).length });
      }
      
      setCurrentPage(data.page);
      setTotalPages(data.pages);
      
      // Return pagination info
      return {
        hasMore: page < data.pages,
        totalPages: data.pages
      };
    } catch (err) {
      // Only log the error, don't set it aggressively to avoid UI disruption
      console.error('Error fetching notifications:', err);
      // Set error only for the first page to avoid spamming errors during pagination
      if (page === 1) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      }
      return { hasMore: false, totalPages: 1 };
    } finally {
      setLoading(false);
    }
  }, [baseUrl, accessToken, user]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(
        `${baseUrl}/user/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      // Update local state
      setApiNotifications(prev => {
        const updatedNotifications = prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        );
        // Decrement notifications_count if the marked notification was unread
        if (!prev.find(n => n.id === notificationId)?.is_read) {
          updateProfile({ notifications_count: (user?.notifications_count || 0) - 1 });
        }
        return updatedNotifications;
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [baseUrl, accessToken]);

  const refreshNotifications = useCallback(async () => {
    setCurrentPage(1);
    setHasMoreData(true);
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // Fetch notifications when component mounts - only when authenticated
  // Use a ref to track the last user ID we fetched for to prevent loops
  const lastFetchedUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only fetch if we have auth and haven't fetched for this user yet
    if (accessToken && user?.id) {
      // Only fetch if this is a different user or we haven't fetched yet
      if (lastFetchedUserIdRef.current !== user.id) {
        console.log('NotificationContext: Fetching notifications for user:', user.id);
        lastFetchedUserIdRef.current = user.id;
        fetchNotifications(1);
      }
    } else {
      // Reset when user logs out
      lastFetchedUserIdRef.current = null;
      setApiNotifications([]);
    }
    // Only depend on accessToken and user.id, NOT fetchNotifications to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.id]);

  // Computed values
  const allNotifications: UnifiedNotification[] = [
    // Current socket notification (if any)
    ...(currentNotification ? [{
      ...currentNotification,
      type: 'socket' as const,
    }] : []),
    
    // API notifications
    ...apiNotifications.map(notification => ({
      id: notification.id,
      title: notification.sender.name,
      message: notification.message,
      image: notification.sender.image,
      route: notification.sender.link || undefined,
      timestamp: new Date(notification.created_at),
      isRead: notification.is_read,
      isImportant: notification.is_important,
      sender: notification.sender,
      type: 'api' as const,
    })),
  ];

  const unreadCount = apiNotifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        // Socket notifications
        showNotification,
        hideNotification,
        currentNotification,
        
        // API notifications
        apiNotifications,
        fetchNotifications,
        markAsRead,
        refreshNotifications,
        
        // Combined
        allNotifications,
        unreadCount,
        loading,
        error,
        
        // Pagination
        currentPage,
        totalPages,
        hasMoreData,

        // Network status
        networkStatusMessage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Custom hook for socket notifications specifically
export function useSocketNotification() {
  const { showNotification, hideNotification, currentNotification } = useNotification();
  return { showNotification, hideNotification, currentNotification };
}

// Custom hook for API notifications specifically  
export function useApiNotifications() {
  const { 
    apiNotifications, 
    fetchNotifications, 
    markAsRead, 
    refreshNotifications,
    unreadCount,
    loading,
    error,
    currentPage,
    totalPages,
    hasMoreData
  } = useNotification();
  
  return { 
    apiNotifications, 
    fetchNotifications, 
    markAsRead, 
    refreshNotifications,
    unreadCount,
    loading,
    error,
    currentPage,
    totalPages,
    hasMoreData
  };
}