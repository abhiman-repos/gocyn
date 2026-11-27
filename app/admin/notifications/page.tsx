"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AlertTriangle, Bell, BookOpen, CalendarDays, CheckCheck, Eye, Info, Megaphone, MousePointerClick, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Metrics = {
  sent: number;
  delivered: number;
  clicked_notifications: number;
  clicks: number;
  unread: number;
  read: number;
  unread_rate: number;
  delivery_rate: number;
  click_through_rate: number;
};
type Daily = { day: string; sent: number; delivered: number; clicked_notifications: number; clicks: number; unread: number };
type Analytics = { generated_at: string; period_days: number; overall: Metrics; users: Metrics; instructors: Metrics; daily: Daily[]; by_type: Array<{ notification_type: string; sent: number; delivered: number; clicked: number; unread: number }> };
type Recipients = { users: number; instructors: number; all: number };
type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
type NotificationReportRow = {
  id: number; notification_id: number; notification_title: string; notification_message: string;
  reporter_email: string; reporter_type: "user" | "instructor"; reason: string; reason_label: string;
  feedback: string; status: ReportStatus; admin_note: string; created_at: string;
};
type IconName = "bell" | "megaphone" | "calendar" | "book" | "sparkles" | "info" | "alert";
const iconChoices: Array<{ id: IconName; label: string; Icon: typeof Bell }> = [
  { id: "bell", label: "Bell", Icon: Bell }, { id: "megaphone", label: "Announcement", Icon: Megaphone },
  { id: "calendar", label: "Event", Icon: CalendarDays }, { id: "book", label: "Course", Icon: BookOpen },
  { id: "sparkles", label: "Highlight", Icon: Sparkles }, { id: "info", label: "Info", Icon: Info },
  { id: "alert", label: "Important", Icon: AlertTriangle },
];

