"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { Ad } from "@/src/types";

const API = process.env.NEXT_PUBLIC_APP_URL;

interface AdForm {
  image: string;
  height: string;
  width: string;
  buttonText: string;
  buttonLink: string;
  buttonColor: string;
  buttonBg: string;
  buttonSize: string;
  buttonBorderRadius: string;
  autoCloseSeconds: number;
  imageFile?: File | null;
  imagePreview?: string;
}

const EMPTY_AD: AdForm = {
  image: "",
  height: "",
  width: "",
  buttonText: "",
  buttonLink: "",
  buttonColor: "#ffffff",
  buttonBg: "#0f172a",
  buttonSize: "medium",
  buttonBorderRadius: "8px",
  autoCloseSeconds: 0,
  imageFile: null,
  imagePreview: "",
};

// ─── Dimension presets ────────────────────────────────────────────────────────
// Shown BEFORE upload so admin picks the right crop upfront
const DIM_PRESETS = [
  {
    label: "Full Width Banner",
    w: "100%",
    h: "200px",
    note: "Homepage hero, all screens",
  },
  {
    label: "Square Post",
    w: "400px",
    h: "400px",
    note: "Social-style, mobile friendly",
  },
  {
    label: "Portrait Poster",
    w: "360px",
    h: "640px",
    note: "Story-format, mobile",
  },
  {
    label: "Leaderboard",
    w: "728px",
    h: "90px",
    note: "Desktop top/bottom bar",
  },
  {
    label: "Medium Rectangle",
    w: "300px",
    h: "250px",
    note: "Sidebar / embedded",
  },
  {
    label: "Wide Skyscraper",
    w: "160px",
    h: "600px",
    note: "Sidebar desktop only",
  },
];

// ─── Icon Components ──────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconEye = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconX = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconImage = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IconClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconLink = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);
const IconInfo = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconMobile = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const IconDesktop = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-slate-100">
    {[48, 120, 80, 60, 80].map((w, i) => (
      <td key={i} className="px-5 py-4">
        <div
          className="h-4 rounded-md bg-slate-100 animate-pulse"
          style={{ width: w }}
        />
      </td>
    ))}
  </tr>
);

// ─── Dimension resolver ───────────────────────────────────────────────────────
// Converts admin input to safe CSS values usable in preview.
// KEY FIX: "auto" height is banned for <Image fill> parents — we must always
// resolve to an explicit pixel value for the preview container.
function resolvePreviewDims(rawW: string, rawH: string) {
  // Strip whitespace
  const w = (rawW || "").trim();
  const h = (rawH || "").trim();

  // Width: if percent or "100%", use 100% but cap via maxWidth on container
  const cssWidth = w || "100%";
  // Height: NEVER pass "auto" to the image container — collapse to 0px otherwise.
  // Default to 360px when empty or "auto".
  const cssHeight = !h || h === "auto" ? "360px" : h;

  return { cssWidth, cssHeight };
}

