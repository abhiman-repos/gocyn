"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const API = process.env.APP_URL;
type Status = "pending" | "approved" | "rejected" | "suspended";
type Application = {
  instructor_id: string; email: string; phone: string; status: Status;
  credential_score: number; full_name: string; avatar_url: string | null;
  years_of_experience: number; expertise: string[]; created_at: string;
  reviewed_at: string | null;
};
type Detail = Application & {
  review_note: string; reviewed_by: string | null;
  profile: Record<string, any> | null;
};

function authHeaders(json = false): HeadersInit {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Admin session expired. Please sign in again.");
  return { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
}

const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "—";

export default function InstructorApplicationsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("pending");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const suffix = filter === "all" ? "" : `?status=${filter}`;
      const response = await fetch(`${API}/api/admin/instructors/${suffix}`, { headers: authHeaders(), cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || "Could not load instructor applications.");
      setRows(data.results || []);
    } catch (error: any) { toast.error(error.message || "Could not load applications."); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const openApplication = async (row: Application) => {
    try {
      const response = await fetch(`${API}/api/admin/instructors/${row.instructor_id}/`, { headers: authHeaders(), cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || "Could not load application details.");
      setSelected(data); setNote(data.review_note || "");
    } catch (error: any) { toast.error(error.message || "Could not load application details."); }
  };

  const review = async (action: "approve" | "reject" | "suspend") => {
    if (!selected) return;
    try {
      setBusy(true);
      const response = await fetch(`${API}/api/admin/instructors/${selected.instructor_id}/action/`, {
        method: "POST", headers: authHeaders(true), body: JSON.stringify({ action, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Could not ${action} application.`);
      toast.success(action === "approve" ? "Instructor approved. Dashboard access is enabled." : action === "suspend" ? "Instructor suspended." : "Application rejected.");
      setSelected(data); setNote(data.review_note || ""); await load();
    } catch (error: any) { toast.error(error.message || "Review action failed."); }
    finally { setBusy(false); }
  };

  const profile = selected?.profile || {};
  const fields: [string, any][] = [
    ["Current role", profile.current_role], ["Company", profile.company],
    ["Experience", profile.years_of_experience == null ? "" : `${profile.years_of_experience} years`],
    ["Expertise", Array.isArray(profile.expertise) ? profile.expertise.join(", ") : profile.expertise],
    ["Skills", profile.skills], ["Bio", profile.bio], ["Offerings", Array.isArray(profile.offering_type) ? profile.offering_type.join(", ") : profile.offering_type],
    ["Teaching style", profile.teaching_style], ["Target audience", profile.target_audience],
    ["Availability", profile.weekly_availability], ["Price range", profile.price_range],
    ["Languages", Array.isArray(profile.preferred_language) ? profile.preferred_language.join(", ") : profile.preferred_language],
    ["Social profile", profile.social_profile], ["Past mentoring experience", profile.past_mentoring_exp],
    ["Achievements", profile.achievements], ["Terms accepted", profile.agreed_to_terms ? "Yes" : "No"],
    ["Background consent", profile.agreed_to_background ? "Yes" : "No"],
  ];

  return <main className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Instructor applications</h1><p className="mt-1 text-sm text-gray-500">Review submitted profiles and control dashboard access.</p></div>
      <div className="flex gap-3"><select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-lg border px-3 py-2 text-sm"><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="all">All applications</option></select><button onClick={() => void load()} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Refresh</button></div>
    </header>
    <section className="overflow-hidden rounded-xl border bg-white">
      {loading ? <p className="p-10 text-center text-gray-500">Loading applications…</p> : rows.length === 0 ? <p className="p-10 text-center text-gray-500">No applications in this status.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Instructor</th><th className="px-5 py-3">Expertise</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y">{rows.map(row => <tr key={row.instructor_id} className="hover:bg-gray-50"><td className="px-5 py-4"><div className="font-semibold text-gray-900">{row.full_name || "Unnamed instructor"}</div><div className="text-gray-500">{row.email} · {row.phone}</div></td><td className="px-5 py-4">{row.expertise?.join(", ") || "—"}</td><td className="px-5 py-4 whitespace-nowrap">{date(row.created_at)}</td><td className="px-5 py-4">{row.credential_score}/100</td><td className="px-5 py-4 capitalize">{row.status}</td><td className="px-5 py-4 text-right"><button onClick={() => void openApplication(row)} className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700">Review</button></td></tr>)}</tbody></table></div>}
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Instructor application review"><section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"><header className="flex items-start justify-between border-b p-5"><div><h2 className="text-xl font-bold">{profile.full_name || selected.email}</h2><p className="text-sm text-gray-500">{selected.email} · {selected.phone} · <span className="capitalize">{selected.status}</span></p><p className="mt-1 text-xs text-gray-500">Submitted {date(selected.created_at)} · Score {selected.credential_score}/100</p></div><button onClick={() => setSelected(null)} className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button></header><div className="overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2">{profile.profile_photo && <div className="sm:col-span-2"><img src={profile.profile_photo} alt="Instructor profile" className="h-36 w-36 rounded-xl object-cover" /></div>}{fields.map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3"><div className="text-xs font-semibold uppercase text-gray-500">{label}</div><div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">{value || "—"}</div></div>)}</div><label className="mt-5 block text-sm font-semibold">Review note<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" placeholder="Optional note for the instructor" /></label>{selected.reviewed_by && <p className="mt-2 text-xs text-gray-500">Last reviewed by {selected.reviewed_by} on {date(selected.reviewed_at)}.</p>}</div><footer className="flex flex-wrap justify-end gap-2 border-t bg-gray-50 p-4"><button disabled={busy} onClick={() => void review("reject")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button>{selected.status !== "suspended" && <button disabled={busy} onClick={() => void review("suspend")} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50">Suspend</button>}<button disabled={busy} onClick={() => void review("approve")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : selected.status === "approved" ? "Restore access" : "Approve and enable dashboard"}</button></footer></section></div>}
  </main>;
}