const emptyMetrics: Metrics = { sent: 0, delivered: 0, clicked_notifications: 0, clicks: 0, unread: 0, read: 0, unread_rate: 0, delivery_rate: 0, click_through_rate: 0 };
const number = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);
const API_BASE = (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://api.gocyn.com" : "http://localhost:8000")).replace(/\/+$/, "");
const fieldClass = "mt-2 block w-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";

export default function AdminNotificationAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [recipients, setRecipients] = useState<Recipients | null>(null);
  const [audience, setAudience] = useState<"users" | "instructors" | "all">("all");
  const [notificationType, setNotificationType] = useState("announcement");
  const [icon, setIcon] = useState<IconName>("megaphone");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async (manual = false) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/notification-analytics/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        router.replace("/admin/login");
        return;
      }
      if (!response.ok) throw new Error(body.detail || "Could not load notification analytics.");
      setData(body as Analytics);
    } catch (loadError: any) {
      setError(loadError.message || "Could not load notification analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const loadRecipients = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const response = await fetch(`${API_BASE}/api/admin/notifications/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(body.detail || "Could not load recipient counts.");
      setRecipients(body as Recipients);
    } catch (loadError: any) { setFormError(loadError.message || "Could not load recipient counts."); }
  }, [router]);

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) { setImage(null); setImagePreview(""); return; }
    if (!selected.type.startsWith("image/")) { setFormError("Choose an image file."); event.target.value = ""; return; }
    if (selected.size > 5 * 1024 * 1024) { setFormError("Image must be 5 MB or smaller."); event.target.value = ""; return; }
    setFormError(""); setImage(selected); setImagePreview(URL.createObjectURL(selected));
  };

  const submitNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFormError(""); setSuccess("");
    if (!recipients) { setFormError("Recipient totals are still loading. Try again in a moment."); return; }
    const count = recipients[audience];
    if (!count) { setFormError("There are no eligible recipients in this audience."); return; }
    if (!window.confirm(`Send this notification to ${number(count)} ${audience === "all" ? "users and instructors" : audience}?`)) return;
    const token = localStorage.getItem("adminToken");
    if (!token) { router.replace("/admin/login"); return; }
    const payload = new FormData();
    payload.set("title", title); payload.set("message", message); payload.set("audience", audience);
    payload.set("notification_type", notificationType); payload.set("icon", icon); payload.set("redirect_url", redirectUrl);
    if (image) payload.set("image", image);
    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/notifications/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: payload,
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(body.detail || "Could not send notification.");
      setSuccess(`Notification sent to ${number(body.created_count)} recipients.`);
      setTitle(""); setMessage(""); setRedirectUrl(""); setImage(null); setImagePreview("");
      const input = document.getElementById("notification-image") as HTMLInputElement | null;
      if (input) input.value = "";
      await Promise.all([loadRecipients(), load(true)]);
    } catch (submitError: any) { setFormError(submitError.message || "Could not send notification."); }
    finally { setSending(false); }
  };

  const recipientCount = recipients?.[audience] ?? 0;
  const SelectedIcon = iconChoices.find((choice) => choice.id === icon)?.Icon ?? Bell;

  const peak = useMemo(() => Math.max(1, ...(data?.daily.map((day) => Math.max(day.sent, day.clicks)) ?? [])), [data]);

  if (loading) return <div className="space-y-5"><div className="h-9 w-72 animate-pulse bg-gray-200" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse border bg-white" />)}</div></div>;

  if (error && !data) return <section className="border border-red-200 bg-white p-6"><h1 className="text-xl font-bold text-gray-950">Notification analytics</h1><p role="alert" className="mt-2 text-sm text-red-700">{error}</p><button onClick={() => void load(true)} className="mt-4 border border-gray-300 px-4 py-2 text-sm font-semibold">Retry</button></section>;

  const overall = data?.overall ?? emptyMetrics;
  const audienceRows = [
    { label: "Learners", values: data?.users ?? emptyMetrics, accent: "border-blue-600" },
    { label: "Instructors", values: data?.instructors ?? emptyMetrics, accent: "border-violet-600" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Engagement analytics</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Notification performance</h1><p className="mt-1 text-sm text-gray-500">Delivery and engagement across learner and instructor accounts.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => { const next = !showComposer; setShowComposer(next); setSuccess(""); if (next) void loadRecipients(); }} className="inline-flex items-center justify-center gap-2 bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"><Send className="h-4 w-4" />Create notification</button><button onClick={() => setShowReports((shown) => !shown)} aria-expanded={showReports} className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"><AlertTriangle className="h-4 w-4" />User reports</button><button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button></div>
      </header>
      {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {showReports && <NotificationReportsPanel onClose={() => setShowReports(false)} />}

      {showComposer && <section className="overflow-hidden border border-indigo-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-indigo-50/60 px-5 py-4 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Compose and send</p><h2 className="mt-1 text-xl font-bold text-gray-950">New notification</h2><p className="mt-1 text-sm text-gray-600">Send an in-app message to learners, instructors, or both.</p></div><button type="button" onClick={() => setShowComposer(false)} aria-label="Close notification form" className="rounded-full p-2 text-gray-500 hover:bg-white"><X className="h-5 w-5" /></button></div>
        <form onSubmit={submitNotification} className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-gray-800">Send to<select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className={fieldClass}><option value="all">Users and instructors</option><option value="users">Users only</option><option value="instructors">Instructors only</option></select></label><label className="block text-sm font-semibold text-gray-800">Notification type<select value={notificationType} onChange={(e) => setNotificationType(e.target.value)} className={fieldClass}><option value="announcement">Announcement</option><option value="event">Event</option><option value="course">Course</option><option value="promotion">Promotion</option><option value="account">Account</option><option value="system">System</option></select></label></div>
            <label className="block text-sm font-semibold text-gray-800">Title<input required maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: New workshop this Friday" className={fieldClass} /><span className="mt-1 block text-xs font-normal text-gray-400">Up to 180 characters</span></label>
            <label className="block text-sm font-semibold text-gray-800">Message<textarea required maxLength={1000} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share the details recipients need to know." className={`${fieldClass} resize-y`} /><span className="mt-1 block text-right text-xs font-normal text-gray-400">{message.length}/1000</span></label>
            <fieldset><legend className="text-sm font-semibold text-gray-800">Choose an icon</legend><div className="mt-2 flex flex-wrap gap-2">{iconChoices.map(({ id, label, Icon: ChoiceIcon }) => <button type="button" key={id} onClick={() => setIcon(id)} aria-pressed={icon === id} aria-label={label} title={label} className={`flex h-11 w-11 items-center justify-center border transition ${icon === id ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}><ChoiceIcon className="h-5 w-5" /></button>)}</div></fieldset>
            <label className="block text-sm font-semibold text-gray-800">Destination link <span className="font-normal text-gray-400">(optional, site path only)</span><input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="/courses or /events" pattern="/[^/].*|/" className={fieldClass} /></label>
            <div><label htmlFor="notification-image" className="block text-sm font-semibold text-gray-800">Image <span className="font-normal text-gray-400">(optional, up to 5 MB)</span></label><input id="notification-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImageChange} className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200" /></div>
          </div>
          <aside className="space-y-4"><div className="border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recipient preview</p><p className="mt-2 text-2xl font-bold text-gray-950">{recipients ? number(recipientCount) : "—"}</p><p className="text-sm text-gray-500">{audience === "all" ? "users and instructors" : audience}</p><p className="mt-2 text-xs text-gray-400">Only active accounts with in-app notifications enabled are included.</p></div>
            <div className="overflow-hidden border border-gray-200 bg-white"><div className="flex items-center gap-3 p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-indigo-700">{imagePreview ? <img src={imagePreview} alt="Notification preview" className="h-full w-full object-cover" /> : <SelectedIcon className="h-5 w-5" />}</div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Preview</p><p className="truncate text-sm font-bold text-gray-900">{title || "Notification title"}</p></div>{imagePreview && <button type="button" onClick={() => { setImage(null); setImagePreview(""); const input = document.getElementById("notification-image") as HTMLInputElement | null; if (input) input.value = ""; }} aria-label="Remove image" className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>}</div><div className="px-4 pb-4"><p className="line-clamp-3 text-sm text-gray-600">{message || "Your message will appear here."}</p></div></div>
            {formError && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}{success && <p role="status" className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}
            <button type="submit" disabled={sending || !recipients || recipientCount === 0} className="inline-flex w-full items-center justify-center gap-2 bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{sending ? "Sending…" : `Send to ${number(recipientCount)}`}</button><p className="text-xs leading-5 text-gray-400">Sending creates one in-app notification per eligible recipient. Please review the audience and preview before sending.</p>
          </aside>
        </form>
      </section>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sent" value={overall.sent} detail="Notifications created" icon={<Send className="h-5 w-5" />} />
        <MetricCard label="Delivered" value={overall.delivered} detail={`${overall.delivery_rate}% delivery rate`} icon={<CheckCheck className="h-5 w-5" />} />
        <MetricCard label="Clicked" value={overall.clicked_notifications} detail={`${overall.clicks} total click events · ${overall.click_through_rate}% CTR`} icon={<MousePointerClick className="h-5 w-5" />} />
        <MetricCard label="Unread" value={overall.unread} detail={`${overall.unread_rate}% of sent notifications`} icon={<Eye className="h-5 w-5" />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {audienceRows.map(({ label, values, accent }) => (
          <article key={label} className={`border border-gray-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}>
            <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-gray-500" /><h2 className="text-lg font-bold text-gray-950">{label}</h2></div>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
              <MiniMetric label="Sent" value={values.sent} />
              <MiniMetric label="Delivered" value={values.delivered} />
              <MiniMetric label="Clicked notifications" value={values.clicked_notifications} />
              <MiniMetric label="Click events" value={values.clicks} />
              <MiniMetric label="Unread" value={values.unread} />
              <MiniMetric label="Read" value={values.read} />
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600"><span>Delivery rate <strong className="text-gray-900">{values.delivery_rate}%</strong></span><span>Click-through rate <strong className="text-gray-900">{values.click_through_rate}%</strong></span><span>Unread rate <strong className="text-gray-900">{values.unread_rate}%</strong></span></div>
          </article>
        ))}
      </section>

      <section className="border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end"><div><h2 className="text-lg font-bold text-gray-950">Daily activity</h2><p className="text-sm text-gray-500">Notifications sent and click events over the last {data?.period_days ?? 30} days.</p></div><div className="flex gap-4 text-xs text-gray-600"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 bg-blue-600" />Sent</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 bg-emerald-500" />Clicks</span></div></div>
        <div className="mt-5 flex h-56 items-end gap-1 overflow-x-auto border-b border-gray-200 px-1 pt-2">
          {(data?.daily ?? []).map((day) => {
            const sentHeight = Math.max(day.sent ? 4 : 0, (day.sent / peak) * 180);
            const clickHeight = Math.max(day.clicks ? 4 : 0, (day.clicks / peak) * 180);
            return <div key={day.day} title={`${day.day}: ${day.sent} sent, ${day.clicks} clicks`} className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-[180px] w-full items-end justify-center gap-0.5"><div className="w-2/5 bg-blue-600" style={{ height: `${sentHeight}px` }} /><div className="w-2/5 bg-emerald-500" style={{ height: `${clickHeight}px` }} /></div>
              <span className="w-full truncate text-center text-[9px] text-gray-500">{new Date(`${day.day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>;
          })}
        </div>
        {!data?.daily.length && <p className="py-8 text-center text-sm text-gray-500">No notification activity in this period.</p>}
      </section>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4"><h2 className="text-lg font-bold text-gray-950">Performance by notification type</h2><p className="mt-1 text-sm text-gray-500">Compare which kinds of notifications are reaching and engaging recipients.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Sent</th><th className="px-5 py-3">Delivered</th><th className="px-5 py-3">Clicked</th><th className="px-5 py-3">Unread</th><th className="px-5 py-3">CTR</th></tr></thead><tbody className="divide-y divide-gray-100">{(data?.by_type ?? []).map((row) => <tr key={row.notification_type}><td className="px-5 py-3 font-medium text-gray-900">{row.notification_type.replaceAll("_", " ")}</td><td className="px-5 py-3">{number(row.sent)}</td><td className="px-5 py-3">{number(row.delivered)}</td><td className="px-5 py-3">{number(row.clicked)}</td><td className="px-5 py-3">{number(row.unread)}</td><td className="px-5 py-3">{row.delivered ? `${((row.clicked / row.delivered) * 100).toFixed(1)}%` : "—"}</td></tr>)}{!data?.by_type.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">No notification data yet.</td></tr>}</tbody></table></div>
      </section>
      <p className="text-right text-xs text-gray-400">Last updated {data?.generated_at ? new Date(data.generated_at).toLocaleString() : "—"}</p>
    </div>
  );
}

function NotificationReportsPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [reports, setReports] = useState<NotificationReportRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("open");
  const [openCount, setOpenCount] = useState(0);
  const [loadingReports, setLoadingReports] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [reportError, setReportError] = useState("");

  const loadReports = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.replace("/admin/login"); return; }
    setLoadingReports(true); setReportError("");
    try {
      const query = new URLSearchParams({ status: statusFilter, limit: "100" });
      const response = await fetch(`${API_BASE}/api/admin/notification-reports/?${query}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(body.detail || "Could not load user reports.");
      setReports((body.results ?? []) as NotificationReportRow[]);
      setOpenCount(body.open_count ?? 0);
    } catch (loadError: any) { setReportError(loadError.message || "Could not load user reports."); }
    finally { setLoadingReports(false); }
  }, [router, statusFilter]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const saveReport = async (id: number, status: ReportStatus, adminNote: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.replace("/admin/login"); return; }
    setSavingId(id); setReportError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/notification-reports/${id}/`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: adminNote }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(body.detail || "Could not save the report review.");
      await loadReports();
    } catch (saveError: any) { setReportError(saveError.message || "Could not save the report review."); }
    finally { setSavingId(null); }
  };

  return (
    <section className="border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Trust and feedback</p><h2 className="mt-1 text-lg font-bold text-gray-950">Notification reports <span className="ml-1 text-sm font-medium text-gray-500">{openCount} open</span></h2><p className="mt-1 text-sm text-gray-500">Review recipient feedback and record the resolution for your admin team.</p></div>
        <div className="flex items-center gap-2"><label className="sr-only" htmlFor="notification-report-status">Filter reports</label><select id="notification-report-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="all">All reports</option></select><button type="button" onClick={onClose} aria-label="Close reports" className="border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"><X className="h-4 w-4" /></button></div>
      </header>
      {reportError && <p role="alert" className="m-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{reportError}</p>}
      {loadingReports ? <p className="px-5 py-10 text-center text-sm text-gray-500">Loading reports…</p> : reports.length === 0 ? <div className="px-5 py-12 text-center"><CheckCheck className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-2 font-semibold text-gray-900">No {statusFilter === "all" ? "reports" : statusFilter + " reports"}</p><p className="mt-1 text-sm text-gray-500">Reports submitted by users and instructors will appear here.</p></div> : <div className="divide-y divide-gray-200">{reports.map((report) => <ReportReviewCard key={report.id} report={report} saving={savingId === report.id} onSave={saveReport} />)}</div>}
    </section>
  );
}

function ReportReviewCard({ report, saving, onSave }: { report: NotificationReportRow; saving: boolean; onSave: (id: number, status: ReportStatus, adminNote: string) => Promise<void> }) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [adminNote, setAdminNote] = useState(report.admin_note);
  const statusTone: Record<ReportStatus, string> = { open: "bg-amber-50 text-amber-800", reviewing: "bg-blue-50 text-blue-800", resolved: "bg-emerald-50 text-emerald-800", dismissed: "bg-gray-100 text-gray-700" };
  return <article className="p-5 sm:p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-950">{report.notification_title || "Notification report"}</h3><span className={`px-2 py-0.5 text-xs font-semibold capitalize ${statusTone[report.status]}`}>{report.status}</span></div><p className="mt-1 text-xs text-gray-500">Report #{report.id} · Notification #{report.notification_id} · {report.reporter_type} · {report.reporter_email || "Account removed"} · {new Date(report.created_at).toLocaleString()}</p></div><span className="w-fit border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">{report.reason_label}</span></div>
    <blockquote className="mt-4 border-l-2 border-gray-200 pl-3 text-sm leading-6 text-gray-600">“{report.notification_message}”</blockquote>
    <div className="mt-4 bg-amber-50/70 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Recipient feedback</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{report.feedback}</p></div>
    <div className="mt-4 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)_auto] md:items-end"><label className="block text-xs font-semibold text-gray-700">Review status<select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)} className="mt-1.5 block w-full border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900"><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label><label className="block text-xs font-semibold text-gray-700">Internal admin note<textarea rows={2} maxLength={2000} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Add an internal note or resolution summary…" className="mt-1.5 block w-full resize-y border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 placeholder:text-gray-400" /></label><button type="button" onClick={() => void onSave(report.id, status, adminNote)} disabled={saving} className="bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">{saving ? "Saving…" : "Save review"}</button></div>
  </article>;
}

function MetricCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return <article className="border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500">{label}</p><span className="text-indigo-700">{icon}</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{number(value)}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></article>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-950">{number(value)}</p></div>;
}
