"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AnalyticsChart from "@/src/components/pages/AnalyticsChart";

const API = process.env.APP_URL || "";
const inr = (value: string | number) => "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Could not load dashboard data.");
  return data;
}

export default function DashboardOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("mentorToken");
    if (!token) throw new Error("Your instructor session has expired. Sign in again.");
    const headers = { Authorization: "Bearer " + token };
    const responses = await Promise.all([
      fetch(API + "/api/instructors/courses/earnings/?limit=1&course_limit=12", { headers, cache: "no-store" }),
      fetch(API + "/api/instructors/courses/enrollments/?limit=6", { headers, cache: "no-store" }),
    ]);
    const dashboard = await readJson(responses[0]);
    const learnerData = await readJson(responses[1]);
    setOverview(dashboard);
    setEnrollments((learnerData.results || []).slice(0, 6));
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().catch((err) => { if (!cancelled) setError(err.message || "Could not load instructor dashboard."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  if (loading) return <div className="border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading your instructor overview…</div>;
  if (!overview) return <div className="space-y-4 border border-red-200 bg-white p-6"><p className="text-sm text-red-800">{error || "Dashboard data is unavailable."}</p><button type="button" onClick={() => { setLoading(true); setError(""); load().catch((err) => setError(err.message)).finally(() => setLoading(false)); }} className="border border-slate-300 px-4 py-2 text-sm font-semibold">Try again</button></div>;

  const summary = overview.summary || {};
  const engagement = overview.engagement || {};
  const courses = overview.courses?.results || [];
  const courseSummary = overview.course_summary || {};
  const reviews = overview.recent_reviews || [];
  const revenueData = (summary.series || []).map((item: any) => ({ date: item.label, revenue: item.gross }));
  const enrollmentData = (overview.enrollment_series || []).map((item: any) => ({ date: item.label, enrollments: item.enrollments }));
  const revenueMetrics = [{ key: "revenue", label: "Revenue", color: "#2563EB", format: (value: number) => inr(value) }];
  const enrollmentMetrics = [{ key: "enrollments", label: "Enrollments", color: "#0F766E", format: (value: number) => value.toLocaleString("en-IN") }];
  const cards = [
    ["Revenue this month", inr(summary.month?.amount), (summary.month?.sales || 0) + " paid sales"],
    ["Lifetime revenue", inr(summary.lifetime?.amount), (summary.lifetime?.sales || 0) + " paid sales"],
    ["Available to withdraw", inr(summary.balance?.available), "₹1,000 minimum withdrawal"],
    ["Learner enrollments", engagement.total_enrollments || 0, (engagement.month_enrollments || 0) + " this month"],
    ["Published courses", courseSummary.published_courses || 0, (courseSummary.total_courses || 0) + " total courses"],
    ["Learner rating", (courseSummary.average_rating || 0) + " / 5", (courseSummary.total_reviews || 0) + " reviews"],
  ];

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Instructor studio</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your teaching overview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Track course performance, learner activity, reviews, and earnings from one place.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/instructors/dashboard/programs" className="border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Manage courses</Link><Link href="/instructors/dashboard/earnings" className="border border-white bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100">View earnings</Link></div>
    </header>

    {error && <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Some dashboard information could not be refreshed: {error}</p>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, detail]) => <article key={label} className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>)}</section>

    <section className="grid gap-4 xl:grid-cols-2">
      <article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-3"><h2 className="text-lg font-bold text-slate-950">Monthly revenue</h2><p className="text-sm text-slate-500">Successful course payments after discounts</p></div><AnalyticsChart data={revenueData} metrics={revenueMetrics} defaultPeriod="1y" xAxisDataKey="date" height={300} /></article>
      <article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-3"><h2 className="text-lg font-bold text-slate-950">Monthly enrollments</h2><p className="text-sm text-slate-500">Free and paid enrollments across your courses</p></div><AnalyticsChart data={enrollmentData} metrics={enrollmentMetrics} defaultPeriod="1y" xAxisDataKey="date" height={300} /></article>
    </section>

    <section className="border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950">Course performance</h2><p className="text-sm text-slate-500">Enrollments, paid sales, revenue, and ratings by course.</p></div><Link href="/instructors/dashboard/programs" className="text-sm font-semibold text-indigo-700 underline">View all courses</Link></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Course", "Status", "Enrollments", "Paid sales", "Revenue", "Reviews"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{courses.map((course: any) => <tr key={course.course_id}><td className="px-4 py-3"><Link href={"/instructors/dashboard/programs/course/edit/" + course.course_id} className="font-semibold text-slate-900 underline decoration-transparent hover:decoration-current">{course.title}</Link></td><td className="px-4 py-3 capitalize">{course.status.replaceAll("_", " ")}</td><td className="px-4 py-3">{course.enrollments}</td><td className="px-4 py-3">{course.paid_sales}</td><td className="px-4 py-3 font-semibold">{inr(course.revenue)}</td><td className="px-4 py-3">{course.review_count}{course.average_rating ? " · " + course.average_rating + " / 5" : ""}</td></tr>)}{!courses.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No courses yet. Start by creating your first course.</td></tr>}</tbody></table></div></section>

    <section className="grid gap-4 xl:grid-cols-2">
      <article className="border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="text-lg font-bold text-slate-950">Recent enrollments</h2><p className="text-sm text-slate-500">Learners who recently joined your courses.</p></div><Link href="/instructors/dashboard/enrollments" className="text-sm font-semibold text-indigo-700 underline">All learners</Link></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Learner", "Course", "Date", "Progress"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{enrollments.map((student: any) => <tr key={student.id}><td className="px-4 py-3"><div className="font-semibold">{student.student}</div><div className="text-xs text-slate-500">{student.email}</div></td><td className="px-4 py-3">{student.course}</td><td className="whitespace-nowrap px-4 py-3">{new Date(student.date).toLocaleDateString("en-IN")}</td><td className="px-4 py-3">{student.progress}%</td></tr>)}{!enrollments.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No enrollments to show yet.</td></tr>}</tbody></table></div></article>

      <article className="border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="text-lg font-bold text-slate-950">Recent reviews</h2><p className="text-sm text-slate-500">Learner feedback on your courses.</p></div><Link href="/instructors/dashboard/programs" className="text-sm font-semibold text-indigo-700 underline">Manage courses</Link></div><div className="divide-y">{reviews.map((review: any) => <div key={review.review_id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{review.course_title}</p><p className="mt-1 text-xs text-slate-500">{review.student_name} · {new Date(review.created_at).toLocaleDateString("en-IN")}</p></div><span className="whitespace-nowrap border px-2 py-1 text-xs font-bold text-amber-700">{review.rating} / 5</span></div>{review.comment && <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>}</div>)}{!reviews.length && <p className="p-8 text-center text-sm text-slate-500">Course reviews will appear here as learners leave feedback.</p>}</div></article>
    </section>
  </div>;
}
