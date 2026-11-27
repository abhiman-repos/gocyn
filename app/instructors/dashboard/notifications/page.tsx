"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Inbox, LoaderCircle } from "lucide-react";
import { useNotifications } from "@/app/hooks/useNotifications";
import NotificationList from "@/src/components/notifications/NotificationList";
import { getInstructorNotificationPreferences, updateInstructorNotificationPreferences } from "@/app/services/NotificationService";

export default function InstructorNotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    removeNotification,
    reportNotification,
    markAllAsRead,
    trackClick,
    refresh,
  } = useNotifications();
  const [enabled, setEnabled] = useState(true);
  const [preferenceLoading, setPreferenceLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");

  useEffect(() => {
    let active = true;
    getInstructorNotificationPreferences()
      .then((preferences) => { if (active) setEnabled(preferences.in_app_enabled); })
      .catch((error) => {
        console.error("Could not load instructor notification preference", error);
        if (active) setPreferenceError(error instanceof Error ? error.message : "Could not load your saved preference.");
      })
      .finally(() => { if (active) setPreferenceLoading(false); });
    return () => { active = false; };
  }, []);

  const togglePreference = async () => {
    const nextValue = !enabled;
    setEnabled(nextValue);
    setSavingPreference(true);
    setPreferenceError("");
    try {
      const saved = await updateInstructorNotificationPreferences({ in_app_enabled: nextValue });
      setEnabled(saved.in_app_enabled);
      await refresh();
    } catch (error) {
      setEnabled(!nextValue);
      console.error("Could not save instructor notification preference", error);
      setPreferenceError(error instanceof Error ? error.message : "Could not save this preference.");
    } finally {
      setSavingPreference(false);
    }
  };

  const isEmpty = !loading && notifications.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Instructor workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Your notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Course approval updates and other alerts for your instructor account.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => void markAllAsRead()} className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Check className="h-4 w-4" />Mark all as read
          </button>
        )}
      </header>

      <section className="flex flex-col gap-4 border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${enabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-950">In-app notifications</h2>
            <p className="mt-1 text-sm text-gray-500">{enabled ? "Course and account alerts are enabled." : "Course and account alerts are disabled."}</p>
          </div>
        </div>
        <button type="button" role="switch" aria-label="Enable instructor notifications" aria-checked={enabled} disabled={preferenceLoading || savingPreference} onClick={() => void togglePreference()} className={`relative inline-flex h-6 w-11 shrink-0 items-center border-2 border-transparent transition-colors disabled:opacity-60 ${enabled ? "bg-blue-700" : "bg-gray-300"}`}>
          <span className={`inline-flex h-5 w-5 items-center justify-center bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}>
            {savingPreference ? <LoaderCircle className="h-3 w-3 animate-spin text-gray-500" /> : enabled ? <Check className="h-3 w-3 text-blue-700" /> : null}
          </span>
        </button>
        {preferenceError && <p role="alert" className="text-sm text-red-700 sm:max-w-56">{preferenceError}</p>}
      </section>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2"><Inbox className="h-5 w-5 text-gray-500" /><h2 className="font-semibold text-gray-950">Notification activity</h2></div>
          <span className="text-sm text-gray-500">{unreadCount} unread</span>
        </div>
        {isEmpty ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-base font-semibold text-gray-900">You’re all caught up</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">New updates for your instructor account will appear here.</p>
          </div>
        ) : (
          <NotificationList notifications={notifications} loading={loading} hasMore={hasMore} onLoadMore={loadMore} onMarkAsRead={markAsRead} onClickNotification={trackClick} onRemove={removeNotification} onReport={reportNotification} />
        )}
      </section>
    </div>
  );
}