// Is this width likely to overflow a mobile screen?
function isMobileUnsafe(w: string): boolean {
  if (!w || w === "100%" || w.includes("vw")) return false;
  const px = parseInt(w);
  return !isNaN(px) && px > 420;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAdsPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<AdForm>(EMPTY_AD);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  const fetchAds = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API}/auth/ads/list/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      setAds(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setForm({
      image: ad.image || "",
      height: ad.height != null ? String(ad.height) : "",
      width: ad.width != null ? String(ad.width) : "",
      buttonText: ad.buttonText || "",
      buttonLink: ad.buttonLink || "",
      buttonColor: ad.buttonColor || "#ffffff",
      buttonBg: ad.buttonBg || "#0f172a",
      buttonSize: ad.buttonSize || "medium",
      buttonBorderRadius: ad.buttonBorderRadius || "8px",
      autoCloseSeconds: ad.autoCloseSeconds || 0,
      imageFile: null,
      imagePreview: ad.image || "",
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingAd(null);
    setForm({ ...EMPTY_AD });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/auth/ads/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAds((prev) => prev.filter((a) => a._id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.imageFile) fd.append("image_file", form.imageFile);
      if (form.height) fd.append("height", form.height);
      if (form.width) fd.append("width", form.width);
      fd.append("buttonText", form.buttonText);
      fd.append("buttonLink", form.buttonLink);
      fd.append("buttonColor", form.buttonColor);
      fd.append("buttonBg", form.buttonBg);
      fd.append("buttonSize", form.buttonSize);
      fd.append("buttonBorderRadius", form.buttonBorderRadius);
      fd.append("autoCloseSeconds", String(form.autoCloseSeconds || 0));

      const url = editingAd
        ? `${API}/auth/ads/${editingAd._id}/`
        : `${API}/auth/ads/`;
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        method: editingAd ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.text()) || "Save failed");
      const saved: Ad = await res.json();
      setAds((prev) =>
        editingAd
          ? prev.map((a) => (a._id === saved._id ? saved : a))
          : [...prev, saved],
      );
      setShowModal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const imgSrc = form.imagePreview || form.image;

  // Resolved safe preview dimensions
  const { cssWidth, cssHeight } = resolvePreviewDims(form.width, form.height);
  const mobileUnsafe = isMobileUnsafe(form.width);

  // In mobile preview mode, cap width to 390px
  const effectiveWidth =
    previewMode === "mobile" ? "min(390px, 95vw)" : `min(${cssWidth}, 95vw)`;
  const effectiveHeight = cssHeight; // always a px value now

  // Button padding by size
  const btnPad =
    form.buttonSize === "small"
      ? "8px 20px"
      : form.buttonSize === "large"
        ? "14px 36px"
        : "11px 28px";
  const btnFs =
    form.buttonSize === "small"
      ? "13px"
      : form.buttonSize === "large"
        ? "17px"
        : "15px";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .ads-root  { font-family: 'DM Sans', sans-serif; }
        .ads-head  { font-family: 'Instrument Serif', serif; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        .fade-up   { animation: fadeUp  .35s ease both; }
        .fade-in   { animation: fadeIn  .2s  ease both; }
        .row-h     { transition: background .12s; }
        .row-h:hover { background: #f8fafc; }
        .btn-dark  { background:#0f172a; color:#fff; transition: background .15s, box-shadow .15s; }
        .btn-dark:hover  { background:#1e293b; box-shadow:0 4px 14px rgba(15,23,42,.18); }
        .btn-ghost { transition: background .12s; }
        .btn-ghost:hover { background:#f1f5f9; }
        .inp { border:1.5px solid #e2e8f0; border-radius:10px; padding:9px 14px; font-size:13.5px;
               font-family:'DM Sans',sans-serif; outline:none; background:#fff; width:100%;
               transition:border .15s, box-shadow .15s; }
        .inp:focus { border-color:#0f172a; box-shadow:0 0 0 3px rgba(15,23,42,.07); }
        .inp::placeholder { color:#94a3b8; }
        select.inp { cursor:pointer; }
        .clr { width:100%; height:40px; border:1.5px solid #e2e8f0; border-radius:10px; cursor:pointer; padding:3px; }
        .sec  { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px; }
        .tag  { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:6px; font-size:12px; font-weight:500; }
        .preset-chip { padding:5px 10px; border-radius:8px; font-size:11.5px; font-weight:500;
                       border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .13s;
                       color:#475569; white-space:nowrap; }
        .preset-chip:hover { border-color:#0f172a; color:#0f172a; background:#f8fafc; }
        .preset-chip.active { border-color:#0f172a; background:#0f172a; color:#fff; }
        .warn-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px;
                      border-radius:6px; font-size:11px; background:#fff7ed; color:#c2410c;
                      border:1px solid #fed7aa; font-weight:500; }
      `}</style>

      <div className="ads-root min-h-screen bg-[#f7f8fb] px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* ── Header ── */}
          <div className="fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-9">
            <button
              onClick={handleNew}
              className="btn-dark flex items-center gap-2 px-5 py-2 font-medium text-sm flex-shrink-0"
            >
              <IconPlus /> New Campaign
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <span>⚠</span>
              {error}
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <IconX />
              </button>
            </div>
          )}

          {/* ── Stats ── */}
          <div
            className="fade-up grid grid-cols-3 gap-4 mb-6"
            style={{ animationDelay: ".05s" }}
          >
            {[
              { label: "Total Campaigns", value: ads.length },
              {
                label: "With Auto-close",
                value: ads.filter((a) => (a.autoCloseSeconds ?? 0) > 0).length,
              },
              {
                label: "Active Links",
                value: ads.filter((a) => a.buttonLink).length,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
              >
                <p className="text-2xl font-semibold text-slate-900">
                  {s.value}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Table ── */}
          <div
            className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto"
            style={{ animationDelay: ".1s" }}
          >
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    "Preview",
                    "Dimensions",
                    "Call to Action",
                    "Auto-close",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 sec ${i === 4 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && [1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                {!loading && ads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <span className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <IconImage />
                        </span>
                        <p className="font-medium text-slate-600">
                          No campaigns yet
                        </p>
                        <p className="text-sm">
                          Click "+ New Campaign" to create your first ad
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {ads.map((ad, idx) => (
                  <tr
                    key={ad._id}
                    className="row-h border-b border-slate-50 last:border-none"
                  >
                    <td className="px-5 py-4">
                      {ad.image ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                          <Image
                            src={ad.image}
                            alt="Campaign thumbnail"
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                          <IconImage />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {ad.height || ad.width ? (
                        <span className="tag bg-slate-100 text-slate-600">
                          {ad.width || "auto"} × {ad.height || "auto"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Default</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {ad.buttonText ? (
                        <div className="flex flex-col gap-1.5">
                          <span
                            className="tag w-fit"
                            style={{
                              background: ad.buttonBg || "#0f172a",
                              color: ad.buttonColor || "#fff",
                            }}
                          >
                            {ad.buttonText}
                          </span>
                          {ad.buttonLink && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[180px]">
                              <IconLink />
                              {ad.buttonLink}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {(ad.autoCloseSeconds ?? 0) > 0 ? (
                        <span className="tag bg-amber-50 text-amber-700 gap-1">
                          <IconClock />
                          {ad.autoCloseSeconds}s
                        </span>
                      ) : (
                        <span className="tag bg-slate-100 text-slate-400">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(ad)}
                          title="Edit"
                          className="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg text-slate-500"
                        >
                          <IconEdit />
                        </button>
                        {deleteConfirm === ad._id ? (
                          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                            Sure?
                            <button
                              onClick={() => handleDelete(ad._id)}
                              className="underline hover:text-red-800"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(ad._id)}
                            title="Delete"
                            className="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500"
                          >
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════ */}
      {showModal && (
        <div className="ads-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[3px] fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto border border-slate-100">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <h2 className="ads-head text-2xl text-slate-800">
                  {editingAd ? "Edit Campaign" : "New Campaign"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingAd
                    ? "Update this ad's settings"
                    : "Configure and launch a new ad"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {imgSrc && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-600 btn-ghost"
                  >
                    <IconEye /> Preview
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-ghost w-9 h-9 flex items-center justify-center rounded-xl text-slate-400"
                >
                  <IconX />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-7">
              {/* ── Section 1: Dimensions FIRST (before upload) ── */}
              <div>
                <p className="sec">Step 1 — Choose dimensions</p>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Pick a preset or enter custom values. Choose{" "}
                  <strong>before uploading</strong> so your image is cropped to
                  the right ratio.
                </p>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {DIM_PRESETS.map((p) => {
                    const active = form.width === p.w && form.height === p.h;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, width: p.w, height: p.h })
                        }
                        className={`preset-chip${active ? " active" : ""}`}
                        title={`${p.w} × ${p.h} — ${p.note}`}
                      >
                        {p.label}
                        <span className="ml-1.5 opacity-60 font-normal text-[10px]">
                          {p.w} × {p.h}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">
                      Width
                    </label>
                    <input
                      type="text"
                      value={form.width}
                      onChange={(e) =>
                        setForm({ ...form, width: e.target.value })
                      }
                      placeholder="e.g. 100% or 400px"
                      className="inp"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">
                      Height
                    </label>
                    <input
                      type="text"
                      value={form.height}
                      onChange={(e) =>
                        setForm({ ...form, height: e.target.value })
                      }
                      placeholder="e.g. 300px (avoid 'auto')"
                      className="inp"
                    />
                  </div>
                </div>

                {/* Warnings */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* "auto" height warning */}
                  {(form.height === "auto" || form.height === "") && (
                    <span className="warn-badge">
                      <IconInfo />
                      Height is empty/auto — preview will use 360px default
                    </span>
                  )}
                  {/* Mobile overflow warning */}
                  {mobileUnsafe && (
                    <span className="warn-badge">
                      <IconMobile />
                      Width {form.width} may overflow on phones (&lt; 420px
                      screen)
                    </span>
                  )}
                  {/* Good mobile signal */}
                  {!mobileUnsafe && form.width && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        fontWeight: 500,
                      }}
                    >
                      <IconMobile /> Mobile safe
                    </span>
                  )}
                </div>
              </div>

              {/* ── Section 2: Image upload ── */}
              <div>
                <p className="sec">Step 2 — Upload image</p>
                <p className="text-xs text-slate-500 mb-3">
                  Upload an image matching the dimensions above.
                  {form.width && form.height && form.height !== "auto" ? (
                    <>
                      {" "}
                      Ideal crop:{" "}
                      <strong>
                        {form.width} × {form.height}
                      </strong>
                      .
                    </>
                  ) : (
                    " Select dimensions in Step 1 first for best results."
                  )}
                </p>

                <label className="block cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        setForm({
                          ...form,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file),
                        });
                    }}
                  />
                  {imgSrc ? (
                    <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 group-hover:border-slate-400 transition-colors">
                      <Image
                        src={imgSrc}
                        alt="Campaign image"
                        fill
                        sizes="(max-width:640px) 100vw, 560px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow">
                          Click to replace
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-slate-600">
                      <IconImage />
                      <p className="text-sm font-medium">
                        Click to upload image
                      </p>
                      <p className="text-xs">PNG, JPG, WEBP</p>
                    </div>
                  )}
                </label>
                {form.imageFile && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        imageFile: null,
                        imagePreview: form.image || "",
                      })
                    }
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    ✕ Remove new upload
                  </button>
                )}
              </div>

              {/* ── Section 3: Button ── */}
              <div>
                <p className="sec">Call-to-action button</p>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Button label
                      </label>
                      <input
                        type="text"
                        value={form.buttonText}
                        onChange={(e) =>
                          setForm({ ...form, buttonText: e.target.value })
                        }
                        placeholder="Learn More"
                        className="inp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Destination URL
                      </label>
                      <input
                        type="text"
                        value={form.buttonLink}
                        onChange={(e) =>
                          setForm({ ...form, buttonLink: e.target.value })
                        }
                        placeholder="https://..."
                        className="inp"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Text color
                      </label>
                      <input
                        type="color"
                        value={form.buttonColor}
                        onChange={(e) =>
                          setForm({ ...form, buttonColor: e.target.value })
                        }
                        className="clr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Background
                      </label>
                      <input
                        type="color"
                        value={form.buttonBg}
                        onChange={(e) =>
                          setForm({ ...form, buttonBg: e.target.value })
                        }
                        className="clr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Size
                      </label>
                      <select
                        value={form.buttonSize}
                        onChange={(e) =>
                          setForm({ ...form, buttonSize: e.target.value })
                        }
                        className="inp"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Radius
                      </label>
                      <input
                        type="text"
                        value={form.buttonBorderRadius}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            buttonBorderRadius: e.target.value,
                          })
                        }
                        placeholder="8px"
                        className="inp"
                      />
                    </div>
                  </div>
                  {form.buttonText && (
                    <div className="pt-1 flex items-center gap-3">
                      <span className="text-xs text-slate-400">Preview:</span>
                      <span
                        className="font-medium cursor-default"
                        style={{
                          background: form.buttonBg,
                          color: form.buttonColor,
                          borderRadius: form.buttonBorderRadius,
                          fontSize: btnFs,
                          padding: btnPad,
                        }}
                      >
                        {form.buttonText}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 4: Auto-close ── */}
              <div>
                <p className="sec">Auto-close timer</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={form.autoCloseSeconds || 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        autoCloseSeconds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="inp max-w-[120px]"
                  />
                  <span className="text-sm text-slate-500">
                    {form.autoCloseSeconds > 0
                      ? `Ad closes after ${form.autoCloseSeconds}s`
                      : "Disabled — stays open until user closes it"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost px-5 py-2.5 rounded-xl text-sm text-slate-600 font-medium border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-dark px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? "Saving…"
                    : editingAd
                      ? "Update Campaign"
                      : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          LIVE PREVIEW MODAL
          ─ Image fills exact admin-set dimensions
          ─ Button overlays bottom-center on image
          ─ Whole image clickable → buttonLink
          ─ height:"auto" is resolved to 360px (never collapses)
          ─ % widths clamped to 95vw so mobile never overflows
          ─ Desktop / Mobile toggle to simulate screen sizes
      ══════════════════════════════════════ */}
      {showPreview && (
        <div
          className="ads-root fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-6 bg-slate-900/80 backdrop-blur-md fade-in"
          onClick={() => setShowPreview(false)}
        >
          {/* ── Mode toggle + close bar ── */}
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  previewMode === "desktop"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <IconDesktop /> Desktop
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  previewMode === "mobile"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <IconMobile /> Mobile
              </button>
            </div>

            {/* Dimension readout */}
            <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-lg">
              {previewMode === "mobile"
                ? `≤390px × ${effectiveHeight}`
                : `${form.width || "100%"} × ${effectiveHeight}`}
            </span>
          </div>

          {/* ── Ad card ── */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative  overflow-hidden shadow-2xl"
            style={{
              // KEY FIX: always use min() so % values don't overflow viewport
              width: effectiveWidth,
              // KEY FIX: height is always a px value — never "auto" — so Image fill never collapses
              height: effectiveHeight,
              maxWidth: "95vw",
              maxHeight: "85vh",
              flexShrink: 0,
            }}
          >
            {/* Auto-close pill — top-left */}
            {form.autoCloseSeconds > 0 && (
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-medium pointer-events-none">
                <IconClock /> Closes in {form.autoCloseSeconds}s
              </div>
            )}

            {/* Close X — top-right */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-white/85 shadow text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Close preview"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* ── Entire image is clickable ── */}
            <>
              <a
                href={form.buttonLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={form.buttonText || "View campaign"}
                className="block w-full h-full relative"
                onClick={(e) => {
                  if (!form.buttonLink) e.preventDefault();
                }}
              >
                {imgSrc ? (
                  // Next.js Image with fill — works because parent always has px height now
                  <Image
                    src={imgSrc}
                    alt="Campaign"
                    fill
                    sizes="(max-width:640px) 95vw, 800px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-300">
                    <IconImage />
                    <p className="text-xs">No image uploaded</p>
                  </div>
                )}

                {/* Hover sheen on clickable image */}
                {form.buttonLink && (
                  <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors duration-200 pointer-events-auto" />
                )}

                {/* ── CTA button overlay — bottom-center ── */}
                {form.buttonText && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-20 flex justify-center"
                    style={{
                      paddingBottom:
                        form.buttonSize === "large" ? "20px" : "14px",
                    }}
                    onClick={(e) => e.stopPropagation()} // prevent double-navigate
                  > <> 
                    <a
                      href={form.buttonLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-center transition-transform hover:scale-105 active:scale-95 select-none"
                      style={{
                        background: form.buttonBg || "#0f172a",
                        color: form.buttonColor || "#ffffff",
                        borderRadius: form.buttonBorderRadius || "10px",
                        fontSize: btnFs,
                        padding: btnPad,
                        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {form.buttonText}
                    </a>
                    </>
                  </div>
                )}
              </a>
            </>
          </div>

          {/* Hint */}
          <p
            className="text-xs text-slate-500 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            Click outside or press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      )}
    </>
  );
}
