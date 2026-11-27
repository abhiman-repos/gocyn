"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Coupon = {
  coupon_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  course_id: string | null;
  active: boolean;
  expires_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
};

type CouponForm = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  course_id: string;
  expires_at: string;
  max_redemptions: string;
};

const API = (process.env.APP_URL || "http://localhost:8000").replace(/\/+$/, "");
const emptyForm: CouponForm = {
  code: "",
  discount_type: "percent",
  discount_value: "10",
  course_id: "",
  expires_at: "",
  max_redemptions: "",
};

async function responseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  if (typeof data.detail === "string") return data.detail;
  const fieldError = Object.values(data).flat().find(value => typeof value === "string");
  return typeof fieldError === "string" ? fieldError : fallback;
}

export default function CouponManager({ audience }: { audience: "admin" | "instructor" }) {
  const endpoint = audience === "admin" ? "/api/admin/coupons/" : "/api/instructors/courses/coupons/";
  const tokenKey = audience === "admin" ? "adminToken" : "mentorToken";
  const [rows, setRows] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) throw new Error("Sign in again to manage coupons.");
    return { Authorization: `Bearer ${token}` };
  }, [tokenKey]);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API}${endpoint}`, { headers: authHeaders(), cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response, "Coupons could not be loaded."));
      const data = await response.json();
      setRows(data.results || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Coupons could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endpoint]);

  useEffect(() => { void load(); }, [load]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          course_id: form.course_id || null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Coupon could not be created."));
      const coupon = await response.json();
      setRows(current => [coupon, ...current]);
      setForm(emptyForm);
      setNotice("Coupon created and ready to apply at checkout.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Coupon could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (coupon: Coupon) => {
    setError("");
    setNotice("");
    setActionId(coupon.coupon_id);
    try {
      const response = await fetch(`${API}${endpoint}${coupon.coupon_id}/`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Coupon status could not be changed."));
      const updated = await response.json();
      setRows(current => current.map(row => row.coupon_id === updated.coupon_id ? updated : row));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Coupon status could not be changed.");
    } finally {
      setActionId(null);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? It will no longer be available at checkout.`)) return;
    setError("");
    setNotice("");
    setActionId(coupon.coupon_id);
    try {
      const response = await fetch(`${API}${endpoint}${coupon.coupon_id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(await responseError(response, "Coupon could not be deleted."));
      setRows(current => current.filter(row => row.coupon_id !== coupon.coupon_id));
      setNotice(`${coupon.code} was deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Coupon could not be deleted.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Promotions</p>
        <h1 className="mt-2 text-3xl font-bold">Coupon codes</h1>
        <p className="mt-2 text-slate-600">Create and manage discounts. Usage counts increase after a payment using the coupon is confirmed.</p>
        {error && <p role="alert" className="mt-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-5 border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="border border-slate-200 bg-white">
            <div className="border-b p-5"><h2 className="font-bold">Available coupons</h2></div>
            {loading ? <p className="p-6 text-sm text-slate-500">Loading coupons…</p> : rows.length === 0 ? <p className="p-6 text-sm text-slate-500">No coupon codes created yet.</p> : (
              <div className="divide-y">
                {rows.map(coupon => <article key={coupon.coupon_id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-mono text-lg font-bold tracking-wide">{coupon.code}</p>
                    <p className="mt-1 text-sm text-slate-600">{coupon.discount_type === "percent" ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}{coupon.course_id ? ` · Course ${coupon.course_id}` : " · Eligible courses"}</p>
                    <p className="mt-1 text-xs text-slate-500">Used {coupon.redemption_count}{coupon.max_redemptions !== null ? ` of ${coupon.max_redemptions}` : " times"} · {coupon.expires_at ? `Expires ${new Date(coupon.expires_at).toLocaleDateString()}` : "No expiry"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`border px-2.5 py-1 text-xs font-semibold ${coupon.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>{coupon.active ? "Active" : "Deactivated"}</span>
                    <button disabled={actionId === coupon.coupon_id} onClick={() => void setActive(coupon)} className="border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{coupon.active ? "Deactivate" : "Activate"}</button>
                    <button disabled={actionId === coupon.coupon_id || coupon.redemption_count > 0} title={coupon.redemption_count > 0 ? "Coupons with confirmed uses must be deactivated to preserve usage history." : undefined} onClick={() => void remove(coupon)} className="border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                  </div>
                </article>)}
              </div>
            )}
          </section>

          <form onSubmit={create} className="space-y-4 border border-slate-200 bg-white p-5">
            <h2 className="font-bold">Create a coupon</h2>
            <label className="block text-sm font-medium">Code<input required maxLength={40} value={form.code} onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="WELCOME10" className="mt-1 block w-full border border-slate-300 px-3 py-2 font-mono uppercase" /></label>
            <label className="block text-sm font-medium">Discount type<select value={form.discount_type} onChange={event => setForm({ ...form, discount_type: event.target.value as CouponForm["discount_type"] })} className="mt-1 block w-full border border-slate-300 px-3 py-2"><option value="percent">Percentage</option><option value="fixed">Fixed amount (INR)</option></select></label>
            <label className="block text-sm font-medium">Discount value<input type="number" min="0.01" max={form.discount_type === "percent" ? "100" : undefined} step="0.01" required value={form.discount_value} onChange={event => setForm({ ...form, discount_value: event.target.value })} className="mt-1 block w-full border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium">Course ID (optional)<input value={form.course_id} onChange={event => setForm({ ...form, course_id: event.target.value })} placeholder="Apply across eligible courses" className="mt-1 block w-full border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium">Expiry (optional)<input type="datetime-local" value={form.expires_at} onChange={event => setForm({ ...form, expires_at: event.target.value })} className="mt-1 block w-full border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium">Maximum redemptions (optional)<input type="number" min="1" value={form.max_redemptions} onChange={event => setForm({ ...form, max_redemptions: event.target.value })} className="mt-1 block w-full border border-slate-300 px-3 py-2" /></label>
            <button disabled={busy} className="w-full bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create coupon"}</button>
          </form>
        </div>
      </div>
    </main>
  );
}