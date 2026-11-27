"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeIndianRupee, CheckCircle2, Megaphone, ReceiptText } from "lucide-react";

const API = process.env.APP_URL || "";
const localInputDate = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const fmt = (date?: string) => date ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const inr = (paise: number) => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void; on: (event: string, callback: (response: any) => void) => void };
  }
}

const emptyAddress = { full_name: "", email: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "India" };

export default function InstructorCampaignsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("199");
  const [startsAt, setStartsAt] = useState(() => localInputDate(new Date(Date.now() + 10 * 60000)));
  const [endsAt, setEndsAt] = useState(() => localInputDate(new Date(Date.now() + 7 * 86400000)));
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [address, setAddress] = useState(emptyAddress);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const token = () => localStorage.getItem("mentorToken") || "";
  const load = useCallback(async () => {
    const auth = token();
    if (!auth) throw new Error("Instructor sign-in required.");
    const headers = { Authorization: `Bearer ${auth}` };
    const [coursesRes, campaignsRes, pricingRes] = await Promise.all([
      fetch(`${API}/api/instructors/courses/`, { headers, cache: "no-store" }),
      fetch(`${API}/api/instructors/courses/campaigns/`, { headers, cache: "no-store" }),
      fetch(`${API}/api/instructors/courses/campaigns/pricing/`, { headers, cache: "no-store" }),
    ]);
    const [coursesData, campaignsData, pricingData] = await Promise.all([
      coursesRes.json().catch(() => ({})), campaignsRes.json().catch(() => ({})), pricingRes.json().catch(() => ({})),
    ]);
    if (!coursesRes.ok) throw new Error(coursesData.detail || "Could not load instructor courses.");
    if (!campaignsRes.ok) throw new Error(campaignsData.detail || campaignsData.message || `Could not load campaigns (HTTP ${campaignsRes.status}).`);
    if (!pricingRes.ok) throw new Error(pricingData.detail || "Campaign pricing could not be loaded.");
    setCourses((Array.isArray(coursesData) ? coursesData : coursesData.results || []).filter((course: any) => course.status === "published"));
    setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    setPricing(pricingData);
  }, []);

  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [load]);

  const getQuote = async () => {
    setError(""); setQuote(null);
    const response = await fetch(`${API}/api/instructors/courses/campaigns/quote/`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId, budget_amount: budget, coupon_code: couponCode.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.budget_amount || data.coupon_code || "Could not calculate campaign price.");
    setQuote(data);
  };

  const openRazorpay = async (checkoutData: any) => {
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => window.Razorpay ? resolve() : reject(new Error("Secure payment checkout did not load."));
        script.onerror = () => reject(new Error("Secure payment checkout did not load."));
        document.body.appendChild(script);
      });
    }
    const Razorpay = window.Razorpay;
    if (!Razorpay) throw new Error("Secure payment checkout is unavailable.");
    const checkout = new Razorpay({
      key: checkoutData.key_id, amount: checkoutData.amount, currency: checkoutData.currency,
      name: "Gocyn Ads", description: `Campaign · ${checkoutData.campaign_name}`,
      order_id: checkoutData.order_id,
      prefill: { name: address.full_name, email: address.email, contact: address.phone },
      theme: { color: "#4338ca" },
      handler: async (payment: any) => {
        try {
          const response = await fetch(`${API}/api/instructors/courses/campaigns/${checkoutData.campaign_id}/verify-payment/`, {
            method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.detail || "Payment confirmation could not be completed.");
          setCampaigns(rows => [data, ...rows.filter(row => row.campaign_id !== data.campaign_id)]);
          setBusy(false);
          toast.success("Payment received. Your campaign is active for its scheduled dates.");
        } catch (e: any) {
          setBusy(false);
          setError(e.message || "Payment confirmation is pending. Retry from the campaign list.");
          void load().catch(() => undefined);
        }
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    checkout.on("payment.failed", (failure: any) => {
      setError(failure?.error?.description || "Campaign payment did not complete.");
      setBusy(false);
    });
    checkout.open();
  };

  const createCampaign = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/api/instructors/courses/campaigns/`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId, name: name.trim(), starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(), budget_amount: budget,
          coupon_code: couponCode.trim(), billing_address: address,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.name || data.budget_amount || data.coupon_code || "Campaign checkout could not start.");
      await load();
      await openRazorpay(data);
    } catch (e: any) { setError(e.message || "Campaign checkout could not start."); setBusy(false); }
  };

  const retryPayment = async (campaign: any) => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/api/instructors/courses/campaigns/${campaign.campaign_id}/retry-payment/`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not resume campaign checkout.");
      setAddress(campaign.payment?.billing_address || emptyAddress);
      await openRazorpay(data);
    } catch (e: any) { setError(e.message || "Could not resume campaign checkout."); setBusy(false); }
  };

  const pauseCampaign = async (campaign: any) => {
    try {
      const response = await fetch(`${API}/api/instructors/courses/campaigns/${campaign.campaign_id}/`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: "paused" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Campaign could not be paused.");
      setCampaigns(rows => rows.map(row => row.campaign_id === data.campaign_id ? data : row));
      toast.success("Campaign paused.");
    } catch (e: any) { toast.error(e.message || "Campaign could not be paused."); }
  };

  const impressions = campaigns.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
  const clicks = campaigns.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
  const spend = campaigns.reduce((sum, row) => sum + Number(row.spent_paise || 0), 0);
  const ctr = impressions ? (clicks * 100 / impressions).toFixed(2) : "0.00";
  if (loading) return <div className="border bg-white p-8 text-sm text-slate-500">Loading promotion analytics…</div>;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Course growth</p><h1 className="mt-2 text-3xl font-bold">Sponsored campaigns</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Promote published courses in learner recommendations. You pay for verified course clicks at the rate set by Gocyn.</p></div><button type="button" onClick={() => void load().catch(e => setError(e.message))} className="border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">Refresh</button></header>
    {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Campaigns", campaigns.length], ["Paid clicks", clicks.toLocaleString("en-IN")], ["Click-through rate", `${ctr}%`], ["Campaign spend", inr(spend)]].map(([label, value]) => <article key={String(label)} className="border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></article>)}</section>
    <form onSubmit={createCampaign} className="grid gap-4 border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700"><Megaphone size={15}/> Campaign setup</p><h2 className="mt-1 text-lg font-bold text-slate-950">Boost a published course</h2><p className="mt-1 text-sm text-slate-600">Campaigns are funded upfront and charged per verified click. They go live automatically after payment during the dates you choose.</p></div>
      <label className="text-sm font-medium text-slate-700">Published course<select required value={courseId} onChange={e => { setCourseId(e.target.value); setQuote(null); }} className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2.5"><option value="">Choose a course</option>{courses.map(course => <option key={course.course_id} value={course.course_id}>{course.title}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">Campaign name<input required maxLength={180} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Data Science launch" className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Starts on<input type="datetime-local" required min={localInputDate(new Date(Date.now() + 60000))} value={startsAt} onChange={e => { setStartsAt(e.target.value); setQuote(null); }} className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Stops on<input type="datetime-local" required min={startsAt} value={endsAt} onChange={e => { setEndsAt(e.target.value); setQuote(null); }} className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label>
      <label className="text-sm font-medium text-slate-700">Maximum campaign budget (INR)<div className="mt-1 flex"><span className="border border-r-0 border-slate-300 bg-slate-50 px-3 py-2.5">₹</span><input type="number" min={Number(pricing?.minimum_budget || 99)} step="0.01" required value={budget} onChange={e => { setBudget(e.target.value); setQuote(null); }} className="block w-full border border-slate-300 px-3 py-2.5" /></div><span className="mt-1 block text-xs font-normal text-slate-500">Minimum {inr(pricing?.minimum_budget_paise)} · {inr(pricing?.cpc_paise)} per verified click.</span></label>
      <label className="text-sm font-medium text-slate-700">Coupon code (optional)<div className="mt-1 flex gap-2"><input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setQuote(null); }} maxLength={40} placeholder="Enter coupon code" className="min-w-0 flex-1 border border-slate-300 px-3 py-2.5 uppercase"/><button type="button" disabled={!courseId || !budget} onClick={() => void getQuote().catch(e => setError(e.message))} className="border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Apply</button></div></label>
      {quote && <section className="border border-emerald-200 bg-emerald-50 p-4 text-sm sm:col-span-2"><div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 size={17}/> {quote.coupon_code ? `${quote.coupon_code} applied` : "Campaign estimate"}</div><div className="mt-3 grid gap-2 sm:grid-cols-4"><p>Budget: <strong>{inr(quote.budget_paise)}</strong></p><p>Cost per click: <strong>{inr(quote.cpc_paise)}</strong></p><p>Estimated clicks: <strong>up to {quote.estimated_clicks}</strong></p><p>Pay now: <strong>{inr(quote.payable_paise)}</strong></p></div>{quote.discount_paise > 0 && <p className="mt-2 text-xs text-emerald-800">Coupon discount: {inr(quote.discount_paise)}. Your campaign spend is still capped at the full budget.</p>}</section>}
      <div className="sm:col-span-2"><h3 className="font-semibold text-slate-900">Billing address</h3><p className="mt-1 text-xs text-slate-500">Used on your campaign invoice.</p></div>
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">{Object.entries({ full_name: "Full name", email: "Email", phone: "Phone", address_line1: "Address line 1", address_line2: "Address line 2", city: "City", state: "State", postal_code: "Postal code", country: "Country" }).map(([key, label]) => <label key={key} className={`text-sm font-medium text-slate-700 ${key.startsWith("address") ? "sm:col-span-2" : ""}`}>{label}{key === "address_line2" && <span className="font-normal text-slate-500"> (optional)</span>}<input required={key !== "address_line2"} type={key === "email" ? "email" : "text"} value={(address as any)[key]} onChange={e => setAddress(current => ({ ...current, [key]: e.target.value }))} className="mt-1 block w-full border border-slate-300 px-3 py-2.5" /></label>)}</div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button disabled={busy || !courses.length} className="inline-flex items-center gap-2 bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"><BadgeIndianRupee size={17}/>{busy ? "Starting secure checkout…" : `Pay ${quote ? inr(quote.payable_paise) : "and start campaign"}`}</button><p className="text-xs text-slate-500">Razorpay checkout · runs during its scheduled dates within the available budget</p>{!courses.length && <p className="text-xs text-slate-500">You need a published course before creating a campaign.</p>}</div>
    </form>
    <section className="border border-slate-200 bg-white"><div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-950">Campaign performance and invoices</h2><p className="mt-1 text-sm text-slate-500">Budget, billed clicks, CPC spend, payment and invoice records.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["Campaign / course", "Schedule", "Status", "Budget / CPC", "Clicks / spend", "Remaining", "Invoice", "Actions"].map(title => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{campaigns.map(row => <tr key={row.campaign_id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{row.name}</p><Link href={`/course/${row.course.course_id}`} className="text-xs text-indigo-700 underline">{row.course.title}</Link></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{fmt(row.starts_at)}<br/>to {fmt(row.ends_at)}</td><td className="px-4 py-3"><span className="border border-slate-200 px-2 py-1 text-xs capitalize">{row.status === "pending" ? "Awaiting admin review" : row.status.replaceAll("_", " ")}</span>{row.admin_note && <p className="mt-1 max-w-48 text-xs text-slate-500">{row.admin_note}</p>}</td><td className="whitespace-nowrap px-4 py-3">{inr(row.budget_paise)}<p className="text-xs text-slate-500">{inr(row.cpc_paise)} / click</p></td><td className="whitespace-nowrap px-4 py-3">{Number(row.clicks || 0).toLocaleString("en-IN")} clicks<p className="text-xs text-slate-500">{inr(row.spent_paise)}</p></td><td className="whitespace-nowrap px-4 py-3">{inr(row.remaining_paise)}</td><td className="whitespace-nowrap px-4 py-3">{row.payment?.invoice_number ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"><ReceiptText size={14}/>{row.payment.invoice_number}<span className="block text-slate-500">Paid {inr(row.payment.amount_paise)}</span></span> : row.payment?.status === "created" ? <button type="button" disabled={busy} onClick={() => void retryPayment(row)} className="border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">Resume payment</button> : "—"}</td><td className="px-4 py-3">{row.status === "active" && <button type="button" onClick={() => void pauseCampaign(row)} className="border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Pause</button>}</td></tr>)}{!campaigns.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No campaigns yet. Select a published course to get started.</td></tr>}</tbody></table></div></section>
  </div>;
}
