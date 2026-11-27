"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { createPortal } from "react-dom";
import type { Notification } from "@/app/types/types";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle, Bell, BookOpen, CalendarDays, Check, Ellipsis, Info,
  Megaphone, Sparkles, Trash2, X,
} from "lucide-react";
import type { NotificationReportReason } from "@/app/services/NotificationService";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number, options?: { optimistic?: boolean }) => Promise<void> | void;
  onClickNotification?: (id: number) => Promise<void> | void;
  onRemove: (id: number) => Promise<void>;
  onReport: (id: number, report: { reason: NotificationReportReason; feedback: string }) => Promise<void>;
}

const reasons: Array<{ value: NotificationReportReason; label: string; prompt: string }> = [
  { value: "spam", label: "Spam or irrelevant", prompt: "What made this notification feel irrelevant or unwanted?" },
  { value: "misleading", label: "Misleading or inaccurate", prompt: "Which detail seems inaccurate? Please share the correct information if known." },
  { value: "inappropriate", label: "Inappropriate content", prompt: "What should our team review in this notification?" },
  { value: "broken_link", label: "Broken link or action", prompt: "Which link or action failed, and what happened when you tried it?" },
  { value: "duplicate", label: "Duplicate notification", prompt: "Where or when did you receive the same update before?" },
  { value: "other", label: "Other", prompt: "What should we know, or how could we improve this notification?" },
];

