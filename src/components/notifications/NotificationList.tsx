import React, { useRef, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import NotificationEmpty from './NotificationEmpty';
import { Notification } from '@/app/types/types';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkAsRead: (id: number) => void;
  onClickNotification?: (id: number) => Promise<void> | void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  hasMore,
  onLoadMore,
  onMarkAsRead,
  onClickNotification,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (notifications.length === 0 && !loading) {
    return <NotificationEmpty />;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onClickNotification={onClickNotification}
        />
      ))}
      {loading && (
        <div className="p-4 text-center text-gray-500">Loading...</div>
      )}
      {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
    </div>
  );
};

export default NotificationList;
