import React from 'react';
import { X } from 'lucide-react';
import NotificationList from './NotificationList';
import { Notification } from '@/app/types/types';
import type { NotificationReportReason } from '@/app/services/NotificationService';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkAsRead: (id: number, options?: { optimistic?: boolean }) => Promise<void> | void;
  onRemove: (id: number) => Promise<void>;
  onReport: (id: number, report: { reason: NotificationReportReason; feedback: string }) => Promise<void>;
  onClickNotification?: (id: number) => Promise<void> | void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  viewAllHref?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  loading,
  error,
  onRefresh,
  hasMore,
  onLoadMore,
  onMarkAsRead,
  onRemove,
  onReport,
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
        w-auto sm:w-[420px]
        max-w-none sm:max-w-[calc(100vw-2rem)] max-h-[min(80vh,600px)]
        rounded-2xl bg-white shadow-2xl border border-gray-200 z-50
        overflow-hidden
      "
    >
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
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

      {error && <div role="alert" className="border-b border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800"><p>Could not load notifications: {error}</p>{onRefresh && <button type="button" onClick={() => void onRefresh()} className="mt-1 font-semibold underline">Try again</button>}</div>}

      <div className="min-h-0 max-h-[min(65vh,480px)] overflow-y-auto">
        <NotificationList
          notifications={notifications}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onMarkAsRead={onMarkAsRead}
          onClickNotification={onClickNotification}
          onRemove={onRemove}
          onReport={onReport}
        />
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <a
          href={viewAllHref}
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;
