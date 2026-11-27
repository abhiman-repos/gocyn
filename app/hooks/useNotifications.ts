import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  trackNotificationClick,
  deleteNotification,
  reportNotification as submitNotificationReport,
} from '../services/NotificationService';
import type { NotificationReportReason } from '../services/NotificationService';
import { Notification } from '../types/types';

export const useNotifications = (initialPage = 1) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const readingIds = useRef(new Set<number>());
  const notificationMutationVersion = useRef(0);
  const unreadMutationVersion = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    const requestVersion = unreadMutationVersion.current;
    try {
      const count = await getUnreadCount();
      // Ignore a response that began before a read action, or while one is pending.
      if (requestVersion === unreadMutationVersion.current && readingIds.current.size === 0) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, replace = true) => {
    const requestVersion = notificationMutationVersion.current;
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications({ page: pageNum });
      // A stale refresh must not restore unread styling while a read is in flight.
      if (requestVersion !== notificationMutationVersion.current || readingIds.current.size > 0) return;
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
    let scheduledRefresh: number | undefined;
    const refreshUnreadCount = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    const refreshNotifications = () => {
      if (document.visibilityState === 'visible') {
        if (scheduledRefresh !== undefined) window.clearTimeout(scheduledRefresh);
        scheduledRefresh = window.setTimeout(() => {
          scheduledRefresh = undefined;
          fetchUnreadCount();
          fetchNotifications(1);
        }, 250);
      }
    };
    const interval = window.setInterval(refreshUnreadCount, 60_000);
    document.addEventListener('visibilitychange', refreshNotifications);
    window.addEventListener('focus', refreshNotifications);
    return () => {
      window.clearInterval(interval);
      if (scheduledRefresh !== undefined) window.clearTimeout(scheduledRefresh);
      document.removeEventListener('visibilitychange', refreshNotifications);
      window.removeEventListener('focus', refreshNotifications);
    };
  }, [fetchUnreadCount, fetchNotifications]);

  const handleMarkAsRead = async (id: number, options?: { optimistic?: boolean }) => {
    if (readingIds.current.has(id)) return;
    readingIds.current.add(id);
    notificationMutationVersion.current += 1;
    unreadMutationVersion.current += 1;
    const wasUnread = notifications.some((notification) => notification.id === id && !notification.is_read);
    // Prefer a confirmed update so a failed request never flashes the row or badge.
    const optimistic = options?.optimistic === true;
    if (wasUnread && optimistic) {
      // Update the row and bell immediately; restore the unread state if the API fails.
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await markNotificationAsRead(id);
      if (wasUnread && !optimistic) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      if (wasUnread && optimistic) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false, read_at: null } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
      throw err;
    } finally {
      readingIds.current.delete(id);
      notificationMutationVersion.current += 1;
      unreadMutationVersion.current += 1;
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

  const handleRemoveNotification = async (id: number) => {
    await deleteNotification(id);
    const wasUnread = notifications.some((notification) => notification.id === id && !notification.is_read);
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleReportNotification = async (id: number, report: { reason: NotificationReportReason; feedback: string }) => {
    await submitNotificationReport(id, report);
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
    removeNotification: handleRemoveNotification,
    reportNotification: handleReportNotification,
    markAllAsRead: handleMarkAllAsRead,
    trackClick: handleNotificationClick,
    clearNotifications: handleClearNotifications,
    refresh: async () => {
      await Promise.all([fetchUnreadCount(), fetchNotifications(1)]);
    },
  };
};
