"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

const API = process.env.APP_URL || "";
const dateLabel = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [cpcAmount, setCpcAmount] = useState("5.00");
  const [minimumBudget, setMinimumBudget] = useState("99.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [savingPricing, setSavingPricing] = useState(false);
  const load = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) throw new Error("Admin sign-in required.");
    const headers = { Authorization: `Bearer ${token}` };
    const [response, pricingResponse] = await Promise.all([
      fetch(`${API}/api/admin/promotions/`, { headers, cache: "no-store" }),
      fetch(`${API}/api/admin/promotions/pricing/`, { headers, cache: "no-store" }),
    ]);
    const [data, pricingData] = await Promise.all([response.json().catch(() => ({})), pricingResponse.json().catch(() => ({}))]);
    if (!response.ok) throw new Error(data.detail || "Campaign analytics could not be loaded.");
    if (!pricingResponse.ok) throw new Error(pricingData.detail || "Campaign pricing could not be loaded.");
    setCampaigns(Array.isArray(data) ? data : []);
    setPricing(pricingData);
    setCpcAmount(pricingData.cpc_amount || "5.00");
    setMinimumBudget(pricingData.minimum_budget || "99.00");
  };
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);

  const updateStatus = async (campaign: any, status: "active" | "paused" | "rejected") => {
    setBusyId(campaign.campaign_id); setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const note = status === "rejected" ? window.prompt("Reason for rejection (optional):", campaign.admin_note || "") ?? campaign.admin_note : campaign.admin_note;
      const response = await fetch(`${API}/api/admin/promotions/${campaign.campaign_id}/`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ status, admin_note: note || "" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Campaign could not be updated.");
      setCampaigns((rows) => rows.map((row) => row.campaign_id === data.campaign_id ? data : row));
      toast.success(`Campaign ${status === "active" ? "approved" : status}.`);
    } catch (e: any) { setError(e.message || "Campaign could not be updated."); }
    finally { setBusyId(""); }
  };

  const savePricing = async (event: FormEvent) => {
    event.preventDefault(); setSavingPricing(true); setError("");
    try {
      const response = await fetch(`${API}/api/admin/promotions/pricing/`, {
        method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cpc_amount: cpcAmount, minimum_budget: minimumBudget }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.cpc_amount || data.minimum_budget || "Pricing could not be saved.");
      setPricing(data); setCpcAmount(data.cpc_amount); setMinimumBudget(data.minimum_budget);
      toast.success("Campaign pricing updated. Existing campaigns keep their original CPC.");
    } catch (e: any) { setError(e.message || "Pricing could not be saved."); }
    finally { setSavingPricing(false); }
  };

  const impressions = campaigns.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const clicks = campaigns.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const spent = campaigns.reduce((sum, row) => sum + Number(row.spent_paise || 0), 0);
  const collected = campaigns.reduce((sum, row) => sum + Number(row.payment?.amount_paise || 0), 0);
  const ctr = impressions ? (clicks * 100 / impressions).toFixed(2) : "0.00";
  const metrics = [["All campaigns", campaigns.length], ["Awaiting payment", campaigns.filter(row => row.status === "pending_payment").length], ["Landing impressions", impressions.toLocaleString("en-IN")], ["Paid clicks", clicks.toLocaleString("en-IN")], ["Click-through rate", `${ctr}%`], ["Collected", `₹${(collected / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`], ["Click spend", `₹${(spent / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]];
  return <div className="space-y-6">
    <header className="border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Growth management</p><h1 className="mt-2 text-3xl font-bold">Sponsored campaigns</h1><p className="mt-2 text-sm text-slate-300">Set the cost per click, monitor paid promotions and delivery, and pause campaigns when needed.</p></header>
    {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></article>)}</section>
    <form onSubmit={savePricing} className="grid gap-4 border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6"><div className="sm:col-span-3"><h2 className="font-bold text-slate-950">Campaign pricing</h2><p className="mt-1 text-sm text-slate-500">New campaigns take a snapshot of this CPC. Existing campaigns keep their contracted rate.</p></div><label className="text-sm font-medium text-slate-700">Price per verified click (INR)<input type="number" min="1" max="1000" step="0.01" required value={cpcAmount} onChange={e => setCpcAmount(e.target.value)} className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-medium text-slate-700">Minimum campaign budget (INR)<input type="number" min="99" step="0.01" required value={minimumBudget} onChange={e => setMinimumBudget(e.target.value)} className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label><button disabled={savingPricing} className="bg-indigo-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingPricing ? "Saving…" : "Save pricing"}</button></form>
    <section className="border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-5"><div><h2 className="font-bold text-slate-950">Campaign performance, invoices, and approvals</h2><p className="mt-1 text-sm text-slate-500">Campaigns spend budget only when a verified click is recorded.</p></div><button type="button" onClick={() => void load().catch(e => setError(e.message))} className="border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Refresh</button></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Campaign / course", "Instructor", "Schedule", "Status", "Budget / CPC", "Delivery", "Paid / invoice", "Actions"].map(title => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading campaign analytics…</td></tr> : campaigns.map(row => <tr key={row.campaign_id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{row.name}</p><Link href={`/course/${row.course.course_id}`} className="text-xs text-indigo-700 underline">{row.course.title}</Link></td><td className="px-4 py-3"><p>{row.course.instructor_name}</p><p className="text-xs text-slate-500">{row.course.instructor_email}</p></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{dateLabel(row.starts_at)}<br/>to {dateLabel(row.ends_at)}</td><td className="px-4 py-3"><span className="border border-slate-200 px-2 py-1 text-xs capitalize">{row.status === "pending" ? "Awaiting review" : row.status.replaceAll("_", " ")}</span>{row.admin_note && <p className="mt-1 max-w-48 text-xs text-slate-500">{row.admin_note}</p>}</td><td className="whitespace-nowrap px-4 py-3">₹{(row.budget_paise / 100).toFixed(2)}<p className="text-xs text-slate-500">₹{(row.cpc_paise / 100).toFixed(2)} / click</p></td><td className="whitespace-nowrap px-4 py-3">{row.impressions} views · {row.clicks} paid clicks<p className="text-xs text-slate-500">Spent ₹{(row.spent_paise / 100).toFixed(2)} · left ₹{(row.remaining_paise / 100).toFixed(2)}</p><p className="text-xs text-slate-500">CTR {Number(row.click_through_rate || 0).toFixed(2)}%</p></td><td className="whitespace-nowrap px-4 py-3">{row.payment?.invoice_number || "Payment pending"}<p className="text-xs text-slate-500">{row.payment?.amount_paise != null ? `Paid ₹${(row.payment.amount_paise / 100).toFixed(2)}` : ""}</p>{row.payment?.billing_address?.full_name && <p className="text-xs text-slate-500">{row.payment.billing_address.full_name} · {row.payment.billing_address.city}</p>}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{row.status === "pending" && row.payment?.status === "paid" && <button type="button" disabled={busyId === row.campaign_id} onClick={() => void updateStatus(row, "active")} className="bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button>}{row.status === "active" && <button type="button" disabled={busyId === row.campaign_id} onClick={() => void updateStatus(row, "paused")} className="border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Pause</button>}{row.status !== "rejected" && row.status !== "active" && <button type="button" disabled={busyId === row.campaign_id} onClick={() => void updateStatus(row, "rejected")} className="border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button>}</div></td></tr>)}{!loading && !campaigns.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No course campaigns have been submitted.</td></tr>}</tbody></table></div></section>
  </div>;
}
