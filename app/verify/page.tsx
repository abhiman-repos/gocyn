"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaAward, FaCheckCircle, FaSearch, FaShieldAlt, FaTimesCircle } from "react-icons/fa";

import { APP_API_BASE, LEGACY_API_BASE } from "@/src/lib/apiBases";
const API = APP_API_BASE || "http://localhost:8000";
async function fetchCertificateRecord(certificateId: string): Promise<Certificate> {
  const encodedId = encodeURIComponent(certificateId.toLowerCase());
  const legacyId = encodeURIComponent(certificateId);
  const courseResponse = await fetch(`${API}/api/courses/certificates/verify/${encodedId}/`, { cache: "no-store" });
  const courseData = await courseResponse.json().catch(() => ({}));
  if (courseResponse.ok) return courseData;
  if (courseResponse.status !== 404) {
    throw new Error(courseData.detail || courseData.message || "Certificate verification failed.");
  }

  const legacyResponse = await fetch(`${LEGACY_API_BASE || API}/upload/verify/${legacyId}/`, { cache: "no-store" });
  const legacyData = await legacyResponse.json().catch(() => ({}));
  if (!legacyResponse.ok) {
    throw new Error(legacyData.detail || legacyData.message || "No certificate was found with that ID.");
  }
  return legacyData;
}

type Certificate = {
  certificate_id?: string;
  user_name?: string;
  user_email?: string;
  internship_title?: string;
  course_title?: string;
  instructor_name?: string;
  mentor_name?: string;
  issued_at?: string;
};

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Certificate | null>(null);
  const [error, setError] = useState("");

  const verify = useCallback(async (id: string) => {
    const normalizedId = id.trim().toUpperCase();
    if (!normalizedId) {
      setError("Enter a certificate ID to verify.");
      return;
    }
    setCertificateId(normalizedId);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await fetchCertificateRecord(normalizedId));

    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Certificate verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("certificate");
    if (id) void verify(id);
  }, [verify]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void verify(certificateId);
  };

  return (
    <main className="min-h-[70vh] bg-[#fcfcfc] px-4 py-12 text-slate-900 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-6">
          <Link href="/" aria-label="Gocyn home" className="inline-flex items-center">
            <Image src="/logo.png" alt="Gocyn" width={160} height={54} className="h-auto w-36 object-contain" priority />
          </Link>
          <span className="inline-flex items-center gap-2 border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800">
            <FaShieldAlt aria-hidden="true" /> Official certificate verification
          </span>
        </header>

        <section className="py-12 text-center sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-700">Gocyn credentials</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Verify a certificate</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Enter the certificate ID to confirm that it was issued by Gocyn and view its holder and program details.
          </p>
        </section>

        <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit}>
            <label htmlFor="certificate-id" className="block text-sm font-semibold text-slate-800">Certificate ID</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="certificate-id"
                type="text"
                autoComplete="off"
                placeholder="Enter certificate ID"
                value={certificateId}
                onChange={event => { setCertificateId(event.target.value.toUpperCase()); setError(""); setResult(null); }}
                disabled={loading}
                className="min-w-0 flex-1 border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />
              <button type="submit" disabled={loading || !certificateId.trim()} className="inline-flex items-center justify-center gap-2 bg-indigo-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                <FaSearch aria-hidden="true" /> {loading ? "Verifying…" : "Verify certificate"}
              </button>
            </div>
          </form>

          {loading && <p role="status" className="mt-5 border-l-4 border-indigo-600 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">Checking certificate records…</p>}
          {error && <div role="alert" className="mt-6 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-red-800"><FaTimesCircle className="mt-0.5 shrink-0" /><div><p className="font-semibold">Certificate not verified</p><p className="mt-1 text-sm">{error}</p></div></div>}

          {result && <section aria-live="polite" className="mt-7 border border-emerald-200">
            <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 p-5 sm:px-7">
              <FaCheckCircle className="shrink-0 text-emerald-700" size={24} />
              <div><h2 className="text-lg font-bold text-emerald-900">Certificate verified</h2><p className="mt-0.5 text-sm text-emerald-800">This certificate is recorded as issued by Gocyn.</p></div>
            </div>
            <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Certificate holder</dt><dd className="mt-1 break-words font-semibold">{result.user_name || "—"}</dd></div>
              {result.user_email && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</dt><dd className="mt-1 break-words font-medium">{result.user_email}</dd></div>}
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Program</dt><dd className="mt-1 font-semibold">{result.course_title || result.internship_title || "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Mentor</dt><dd className="mt-1 font-medium">{result.instructor_name || result.mentor_name || "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue date</dt><dd className="mt-1 font-medium">{result.issued_at ? new Date(result.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Certificate ID</dt><dd className="mt-1 break-all font-mono font-bold text-indigo-800">{result.certificate_id || certificateId}</dd></div>
            </dl>
            <p className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600"><FaShieldAlt className="text-indigo-700" /> Official Gocyn verification record</p>
          </section>}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><FaAward className="text-indigo-700" /> Issued by Gocyn</span>
          <span className="inline-flex items-center gap-2"><FaShieldAlt className="text-indigo-700" /> Verified against certificate records</span>
        </div>
      </div>
    </main>
  );
}