const iconMap = { bell: Bell, megaphone: Megaphone, calendar: CalendarDays, book: BookOpen, sparkles: Sparkles, info: Info, alert: AlertTriangle };
const menuWidth = 192;
const readErrorMessage = (error: unknown) => {
  const requestError = error as { message?: string; response?: { status?: number; data?: { detail?: string; error?: string } } };
  const detail = requestError?.response?.data?.detail || requestError?.response?.data?.error;
  if (requestError?.response?.status === 401 || /session has expired|session expired/i.test(requestError?.message || "")) {
    return "Your sign-in session expired. Sign out and sign back in, then try again.";
  }
  return detail || requestError?.message || "Could not mark this notification as read. Please try again.";
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onClickNotification, onRemove, onReport }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<NotificationReportReason>("spam");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden" });
  const itemRef = useRef<HTMLElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const markAsReadRef = useRef(onMarkAsRead);
  const readAttemptedRef = useRef(false);
  const Icon = iconMap[(notification.icon || "bell") as keyof typeof iconMap] || Bell;
  const selectedReason = reasons.find((item) => item.value === reason) ?? reasons[0];

  useEffect(() => { markAsReadRef.current = onMarkAsRead; }, [onMarkAsRead]);

  // A notification is marked read after it has remained substantially visible,
  // so rows below the fold do not lose their unread marker prematurely.
  useEffect(() => {
    if (notification.is_read || !itemRef.current || typeof IntersectionObserver === "undefined") return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6 && !readAttemptedRef.current) {
        timer = window.setTimeout(async () => {
          readAttemptedRef.current = true;
          // Commit the visual read state only after the server confirms it.
          // Keep this as a one-time attempt to avoid retry flicker on server errors.
          try { await markAsReadRef.current(notification.id, { optimistic: false }); }
          catch { /* Manual retry remains available from the action menu. */ }
        }, 700);
      } else if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    }, { threshold: [0, 0.6, 1] });
    observer.observe(itemRef.current);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [notification.id, notification.is_read]);

  const positionMenu = useCallback(() => {
    const anchor = actionButtonRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight || 140;
    const gap = 6;
    const openAbove = window.innerHeight - rect.bottom < height + gap + 8 && rect.top > height + gap + 8;
    const top = openAbove
      ? Math.max(8, rect.top - height - gap)
      : Math.min(window.innerHeight - height - 8, rect.bottom + gap);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setMenuStyle({ position: "fixed", top, left, width: menuWidth, maxHeight: "min(18rem, calc(100vh - 1rem))", overflowY: "auto", visibility: "visible" });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    positionMenu();
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !actionButtonRef.current?.contains(target)) setMenuOpen(false);
    };
    const reposition = () => positionMenu();
    document.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [menuOpen, positionMenu]);

  const openNotification = async () => {
    if (!notification.is_read) {
      setActionError("");
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        setActionError(readErrorMessage(error));
        return;
      }
    }
    await onClickNotification?.(notification.id);
    if (notification.redirect_url) window.location.href = notification.redirect_url;
  };

  const markRead = async () => {
    setActionError("");
    try { await onMarkAsRead(notification.id); setMenuOpen(false); }
    catch (error) { setActionError(readErrorMessage(error)); }
  };

  const remove = async () => {
    setActionError("");
    if (!window.confirm("Remove this notification from your inbox?")) return;
    try { await onRemove(notification.id); }
    catch { setActionError("Could not remove this notification. Please try again."); setMenuOpen(false); }
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError("");
    setBusy(true);
    try {
      await onReport(notification.id, { reason, feedback: feedback.trim() });
      setReportOpen(false);
      setMenuOpen(false);
      setFeedback("");
      setReportSuccess(true);
      window.setTimeout(() => setReportSuccess(false), 5000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not submit your report. Please try again.");
    } finally { setBusy(false); }
  };

  return <>
    <article ref={itemRef} className={`relative border-b border-gray-100 px-4 py-4 transition-colors sm:px-5 ${!notification.is_read ? "bg-blue-50/70" : "bg-white"}`}>
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-100 text-blue-700">
          {notification.image_url ? <img src={notification.image_url} alt="" className="h-full w-full object-cover" /> : <Icon className="h-6 w-6" aria-hidden="true" />}
        </span>
        <button type="button" onClick={() => void openNotification()} className="min-w-0 flex-1 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <span className="flex items-start justify-between gap-2">
            <span className={`line-clamp-1 text-base font-semibold ${!notification.is_read ? "text-blue-900" : "text-gray-800"}`}>{notification.title}</span>
            {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-sm leading-5 text-gray-600">{notification.message}</span>
          <span className="mt-2 block text-xs text-gray-500">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
        </button>
        <button ref={actionButtonRef} type="button" aria-label={`More actions for ${notification.title}`} aria-expanded={menuOpen} onClick={() => { setMenuOpen((open) => !open); setActionError(""); }} className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <Ellipsis className="h-6 w-6" />
        </button>
      </div>
      {actionError && !reportOpen && <p role="alert" className="mt-2 text-xs text-red-700">{actionError}</p>}
      {reportSuccess && <p role="status" className="mt-2 text-xs text-emerald-700">Thanks. Your report was sent to the admin team for review.</p>}
    </article>

    {menuOpen && typeof document !== "undefined" && createPortal(
      <div data-notification-portal="true" ref={menuRef} role="menu" aria-label={`Actions for ${notification.title}`} style={menuStyle} className="z-[110] border border-gray-200 bg-white p-1 shadow-xl">
        {!notification.is_read && <button type="button" role="menuitem" onClick={() => void markRead()} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"><Check className="h-4 w-4 text-gray-500" />Mark as read</button>}
        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setReportOpen(true); setActionError(""); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"><AlertTriangle className="h-4 w-4 text-gray-500" />Report notification</button>
        <button type="button" role="menuitem" onClick={() => void remove()} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />Remove from inbox</button>
      </div>,
      document.body,
    )}

    {reportOpen && typeof document !== "undefined" && createPortal(
      <div data-notification-portal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setReportOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby={`report-title-${notification.id}`} className="w-full max-w-lg border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Help us improve</p><h2 id={`report-title-${notification.id}`} className="mt-1 text-lg font-semibold text-gray-950">Report this notification</h2><p className="mt-1 line-clamp-1 text-sm text-gray-500">{notification.title}</p></div>
            <button type="button" disabled={busy} onClick={() => setReportOpen(false)} aria-label="Close report form" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
          </header>
          <form onSubmit={(event) => void submitReport(event)} className="space-y-4 p-5">
            <label className="block text-sm font-semibold text-gray-800">What’s the issue?<select value={reason} onChange={(event) => setReason(event.target.value as NotificationReportReason)} className="mt-1.5 block w-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">{reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block text-sm font-semibold text-gray-800">Feedback for our team<textarea required minLength={10} maxLength={2000} rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder={selectedReason.prompt} className="mt-1.5 block w-full resize-y border border-gray-300 px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" /><span className="mt-1 flex justify-between text-xs font-normal text-gray-500"><span>Please provide at least 10 characters so we can investigate.</span><span>{feedback.length}/2000</span></span></label>
            <p className="border-l-2 border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">Your feedback is shared with the admin team for review. Reporting does not remove this notification from your inbox.</p>
            {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
            <footer className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" disabled={busy} onClick={() => setReportOpen(false)} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={busy || feedback.trim().length < 10} className="inline-flex items-center gap-2 bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : "Submit report"}</button></footer>
          </form>
        </section>
      </div>,
      document.body,
    )}
  </>;
};

export default NotificationItem;
