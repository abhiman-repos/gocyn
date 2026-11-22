"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Eye, MousePointerClick, RefreshCw, Send } from "lucide-react";
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

const emptyMetrics: Metrics = { sent: 0, delivered: 0, clicked_notifications: 0, clicks: 0, unread: 0, read: 0, unread_rate: 0, delivery_rate: 0, click_through_rate: 0 };
const number = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

export default function AdminNotificationAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (manual = false) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notification-analytics/`, {
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
        <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
      </header>
      {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

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

function MetricCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return <article className="border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500">{label}</p><span className="text-indigo-700">{icon}</span></div><p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{number(value)}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></article>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-950">{number(value)}</p></div>;
}
