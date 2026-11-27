"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { authenticatedStudentFetch } from "@/src/lib/studentAuth";
import { useParams, useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000").replace(/\/+$/, "");
declare global { interface Window { Razorpay?: new (options: any) => { open: () => void; on: (event: string, callback: (response: any) => void) => void } } }
const initial = { full_name: "", email: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "India" };

export default function CourseCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [billing, setBilling] = useState(initial);
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  useEffect(() => { fetch(`${API}/api/courses/${id}/`).then(response => response.json()).then(setCourse).catch(() => setError("Course details could not be loaded.")); }, [id]);
  const validateCoupon = async () => {
    setError(""); setQuote(null);
    if (!code.trim()) return;
    const response = await authenticatedStudentFetch(API, `${API}/api/courses/${id}/coupon-quote/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coupon_code: code.trim() }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.coupon_code || data.detail || "Coupon could not be applied.");
    setQuote(data);
  };
  const pay = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token && !localStorage.getItem("refresh")) { router.push("/login"); return; }
      const orderResponse = await authenticatedStudentFetch(API, `${API}/api/courses/${id}/payment-order/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billing_address: billing, coupon_code: quote?.code || "" }) });
      const order = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok) throw new Error(order.detail || order.coupon_code || "Checkout could not be started.");
      if (order.enrolled === true) { setBusy(false); setPurchaseComplete(true); return; }
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => window.Razorpay ? resolve() : reject(new Error("Payment checkout did not load.")); script.onerror = () => reject(new Error("Payment checkout did not load.")); document.body.appendChild(script); });
      }
      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) throw new Error("Secure checkout could not load. Please retry.");
      const checkout = new RazorpayCheckout({ key: order.key_id, amount: order.amount, currency: order.currency, name: "Gocyn", description: order.course_name, order_id: order.order_id, prefill: { name: billing.full_name, email: billing.email, contact: billing.phone }, theme: { color: "#4338ca" }, handler: async (payment: any) => {
        try {
          const response = await authenticatedStudentFetch(API, `${API}/api/courses/${id}/payment-verify/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || result.enrolled !== true) { setError(result.detail || "Payment verification is pending. Please try again shortly."); setBusy(false); return; }
          setBusy(false);
          setPurchaseComplete(true);
        } catch {
          setError("Payment was received, but confirmation could not be loaded. Please retry verification from this checkout page.");
          setBusy(false);
        }
      }, modal: { ondismiss: () => setBusy(false) } });
      checkout.on("payment.failed", (failure: any) => { setError(failure?.error?.description || "Payment did not complete."); setBusy(false); });
      checkout.open();
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed."); setBusy(false); }
  };

  const price = Math.round(Number(course?.price || 0) * 100);
  const payable = quote?.payable_amount ?? price;
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-6xl"><Link href={`/course/${id}`} className="text-sm font-semibold text-indigo-700 underline">← Back to course</Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={pay} className="space-y-6 border border-slate-200 bg-white p-6 sm:p-8">
          <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Secure checkout</p><h1 className="mt-2 text-3xl font-bold">Billing details</h1><p className="mt-2 text-sm text-slate-600">{quote?.payable_amount === 0 ? "Your invoice will be created when you enroll." : "Your invoice will be created after payment is verified."}</p></div>
          {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">{Object.entries({ full_name: "Full name", email: "Email", phone: "Phone", address_line1: "Address line 1", address_line2: "Address line 2", city: "City", state: "State", postal_code: "Postal code", country: "Country" }).map(([key, label]) => <label key={key} className={`text-sm font-medium text-slate-700 ${key.startsWith("address") ? "sm:col-span-2" : ""}`}>{label}{key === "address_line2" && <span className="font-normal text-slate-500"> (optional)</span>}<input required={key !== "address_line2"} type={key === "email" ? "email" : "text"} value={(billing as any)[key]} onChange={event => setBilling(current => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-600" /></label>)}</div>
          <div className="border-t border-slate-200 pt-5"><label className="block text-sm font-semibold">Coupon code<div className="mt-2 flex gap-2"><input value={code} onChange={event => { setCode(event.target.value.toUpperCase()); setQuote(null); }} className="min-w-0 flex-1 border border-slate-300 px-3 py-2.5 uppercase" placeholder="Enter code"/><button type="button" onClick={() => void validateCoupon().catch(error => setError(error.message))} className="border border-slate-900 px-4 py-2 font-semibold hover:bg-slate-900 hover:text-white">Apply</button></div></label>{quote && <p className="mt-2 text-sm font-medium text-emerald-700">{quote.code} applied · ₹{(quote.discount_amount / 100).toFixed(2)} off</p>}</div>
          <button disabled={busy || !course} className="w-full bg-indigo-700 px-5 py-3.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">{busy ? "Starting secure payment…" : payable === 0 ? "Enroll for free" : `Pay ₹${(payable / 100).toFixed(2)}`}</button>
        </form>
        <aside className="h-fit border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold">Order summary</h2><p className="mt-4 border-b border-slate-200 pb-4 text-sm font-medium">{course?.title || "Loading course…"}</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>₹{(price / 100).toFixed(2)}</dd></div>{quote && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>−₹{(quote.discount_amount / 100).toFixed(2)}</dd></div>}<div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><dt>Total due</dt><dd>₹{(payable / 100).toFixed(2)}</dd></div></dl><p className="mt-5 text-xs leading-5 text-slate-500">{quote?.payable_amount === 0 ? "A downloadable invoice will be available in your profile after enrollment." : "A downloadable invoice will be available in your profile after payment is confirmed."}</p><Link href="/profile/invoices" className="mt-4 inline-block text-sm font-semibold text-indigo-700 underline">View my invoices</Link></aside>
      </div>
    </div>
    {purchaseComplete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="purchase-complete-title">
      <section className="relative w-full max-w-md border border-slate-200 bg-white p-7 shadow-2xl">
        <button type="button" onClick={() => setPurchaseComplete(false)} className="absolute right-4 top-4 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close purchase confirmation"><X size={18}/></button>
        <div className="flex h-12 w-12 items-center justify-center bg-emerald-100 text-emerald-700"><CheckCircle2 size={28}/></div>
        <h2 id="purchase-complete-title" className="mt-5 text-2xl font-bold text-slate-900">Purchase complete</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">You’re enrolled in {course?.title || "this course"}. Your course is ready to start.</p>
        <Link href={`/course/${id}/learn`} className="mt-6 inline-flex w-full items-center justify-center bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800">Start learning</Link>
        <Link href={`/course/${id}`} className="mt-3 inline-flex w-full items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to course details</Link>
      </section>
    </div>}
  </main>;
}
