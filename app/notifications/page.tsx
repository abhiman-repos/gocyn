"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "../hooks/useNotifications";
import NotificationList from "@/src/components/notifications/NotificationList";
import { getInstructorNotificationPreferences, updateInstructorNotificationPreferences } from "@/app/services/NotificationService";
import { Check, LoaderCircle } from "lucide-react";

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [instructorAudience, setInstructorAudience] = useState(false);
  const { notifications, loading, error, refresh, hasMore, loadMore, markAsRead, removeNotification, reportNotification, trackClick } =
    useNotifications();

  useEffect(() => {
    let active = true;
    const instructorToken = localStorage.getItem("mentorToken");
    const userToken = localStorage.getItem("token") || localStorage.getItem("auth_token");
    const instructorAudience = new URLSearchParams(window.location.search).get("audience") === "instructor" || (!!instructorToken && !userToken);
    setInstructorAudience(instructorAudience);
    const token = instructorAudience ? instructorToken : userToken;
    if (!token) {
      router.replace(instructorAudience ? "/instructors/login?next=%2Fnotifications%3Faudience%3Dinstructor" : "/login?next=%2Fnotifications");
      return;
    }
    const base = (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://api.gocyn.com" : "http://localhost:8000")).replace(/\/+$/, "");
    const endpoint = instructorAudience ? "/api/instructors/me/" : "/api/auth/me/";
    fetch(`${base}${endpoint}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((response) => {
        if (!active) return;
        if (response.ok) setAuthChecked(true);
        else router.replace(instructorAudience ? "/instructors/login?next=%2Fnotifications%3Faudience%3Dinstructor" : "/login?next=%2Fnotifications");
      })
      .catch(() => { if (active) router.replace(instructorAudience ? "/instructors/login?next=%2Fnotifications%3Faudience%3Dinstructor" : "/login?next=%2Fnotifications"); });
    return () => { active = false; };
  }, [router]);

  if (!authChecked) return <div className="min-h-[50vh]" aria-busy="true" />;

  const isEmpty = !loading && !error && notifications.length === 0;

  return (
    <div className="min-h-[calc(100vh-180px)] bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:-px-30 py-18">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Stay updated with latest activity
            </p>
          </div>
        </div>

        {error && <div role="alert" className="mb-5 flex flex-col gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"><span>Could not load notifications: {error}</span><button type="button" onClick={() => void refresh()} className="w-fit border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-800 hover:bg-red-100">Try again</button></div>}

        {instructorAudience && <InstructorNotificationPreference />}

        {/* Content Card */}
        <div className="overflow-hidden">
          {error ? (
            <div className="py-8 text-center text-sm text-gray-500">Use the message above to retry loading your notifications.</div>
          ) : isEmpty ? (
            /* Professional Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-26 h-26 flex items-center justify-center mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-700"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Daily updates about internships, mentors, or certificates.
                Appear here.
              </p>
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onMarkAsRead={markAsRead}
              onClickNotification={trackClick}
              onRemove={removeNotification}
              onReport={reportNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

function InstructorNotificationPreference() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getInstructorNotificationPreferences()
      .then((preferences) => { if (active) setEnabled(preferences.in_app_enabled); })
      .catch((error) => console.error("Could not load instructor notification preference", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const saved = await updateInstructorNotificationPreferences({ in_app_enabled: next });
      setEnabled(saved.in_app_enabled);
    } catch (error) {
      setEnabled(!next);
      console.error("Could not save instructor notification preference", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold text-gray-900">Instructor notification settings</h2>
        <p className="mt-1 text-sm text-gray-500">{enabled ? "Course and account alerts are enabled." : "Course and account alerts are disabled."}</p>
      </div>
      <button type="button" role="switch" aria-checked={enabled} aria-label="Enable instructor notifications" disabled={loading || saving} onClick={() => void toggle()} className={`relative inline-flex h-6 w-11 shrink-0 items-center border-2 border-transparent transition-colors disabled:opacity-60 ${enabled ? "bg-blue-700" : "bg-gray-300"}`}>
        <span className={`inline-flex h-5 w-5 items-center justify-center bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`}>
          {saving ? <LoaderCircle className="h-3 w-3 animate-spin text-gray-500" /> : enabled ? <Check className="h-3 w-3 text-blue-700" /> : null}
        </span>
      </button>
    </section>
  );
}
