"use client";

import { FormEvent, useEffect, useState } from "react";
import AnalyticsChart from "@/src/components/pages/AnalyticsChart";

const API = process.env.NEXT_PUBLIC_APP_URL || "";
const inr = (value: string | number) => "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.amount || "Request failed.");
  return data;
}

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutNextOffset, setPayoutNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [upi, setUpi] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const token = localStorage.getItem("mentorToken");
    if (!token) throw new Error("Your instructor session has expired. Sign in again.");
    const headers = { Authorization: "Bearer " + token };
    const responses = await Promise.all([
      fetch(API + "/api/instructors/courses/earnings/?limit=100", { headers, cache: "no-store" }),
      fetch(API + "/api/instructors/courses/payouts/?limit=100", { headers, cache: "no-store" }),
    ]);
    setData(await readJson(responses[0]));
    const payoutData = await readJson(responses[1]);
    setPayouts(payoutData.results || []);
    setPayoutNextOffset(payoutData.next_offset ?? null);
  };

  useEffect(() => { load().catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);

  const requestWithdrawal = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(API + "/api/instructors/courses/earnings/", {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("mentorToken"), "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: "upi", beneficiary_name: beneficiary, destination_details: { upi_id: upi } }),
      });
      const result = await readJson(response);
      setAmount(""); setBeneficiary(""); setUpi(""); setShowRequest(false);
      setNotice(`Withdrawal request ${result.request?.request_id ? `#${result.request.request_id.slice(0, 8)} ` : ""}was sent to the admin for review.`);
      try { await load(); }
      catch { setError("Your request was submitted, but the dashboard could not refresh. Reload the page to see the latest balance and history."); }
    } catch (err: any) { setError(err.message || "Could not submit withdrawal request."); }
    finally { setBusy(false); }
  };

  const loadMoreInvoices = async () => {
    const offset = data?.invoices?.next_offset;
    if (offset == null) return;
    const token = localStorage.getItem("mentorToken");
    const response = await fetch(API + "/api/instructors/courses/earnings/?limit=100&offset=" + offset, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    const next = await readJson(response);
    setData((current: any) => ({ ...next, invoices: { ...next.invoices, results: [...(current?.invoices?.results || []), ...(next.invoices?.results || [])] } }));
  };

  const loadMorePayouts = async () => {
    if (payoutNextOffset == null) return;
    const response = await fetch(API + "/api/instructors/courses/payouts/?limit=100&offset=" + payoutNextOffset, { headers: { Authorization: "Bearer " + localStorage.getItem("mentorToken") }, cache: "no-store" });
    const next = await readJson(response);
    setPayouts((current) => [...current, ...(next.results || [])]);
    setPayoutNextOffset(next.next_offset ?? null);
  };

  if (loading) return <div className="border bg-white p-8 text-sm text-slate-500">Loading earnings…</div>;
  const summary = data?.summary;
  const balance = summary?.balance;
  const available = Number(balance?.available || 0);
  const invoices = data?.invoices?.results || [];
  const chartData = (summary?.series || []).map((row: any) => ({ date: row.label, revenue: row.gross }));
  const metrics = [{ key: "revenue", label: "Revenue", color: "#185FA5", format: (value: number) => inr(value) }];
  const stats = [
    ["Today’s sales", summary?.today?.sales + " sales", inr(summary?.today?.amount)],
    ["This week", summary?.week?.sales + " sales", inr(summary?.week?.amount)],
    ["This month", summary?.month?.sales + " sales", inr(summary?.month?.amount)],
    ["Lifetime revenue", summary?.lifetime?.sales + " sales", inr(summary?.lifetime?.amount)],
    ["Available to withdraw", "Minimum ₹1,000", inr(balance?.available)],
  ];

  return <div className="space-y-6">
    <header className="relative flex flex-col gap-5 overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Instructor finance</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Earnings</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Track course sales, learner activity, invoices, and payout requests in one place.</p></div>
      <div className="relative z-10 flex flex-col gap-2 sm:items-end"><p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Available to withdraw</p><p className="text-2xl font-bold">{inr(available)}</p><button type="button" onClick={() => setShowRequest((value) => !value)} disabled={available < 1000} className="mt-1 border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white">{available >= 1000 ? "Request withdrawal" : "₹1,000 minimum to withdraw"}</button></div>
      <div aria-hidden="true" className="absolute -right-16 -top-24 h-72 w-72 border border-white/10" />
    </header>
    {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {showRequest && <form onSubmit={requestWithdrawal} className="grid gap-4 border border-indigo-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Payout request</p><h2 className="mt-1 text-lg font-semibold text-slate-900">Send funds to your UPI account</h2><p className="mt-1 text-sm text-slate-600">Minimum request ₹1,000 · Available balance {inr(available)}</p></div>
      <label className="text-sm font-medium">Amount (INR)<input type="number" min="1000" step="0.01" max={available} required value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 block w-full border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium">Beneficiary name<input required maxLength={120} value={beneficiary} onChange={(event) => setBeneficiary(event.target.value)} className="mt-1 block w-full border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-medium sm:col-span-2">UPI ID<input required pattern="[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}" title="Enter a valid UPI ID, for example name@upi" placeholder="name@upi" value={upi} onChange={(event) => setUpi(event.target.value)} className="mt-1 block w-full border px-3 py-2 font-normal" /></label>
      <p className="border-l-2 border-indigo-500 bg-indigo-50 px-4 py-3 text-xs leading-5 text-slate-600 sm:col-span-2">The requested amount is reserved while the admin processes it. Your payout history updates when the transfer is marked successful.</p>
      <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="border bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit request"}</button><button type="button" onClick={() => setShowRequest(false)} className="border px-4 py-2 text-sm">Cancel</button></div>
    </form>}

    <section aria-label="Sales overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.filter(([label]) => label !== "Available to withdraw").map(([label, sales, value], index) => <article key={label} className="border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><span className={`h-2 w-2 ${index === 0 ? "bg-emerald-500" : "bg-indigo-500"}`} /></div><p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{sales}</p></article>)}</section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Total enrollments", data?.engagement?.total_enrollments], ["Unique students", data?.engagement?.unique_students], ["Enrollments this month", data?.engagement?.month_enrollments], ["Pending withdrawal", inr(balance?.pending_withdrawal)],
    ].map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{value ?? 0}</p></article>)}</section>
    <section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-bold text-slate-950">Revenue trend</h2><p className="mt-1 text-sm text-slate-500">Monthly sales after discounts</p></div><span className="border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">Last 12 months</span></div><AnalyticsChart data={chartData} metrics={metrics} defaultPeriod="1y" xAxisDataKey="date" height={300} /></section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Sales and invoices</h2><p className="text-sm text-slate-500">Student, course, discount, invoice, and learning progress details.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Date / invoice", "Course", "Student", "List price", "Discount", "Paid", "Payment reference", "Progress"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead>
      <tbody className="divide-y">{invoices.map((row: any) => <tr key={row.invoice_id}><td className="whitespace-nowrap px-4 py-3">{new Date(row.issued_at).toLocaleDateString("en-IN")}<div className="text-xs text-slate-500">{row.invoice_number}</div></td><td className="px-4 py-3">{row.course_title}</td><td className="px-4 py-3">{row.student_name}<div className="text-xs text-slate-500">{row.student_email}</div></td><td className="whitespace-nowrap px-4 py-3">{inr(row.list_amount)}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.discount_amount)}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{inr(row.paid_amount)}</td><td className="px-4 py-3 text-xs">{row.payment_id || "—"}</td><td className="px-4 py-3">{row.progress}%</td></tr>)}{!invoices.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No paid course invoices yet.</td></tr>}</tbody>
    </table></div>{data?.invoices?.next_offset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMoreInvoices()} className="border px-4 py-2 text-sm font-medium">Load more invoices</button></div>}</section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Promotion campaign invoices</h2><p className="text-sm text-slate-500">Paid campaign budget, coupon discount, verified ad clicks, and remaining balance.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Date / invoice", "Campaign / course", "Budget", "Coupon discount", "Paid", "CPC / clicks", "Click spend", "Remaining", "Payment reference"].map((title) => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{(data?.promotion_invoices || []).map((row: any) => <tr key={row.invoice_id}><td className="whitespace-nowrap px-4 py-3">{new Date(row.issued_at).toLocaleDateString("en-IN")}<div className="text-xs text-slate-500">{row.invoice_number}</div></td><td className="px-4 py-3">{row.campaign_name}<div className="text-xs text-slate-500">{row.course_title}</div></td><td className="whitespace-nowrap px-4 py-3">{inr(row.budget_amount)}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.discount_amount)}{row.coupon_code ? <div className="text-xs text-slate-500">{row.coupon_code}</div> : null}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{inr(row.paid_amount)}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.cpc_amount)} / {row.clicks}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.spent_amount)}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.remaining_amount)}</td><td className="px-4 py-3 text-xs">{row.payment_id || "—"}</td></tr>)}{!(data?.promotion_invoices || []).length && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No campaign invoices yet.</td></tr>}</tbody></table></div></section>

    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Withdrawal history</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Requested", "Amount", "UPI", "Status", "Reference / note"].map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y">{payouts.map((payout) => <tr key={payout.request_id}><td className="px-4 py-3">{new Date(payout.created_at).toLocaleDateString("en-IN")}</td><td className="px-4 py-3 font-semibold">{inr(payout.amount)}</td><td className="px-4 py-3">{payout.destination?.upi_id}</td><td className="px-4 py-3 capitalize">{payout.status}</td><td className="px-4 py-3">{payout.payment_reference || payout.admin_note || "—"}</td></tr>)}{!payouts.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No withdrawal requests.</td></tr>}</tbody></table></div>{payoutNextOffset != null && <div className="border-t p-3 text-right"><button onClick={() => void loadMorePayouts()} className="border px-4 py-2 text-sm font-medium">Load more history</button></div>}</section>
  </div>;
}
