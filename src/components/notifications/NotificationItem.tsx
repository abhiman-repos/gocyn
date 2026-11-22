import React from 'react';
import { Notification } from '@/app/types/types';
import { formatDistanceToNow } from 'date-fns'; // optional for time formatting

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => Promise<void> | void;
  onClickNotification?: (id: number) => Promise<void> | void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onClickNotification }) => {
  const handleClick = async () => {
    await onClickNotification?.(notification.id);
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
    if (notification.redirect_url) {
      // navigate to the redirect URL (using Next.js router)
      window.location.href = notification.redirect_url;
    }
  };

  return (
      <button
        type="button"
      onClick={handleClick}
        className={`block w-full p-4 border-b border-gray-100 text-left cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <p className={`font-medium ${!notification.is_read ? 'text-blue-800' : 'text-gray-800'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"></span>
        )}
    </div>
    </button>
  );
};

export default NotificationItem;
