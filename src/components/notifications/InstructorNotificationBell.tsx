"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import NotificationBadge from "./NotificationBadge";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "@/app/hooks/useNotifications";

export default function InstructorNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
    refresh,
  } = useNotifications();

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-notification-portal="true"]')) return;
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, []);

  const toggle = () => {
    setIsOpen((open) => !open);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount ? `Instructor notifications, ${unreadCount} unread` : "Instructor notifications"}
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/15 dark:bg-[#171717] dark:text-gray-100 dark:hover:bg-white/10"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
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
          viewAllHref="/instructors/dashboard/notifications"
        />
      )}
    </div>
  );
}
