"use client";

import { useCallback, useEffect, useState } from "react";
import AnalyticsChart from "@/src/components/pages/AnalyticsChart";

const API = (process.env.NEXT_PUBLIC_APP_URL || "https://api.gocyn.com").replace(/\/+$/, "");
const inr = (value: string | number) => "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail || data.message;
    throw new Error(detail || `Request failed (${response.status}) at ${response.url}`);
  }
  return data;
}

export default function AdminEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutNextOffset, setPayoutNextOffset] = useState<number | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) throw new Error("Admin session expired. Sign in again.");
    const headers = { Authorization: "Bearer " + token };
    const query = new URLSearchParams({ limit: "100", course_limit: "100", instructor_limit: "100" });
    if (selectedInstructor) query.set("instructor_id", selectedInstructor);
    const responses = await Promise.all([
      fetch(API + "/api/admin/earnings/?" + query.toString(), { headers, cache: "no-store" }),
      fetch(API + "/api/admin/payouts/?limit=100", { headers, cache: "no-store" }),
    ]);
    setData(await readJson(responses[0]));
    const payoutData = await readJson(responses[1]);
    setPayouts(payoutData.results || []);
    setPayoutNextOffset(payoutData.next_offset ?? null);
    setPayoutSummary(payoutData.summary);
  }, [selectedInstructor]);

  useEffect(() => { load().catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [load]);

  const update = async (payout: any, status: string) => {
    let payment_reference = "";
    let admin_note = "";
    if (status === "paid") { payment_reference = window.prompt("Enter the successful UPI transaction reference:") || ""; if (!payment_reference.trim()) return; }
    if (status === "rejected") { admin_note = window.prompt("Enter the rejection reason:") || ""; if (!admin_note.trim()) return; }
    setBusy(payout.request_id); setError("");
    try {
      const response = await fetch(API + "/api/admin/payouts/" + payout.request_id + "/", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + localStorage.getItem("adminToken"), "Content-Type": "application/json" },
        body: JSON.stringify({ status, payment_reference, admin_note }),
      });
      await readJson(response); await load();
    } catch (err: any) { setError(err.message || "Could not update payout."); }
    finally { setBusy(null); }
  };

  const removeHistory = async (payout: any) => {
    if (!window.confirm("Remove this payout from active history? The audit record will be retained.")) return;
    setBusy(payout.request_id);
    try {
      const response = await fetch(API + "/api/admin/payouts/" + payout.request_id + "/", { method: "DELETE", headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") } });
      if (!response.ok) await readJson(response);
      await load();
    } catch (err: any) { setError(err.message || "Could not remove payout history."); }
    finally { setBusy(null); }
  };

  const loadMoreInvoices = async () => {
    const offset = data?.invoices?.next_offset;
    if (offset == null) return;
    const query = new URLSearchParams({ limit: "100", offset: String(offset), course_limit: "100", instructor_limit: "100" });
    if (selectedInstructor) query.set("instructor_id", selectedInstructor);
    const response = await fetch(API + "/api/admin/earnings/?" + query.toString(), { headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }, cache: "no-store" });
    const next = await readJson(response);
    setData((current: any) => ({ ...next, invoices: { ...next.invoices, results: [...(current?.invoices?.results || []), ...(next.invoices?.results || [])] }, courses: current?.courses }));
  };

  const loadMoreCourses = async () => {
    const offset = data?.courses?.next_offset;
    if (offset == null) return;
    const query = new URLSearchParams({ limit: "100", course_limit: "100", course_offset: String(offset), instructor_limit: "100" });
    if (selectedInstructor) query.set("instructor_id", selectedInstructor);
    const response = await fetch(API + "/api/admin/earnings/?" + query.toString(), { headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }, cache: "no-store" });
    const next = await readJson(response);
    setData((current: any) => ({ ...next, invoices: current?.invoices, courses: { ...next.courses, results: [...(current?.courses?.results || []), ...(next.courses?.results || [])] } }));
  };

  const loadMorePayouts = async () => {
    if (payoutNextOffset == null) return;
    const response = await fetch(API + "/api/admin/payouts/?limit=100&offset=" + payoutNextOffset, { headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }, cache: "no-store" });
    const next = await readJson(response);
    setPayouts((current) => [...current, ...(next.results || [])]);
    setPayoutNextOffset(next.next_offset ?? null);
  };

  const loadMoreInstructors = async () => {
    const offset = data?.instructor_performance?.next_offset;
    if (offset == null) return;
    const query = new URLSearchParams({ limit: "100", course_limit: "100", instructor_limit: "100", instructor_offset: String(offset) });
    if (selectedInstructor) query.set("instructor_id", selectedInstructor);
    const response = await fetch(API + "/api/admin/earnings/?" + query.toString(), { headers: { Authorization: "Bearer " + localStorage.getItem("adminToken") }, cache: "no-store" });
    const next = await readJson(response);
    setData((current: any) => ({ ...next, invoices: current?.invoices, courses: current?.courses, instructor_performance: { ...next.instructor_performance, results: [...(current?.instructor_performance?.results || []), ...(next.instructor_performance?.results || [])] } }));
  };

  if (loading) return <div className="border bg-white p-8 text-sm text-slate-500">Loading financial analytics…</div>;
  const summary = data?.summary;
  const invoices = data?.invoices?.results || [];
  const courses = data?.courses?.results || [];
  const instructors = data?.instructor_performance?.results || [];
  const selectedInstructorDetails = data?.selected_instructor;
  const reviews = data?.recent_reviews || [];
  const revenueChart = (summary?.series || []).map((row: any) => ({ date: row.label, revenue: row.gross }));
  const salesChart = (summary?.series || []).map((row: any) => ({ date: row.label, sales: row.sales }));
  const enrollmentChart = courses.slice(0, 12).map((row: any) => ({ course: row.title, enrollments: row.enrollments }));
  const reviewsChart = courses.filter((row: any) => row.review_count > 0).slice(0, 12).map((row: any) => ({ course: row.title, rating: row.average_rating }));
  return <main className="space-y-6">
    <header className="border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Finance operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Earnings and payouts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Monitor platform revenue, review instructor withdrawal requests, and audit paid course invoices.</p></header>
    {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="border border-indigo-200 bg-indigo-50/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">Instructor performance view</h2><p className="text-sm text-slate-600">Choose an instructor to filter revenue, courses, enrollments, and reviews.</p></div><select aria-label="Filter analytics by instructor" value={selectedInstructor} onChange={(event) => { setLoading(true); setError(""); setSelectedInstructor(event.target.value); }} className="min-w-64 border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All instructors</option>{instructors.map((item: any) => <option key={item.instructor_id} value={item.instructor_id}>{item.name} ({item.email})</option>)}</select></div>{selectedInstructorDetails && <p className="mt-3 border-t border-indigo-200 pt-3 text-sm font-semibold text-indigo-950">Showing {selectedInstructorDetails.name} · {selectedInstructorDetails.email} · <span className="capitalize">{selectedInstructorDetails.status}</span></p>}</section>
    <section className="border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="text-lg font-bold text-slate-950">Instructor comparison</h2><p className="mt-1 text-sm text-slate-500">Select an instructor to drill into their charts, courses, learner activity, and reviews.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Instructor", "Status", "Courses", "Enrollments", "Paid sales", "Revenue", "Reviews", "Avg rating", "View"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{instructors.map((item: any) => <tr key={item.instructor_id} className={selectedInstructor === item.instructor_id ? "bg-indigo-50" : ""}><td className="px-4 py-3"><div className="font-semibold">{item.name}</div><div className="text-xs text-slate-500">{item.email}</div></td><td className="px-4 py-3 capitalize">{item.status}</td><td className="px-4 py-3">{item.courses}</td><td className="px-4 py-3">{item.enrollments}</td><td className="px-4 py-3">{item.paid_sales}</td><td className="px-4 py-3 font-semibold">{inr(item.revenue)}</td><td className="px-4 py-3">{item.reviews}</td><td className="px-4 py-3">{item.average_rating ? item.average_rating + " / 5" : "—"}</td><td className="px-4 py-3"><button onClick={() => { setLoading(true); setError(""); setSelectedInstructor(item.instructor_id); }} className="border border-indigo-700 px-3 py-1.5 text-xs font-semibold text-indigo-700">View</button></td></tr>)}{!instructors.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No instructors found.</td></tr>}</tbody></table></div>{data?.instructor_performance?.next_offset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMoreInstructors()} className="border px-4 py-2 text-sm font-medium">Load more instructors</button></div>}</section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Today", summary?.today], ["This week", summary?.week], ["This month", summary?.month], ["This year", summary?.year], ["Lifetime", summary?.lifetime]].map(([label, value]: any) => <article key={label} className="border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label} revenue</p><p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{inr(value?.amount)}</p><p className="mt-1 text-xs text-slate-500">{value?.sales || 0} paid sales</p></article>)}</section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Total paid sales", summary?.total_sales], ["Total courses", data?.course_summary?.total_courses], ["Published courses", data?.course_summary?.published_courses], ["Total enrollments", data?.engagement?.total_enrollments], ["Unique learners", data?.engagement?.unique_students], ["Year enrollments", data?.engagement?.year_enrollments], ["Total reviews", data?.course_summary?.total_reviews], ["Average rating", (data?.course_summary?.average_rating || 0) + " / 5"], ["In-review courses", data?.course_summary?.in_review_courses]].map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{value || 0}</p></article>)}</section>
    <section className="grid gap-3 sm:grid-cols-3">{[["Pending payouts", payoutSummary?.pending], ["Processing payouts", payoutSummary?.processing], ["Paid payouts", payoutSummary?.paid]].map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{inr(value)}</p></article>)}</section>
    <section className="grid gap-4 xl:grid-cols-2"><article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-950">Monthly revenue</h2><AnalyticsChart data={revenueChart} metrics={[{ key: "revenue", label: "Revenue", color: "#185FA5", format: (value: number) => inr(value) }]} defaultPeriod="1y" xAxisDataKey="date" height={290} /></article><article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-950">Monthly paid sales</h2><AnalyticsChart data={salesChart} metrics={[{ key: "sales", label: "Paid sales", color: "#0F766E", format: (value: number) => value.toLocaleString("en-IN") }]} defaultPeriod="1y" xAxisDataKey="date" height={290} /></article></section>
    <section className="grid gap-4 xl:grid-cols-2"><article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="mb-3 text-lg font-bold text-slate-950">Top courses by enrollments</h2><AnalyticsChart data={enrollmentChart} metrics={[{ key: "enrollments", label: "Enrollments", color: "#4F46E5", format: (value: number) => value.toLocaleString("en-IN") }]} defaultChartType="bar" periodOptions={[]} xAxisDataKey="course" height={320} /></article><article className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="mb-3 text-lg font-bold text-slate-950">Course review ratings</h2>{reviewsChart.length ? <AnalyticsChart data={reviewsChart} metrics={[{ key: "rating", label: "Average rating", color: "#D97706", format: (value: number) => value.toFixed(2) + " / 5" }]} defaultChartType="bar" periodOptions={[]} xAxisDataKey="course" height={320} /> : <p className="py-12 text-center text-sm text-slate-500">No course reviews yet.</p>}</article></section>

    <section className="border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="text-lg font-bold text-slate-950">Course performance</h2><p className="mt-1 text-sm text-slate-500">Enrollment totals include free and paid learners; revenue and paid sales come from successful invoices.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Course", "Instructor", "Status", "Enrollments", "Paid sales", "Revenue", "Reviews", "Avg rating"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{courses.map((course: any) => <tr key={course.course_id}><td className="px-4 py-3 font-semibold">{course.title}</td><td className="px-4 py-3">{course.instructor_name}<div className="text-xs text-slate-500">{course.instructor_email}</div></td><td className="px-4 py-3 capitalize">{course.status.replaceAll("_", " ")}</td><td className="px-4 py-3">{course.enrollments}</td><td className="px-4 py-3">{course.paid_sales}</td><td className="px-4 py-3 font-semibold">{inr(course.revenue)}</td><td className="px-4 py-3">{course.review_count}</td><td className="px-4 py-3">{course.average_rating ? course.average_rating + " / 5" : "—"}</td></tr>)}{!courses.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No courses found.</td></tr>}</tbody></table></div>{data?.courses?.next_offset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMoreCourses()} className="border px-4 py-2 text-sm font-medium">Load more courses</button></div>}</section>

    <section className="border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="text-lg font-bold text-slate-950">Recent learner reviews</h2><p className="mt-1 text-sm text-slate-500">Latest written feedback and ratings across courses.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Date", "Course", "Learner", "Rating", "Review"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{reviews.map((review: any) => <tr key={review.review_id}><td className="whitespace-nowrap px-4 py-3">{new Date(review.created_at).toLocaleDateString("en-IN")}</td><td className="px-4 py-3">{review.course_title}</td><td className="px-4 py-3">{review.student_name}<div className="text-xs text-slate-500">{review.student_email}</div></td><td className="whitespace-nowrap px-4 py-3 font-semibold">{review.rating} / 5</td><td className="max-w-xl whitespace-pre-wrap px-4 py-3">{review.comment || "No written comment"}</td></tr>)}{!reviews.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No reviews have been submitted.</td></tr>}</tbody></table></div></section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Withdrawal requests</h2><p className="text-sm text-slate-500">Mark processing while paying; mark paid only after the UPI transfer succeeds.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Instructor", "Amount", "UPI destination", "Requested", "Status", "Actions"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">
      {payouts.map((payout) => <tr key={payout.request_id}><td className="px-4 py-3"><div className="font-semibold">{payout.instructor_name}</div><div className="text-xs text-slate-500">{payout.instructor_email}</div></td><td className="whitespace-nowrap px-4 py-3 font-semibold">{inr(payout.amount)}</td><td className="px-4 py-3">{payout.beneficiary_name}<div className="text-xs text-slate-500">{payout.destination?.upi_id}</div></td><td className="whitespace-nowrap px-4 py-3">{new Date(payout.created_at).toLocaleString("en-IN")}</td><td className="px-4 py-3 capitalize">{payout.status}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">
        {payout.status === "pending" && <button disabled={busy === payout.request_id} onClick={() => void update(payout, "processing")} className="border px-2 py-1 text-xs">Processing</button>}
        {["pending", "processing"].includes(payout.status) && <><button disabled={busy === payout.request_id} onClick={() => void update(payout, "paid")} className="border bg-emerald-700 px-2 py-1 text-xs text-white">Mark paid</button><button disabled={busy === payout.request_id} onClick={() => void update(payout, "rejected")} className="border px-2 py-1 text-xs text-red-700">Reject</button></>}
        <button disabled={busy === payout.request_id} onClick={() => void removeHistory(payout)} className="border px-2 py-1 text-xs">Remove history</button>
      </div></td></tr>)}{!payouts.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No withdrawal requests.</td></tr>}</tbody></table></div>{payoutNextOffset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMorePayouts()} className="border px-4 py-2 text-sm font-medium">Load more history</button></div>}</section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Campaigns", data?.promotion_summary?.campaigns], ["Ad impressions", data?.promotion_summary?.impressions], ["Paid ad clicks", data?.promotion_summary?.clicks], ["Click spend", inr(data?.promotion_summary?.click_spend_amount)], ["Campaign payments", inr(data?.promotion_summary?.collected_amount)]].map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{value ?? 0}</p>{label === "Ad impressions" && <p className="mt-1 text-xs text-slate-500">CTR {data?.promotion_summary?.click_through_rate ?? 0}%</p>}</article>)}</section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Promotion campaign invoices</h2><p className="text-sm text-slate-500">Paid budgets, coupon discounts, click delivery, billing address, and payment references.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Date / invoice", "Instructor", "Campaign / course", "Budget", "Coupon discount", "Paid", "Payment reference", "Billing address"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{(data?.promotion_invoices || []).map((row: any) => <tr key={row.invoice_id}><td className="whitespace-nowrap px-4 py-3">{new Date(row.issued_at).toLocaleDateString("en-IN")}<div className="text-xs text-slate-500">{row.invoice_number}</div></td><td className="px-4 py-3">{row.instructor_name}<div className="text-xs text-slate-500">{row.instructor_email}</div></td><td className="px-4 py-3">{row.campaign_name}<div className="text-xs text-slate-500">{row.course_title}</div></td><td className="whitespace-nowrap px-4 py-3">{inr(row.budget_amount)}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.discount_amount)}{row.coupon_code ? <div className="text-xs text-slate-500">{row.coupon_code}</div> : null}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{inr(row.paid_amount)}</td><td className="px-4 py-3 text-xs">{row.payment_id || "—"}</td><td className="px-4 py-3 text-xs">{row.billing_address?.full_name}<div>{row.billing_address?.city}, {row.billing_address?.country}</div></td></tr>)}{!(data?.promotion_invoices || []).length && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No campaign invoices have been paid.</td></tr>}</tbody></table></div></section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Paid course invoices</h2><p className="text-sm text-slate-500">Student, instructor, payment, discount, and enrollment progress details.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Date / invoice", "Instructor", "Course", "Student", "List price", "Discount", "Paid", "Payment reference", "Progress"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">
      {invoices.map((row: any) => <tr key={row.invoice_id}><td className="whitespace-nowrap px-4 py-3">{new Date(row.issued_at).toLocaleDateString("en-IN")}<div className="text-xs text-slate-500">{row.invoice_number}</div></td><td className="px-4 py-3">{row.instructor_name}<div className="text-xs text-slate-500">{row.instructor_email}</div></td><td className="px-4 py-3">{row.course_title}</td><td className="px-4 py-3">{row.student_name}<div className="text-xs text-slate-500">{row.student_email}</div></td><td className="px-4 py-3">{inr(row.list_amount)}</td><td className="px-4 py-3">{inr(row.discount_amount)}</td><td className="px-4 py-3 font-semibold">{inr(row.paid_amount)}</td><td className="px-4 py-3 text-xs">{row.payment_id || "—"}</td><td className="px-4 py-3">{row.progress}%</td></tr>)}{!invoices.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No paid course invoices.</td></tr>}</tbody></table></div>{data?.invoices?.next_offset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMoreInvoices()} className="border px-4 py-2 text-sm font-medium">Load more invoices</button></div>}</section>
  </main>;
}
