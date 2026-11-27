"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL || "";
const newEventId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
const visitorId = () => {
  try {
    const key = "skillhat-course-promotion-visitor";
    let id = window.localStorage.getItem(key);
    if (!id) { id = newEventId(); window.localStorage.setItem(key, id); }
    return id;
  } catch { return newEventId(); }
};

export default function CourseSponsorSection() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/courses/promotions/`, { cache: "no-store" })
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (!cancelled) setCampaigns(Array.isArray(data) ? data : []); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const track = useCallback((campaignId: string, kind: "impression" | "click") => {
    const key = `${campaignId}:${kind}`;
    if (kind === "impression" && seen.current.has(key)) return;
    seen.current.add(key);
    void fetch(`${API}/api/courses/promotions/${campaignId}/events/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, event_id: newEventId(), visitor_id: visitorId() }), keepalive: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!campaigns.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const campaignId = (entry.target as HTMLElement).dataset.campaignId;
        if (campaignId) track(campaignId, "impression");
      }
    }, { threshold: 0.5 });
    document.querySelectorAll<HTMLElement>("[data-sponsor-card]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [campaigns, track]);

  if (!campaigns.length) return null;
  return <section aria-labelledby="sponsored-courses-title" className="mx-auto w-full max-w-7xl px-4 sm:px-6">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700"><Sparkles size={14}/> Sponsored learning</p><h2 id="sponsored-courses-title" className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Featured courses</h2><p className="mt-1 text-sm text-slate-600">Instructor courses promoted for learners.</p></div>
      <span className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">Sponsored</span>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map(campaign => <Link key={campaign.campaign_id} data-sponsor-card data-campaign-id={campaign.campaign_id} href={`/course/${campaign.course.course_id}`} onClick={event => { event.preventDefault(); void (async () => { try { await fetch(`${API}/api/courses/promotions/${campaign.campaign_id}/events/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "click", event_id: newEventId(), visitor_id: visitorId() }), keepalive: true }); } catch { /* Keep course access available if tracking is temporarily unavailable. */ } finally { window.location.assign(`/course/${campaign.course.course_id}`); } })(); }} className="group overflow-hidden border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-lg">
        <div className="aspect-video bg-slate-100">{campaign.course.thumbnail_url ? <img src={campaign.course.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"/> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Course preview</div>}</div>
        <div className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{campaign.course.category || "Featured course"}</p><span className="border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">Ad · Advertisement</span></div><h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-950">{campaign.course.title}</h3><p className="mt-1 text-sm text-slate-500">By {campaign.course.instructor_name}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="font-bold text-slate-900">{Number(campaign.course.price) > 0 ? `₹${Number(campaign.course.price).toLocaleString("en-IN")}` : "Free enrollment"}</span><span className="inline-flex items-center gap-2 bg-indigo-700 px-3 py-2 text-xs font-semibold text-white">View course <ArrowRight size={14}/></span></div></div>
      </Link>)}
    </div>
  </section>;
}
