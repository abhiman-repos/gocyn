import React, { useState, useRef, useEffect } from 'react';
import NotificationBadge from './NotificationBadge';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '@/app/hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    removeNotification,
    reportNotification,
    trackClick,
    markAllAsRead,
    clearNotifications,
    refresh,
  } = useNotifications();

  const toggle = () => {
    setIsOpen((open) => !open);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-notification-portal="true"]')) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-half hover:bg-gray-100 focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <NotificationBadge count={unreadCount} />
      </button>
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          error={error}
          onRefresh={refresh}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onMarkAsRead={markAsRead}
          onRemove={removeNotification}
          onReport={reportNotification}
          onClickNotification={trackClick}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setIsOpen(false)}

        />
      )}
    </div>
  );
};

export default NotificationBell;
