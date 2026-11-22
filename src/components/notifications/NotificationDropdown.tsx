import React from 'react';
import { X } from 'lucide-react';
import NotificationList from './NotificationList';
import { Notification } from '@/app/types/types';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkAsRead: (id: number) => void;
  onClickNotification?: (id: number) => Promise<void> | void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  viewAllHref?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  loading,
  hasMore,
  onLoadMore,
  onMarkAsRead,
  onClickNotification,
  onMarkAllAsRead,
  onClose,
  viewAllHref = "/notifications",
}) => {
  return (
    <div
      className="
        fixed sm:absolute
        inset-x-4 top-16 sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2
        w-auto sm:w-80
        max-w-none sm:max-w-80
        bg-white shadow-xl border border-gray-200 z-50
        overflow-hidden
      "
    >
      <div className="flex justify-between items-center p-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="text-gray-600 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
        <NotificationList
          notifications={notifications}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onMarkAsRead={onMarkAsRead}
          onClickNotification={onClickNotification}
        />
      </div>

      <div className="p-2 border-t border-gray-100">
        <a
          href={viewAllHref}
          className="block text-center text-sm text-blue-600 hover:text-blue-800"
        >
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;
