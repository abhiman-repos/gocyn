import React from "react";

const NotificationEmpty: React.FC = () => (
  <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center px-6 py-12 text-center sm:px-10 sm:py-16">
    {/* Notification icon */}
    <div className="mb-4 flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-gray-700 sm:h-10 sm:w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    </div>

    {/* Text */}
    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
      No notifications
    </h3>

    <p className="mt-1 max-w-[220px] text-xs text-gray-500 sm:max-w-xs sm:text-sm">
      Updates are visible here.
    </p>
  </div>
);

export default NotificationEmpty;