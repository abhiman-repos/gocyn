import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  trackNotificationClick,
} from '../services/NotificationService';
import { Notification } from '../types/types';

export const useNotifications = (initialPage = 1) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const readingIds = useRef(new Set<number>());

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, replace = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications({ page: pageNum });
      if (replace) {
        setNotifications(data.results);
      } else {
        setNotifications((prev) => [...prev, ...data.results]);
      }
      setHasMore(!!data.next);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || (!localStorage.getItem('mentorToken') && !localStorage.getItem('token') && !localStorage.getItem('auth_token'))) return;
    fetchUnreadCount();
    fetchNotifications(1);
    const refreshUnreadCount = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    const interval = window.setInterval(refreshUnreadCount, 60_000);
    document.addEventListener('visibilitychange', refreshUnreadCount);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshUnreadCount);
    };
  }, [fetchUnreadCount, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    if (readingIds.current.has(id)) return;
    readingIds.current.add(id);
    try {
      await markNotificationAsRead(id);
      const wasUnread = notifications.some((notification) => notification.id === id && !notification.is_read);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    } finally {
      readingIds.current.delete(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (id: number) => {
    try {
      await trackNotificationClick(id);
    } catch (err) {
      console.error('Failed to record notification click', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    trackClick: handleNotificationClick,
    clearNotifications: handleClearNotifications,
    refresh: async () => {
      await Promise.all([fetchUnreadCount(), fetchNotifications(1)]);
    },
  };
};
