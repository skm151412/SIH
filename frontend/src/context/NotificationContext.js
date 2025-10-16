import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventSource, setEventSource] = useState(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch all notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications?page=0&size=20');
      setNotifications(response.data.content);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/api/notifications/unread/count');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Connect to SSE for real-time notifications
  const connectToSSE = () => {
    if (!isAuthenticated || !user) return;
    
    // Close any existing connection
    if (eventSource) {
      eventSource.close();
    }

    const newEventSource = new EventSource(`${api.defaults.baseURL}/api/notifications/stream`);
    
    newEventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different event types
      if (event.type === 'NOTIFICATION') {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(count => count + 1);
      }
    };
    
    newEventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      newEventSource.close();
      // Try to reconnect after a delay
      setTimeout(connectToSSE, 5000);
    };
    
    setEventSource(newEventSource);
  };

  // Initial data loading and SSE connection
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      connectToSSE();
    }
    
    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated, user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;