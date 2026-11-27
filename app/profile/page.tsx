"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  Linkedin,
  Phone,
  MapPin,
  Calendar,
  Edit,
  School,
  Book,
  GraduationCap,
  UserCheck,
  Briefcase,
  ArrowRight,
  UserCircle2,
  Code,
  Target,
} from "lucide-react";

import { useAuth } from "@/src/context/AuthContext";
import Link from "next/link";
import AuthGuard from "@/src/components/AuthGuard";
import CertificatesPage from "./certificates/page";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

type ApiRecord = Record<string, unknown>;

// ==========================================================
// Normalize skills / career arrays
// ==========================================================
function normalizeStringArray(value: unknown): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  const walk = (input: unknown): void => {
    if (input == null) return;

    if (typeof input === "string") {
      let current: unknown = input;
      for (let i = 0; i < 3; i++) {
        if (typeof current !== "string") break;
        const trimmed = current.trim();
        if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) break;
        try {
          const decoded = JSON.parse(trimmed);
          if (!Array.isArray(decoded)) break;
          current = decoded;
        } catch {
          break;
        }
      }
      if (typeof current === "string") {
        add(current);
        return;
      }
      walk(current);
      return;
    }

    if (Array.isArray(input)) {
      for (const item of input) walk(item);
      return;
    }

    if (typeof input === "number" || typeof input === "boolean") {
      add(String(input));
    }
  };

  walk(value);
  return result;
}

// Read cached identity from localStorage (for instant display)
function readCachedIdentity(): {
  full_name: string;
  email: string;
  avatar_url: string;
} {
  if (typeof window === "undefined") {
    return { full_name: "", email: "", avatar_url: "" };
  }
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return { full_name: "", email: "", avatar_url: "" };
    const parsed = JSON.parse(raw) as ApiRecord;
    const account = (
      parsed.user && typeof parsed.user === "object"
        ? parsed.user
        : parsed
    ) as ApiRecord;
    const profile =
      parsed.profile && typeof parsed.profile === "object"
        ? (parsed.profile as ApiRecord)
        : account.profile && typeof account.profile === "object"
          ? (account.profile as ApiRecord)
        : {};
    return {
      full_name: String(account.full_name ?? ""),
      email: String(account.email ?? ""),
      avatar_url: String(profile.avatar_url ?? ""),
    };
  } catch {
    return { full_name: "", email: "", avatar_url: "" };
  }
}

interface Enrollment {
  course_id: string;
  title: string;
  category?: string;
  level?: string;
  duration?: string;
  price?: string;
  thumbnail_url?: string;
  enrolled_at: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  course_status?: string;
  access_available?: boolean;
}

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState("");
  const [courseCertificates, setCourseCertificates] = useState<unknown[]>([]);

  // Instant identity from cache → no empty flash
  const [cachedIdentity] = useState(readCachedIdentity);

  // Stable user id
  const userId = useMemo<string | null>(() => {
    if (!user) return null;
    const u = user as unknown as { user_id?: unknown; id?: unknown };
    const raw = u.user_id ?? u.id;
    if (raw == null) return null;
    return String(raw);
  }, [user]);

  // ----------------------------------------------------------
  // Normalize all profile fields
  // Prefer live user data; if empty, keep cached full_name / email / avatar
  // ----------------------------------------------------------
  const details = useMemo(() => {
    const empty = {
      full_name: cachedIdentity.full_name,
      email: cachedIdentity.email,
      avatar_url: cachedIdentity.avatar_url,
      phone: "",
      gender: "",
      college: "",
      course: "",
      branch: "",
      graduation_year: "",
      current_address: "",
      city: "",
      state: "",
      education: "",
      skills: [] as string[],
      career_interests: [] as string[],
      social_media: "",
    };

    if (!user) return empty;

    const userRecord = user as unknown as ApiRecord;
    const p = (
      userRecord.profile && typeof userRecord.profile === "object"
        ? userRecord.profile
        : {}
    ) as ApiRecord;

    const liveName = String(userRecord.full_name ?? "").trim();
    const liveEmail = String(userRecord.email ?? "").trim();
    const liveAvatar = String(p.avatar_url ?? "").trim();

    return {
      // Never show blank if we already had a value
      full_name: liveName || cachedIdentity.full_name || "",
      email: liveEmail || cachedIdentity.email || "",
      avatar_url: liveAvatar || cachedIdentity.avatar_url || "",

      phone: String(p.contact_no ?? ""),
      gender: String(p.gender ?? ""),
      college: String(p.college ?? ""),
      course: String(p.course ?? ""),
      branch: String(p.branch ?? ""),
      graduation_year: String(p.graduation_year ?? ""),
      current_address: String(p.current_address ?? ""),
      city: String(p.city ?? ""),
      state: String(p.state ?? ""),
      education: String(p.education ?? ""),
      skills: normalizeStringArray(p.skills ?? userRecord.skills),
      career_interests: normalizeStringArray(
        p.career_interests ?? userRecord.career_interests
      ),
      social_media: String(p.social_media ?? ""),
    };
  }, [user, cachedIdentity]);

  // Keep localStorage in sync when we have good name/email
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem("user");
      const existing = raw ? (JSON.parse(raw) as ApiRecord) : {};
      const next = {
        ...existing,
        ...(user as object),
        full_name: details.full_name || existing.full_name || "",
        email: details.email || existing.email || "",
      };
      localStorage.setItem("user", JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [user, details.full_name, details.email]);

  // ----------------------------------------------------------
  // Fetch enrollments
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setEnrollmentLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchEnrollments = async () => {
      if (!API) {
        setEnrollmentError("API URL is not configured.");
        setEnrollmentLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setEnrollmentError("Please log in again.");
        setEnrollmentLoading(false);
        return;
      }

      try {
        setEnrollmentLoading(true);
        setEnrollmentError("");

        const response = await fetch(`${API}/api/courses/my-enrollments/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as ApiRecord | null)?.detail
              ? String((data as ApiRecord).detail)
              : "Failed to fetch enrollments."
          );
        }

        const items = Array.isArray(data)
          ? data
          : (data as ApiRecord | null)?.enrollments;

        setEnrollments(Array.isArray(items) ? (items as Enrollment[]) : []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;

        console.error("Enrollment fetch error:", error);
        setEnrollmentError(
          error instanceof Error
            ? error.message
            : "Failed to fetch enrollments."
        );
      } finally {
        if (!controller.signal.aborted) {
          setEnrollmentLoading(false);
        }
      }
    };

    void fetchEnrollments();

    return () => controller.abort();
  }, [authLoading, userId]);

  useEffect(() => {
    if (authLoading || !userId) return;
    const controller = new AbortController();
    const fetchCourseCertificates = async () => {
      const token = localStorage.getItem("token");
      if (!token || !API) return;
      try {
        const response = await fetch(`${API}/api/courses/my-certificates/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        setCourseCertificates(Array.isArray(data.certificates) ? data.certificates : []);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error("Course certificate fetch error:", error);
        }
      }
    };
    void fetchCourseCertificates();
    return () => controller.abort();
  }, [authLoading, userId]);

  const openLinkedIn = () => {
    const rawUrl = details.social_media.trim();
    if (!rawUrl) {
      router.push("/profile/edit");
      return;
    }
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ----------------------------------------------------------
  // Loading / Unauthenticated
  // ----------------------------------------------------------
  if (authLoading) {
    // Even while loading, show cached name if available
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {cachedIdentity.full_name ? (
            <p className="text-sm text-gray-700 mb-1">
              Welcome back, {cachedIdentity.full_name}
            </p>
          ) : null}
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-5 w-14 h-14 bg-blue-50 flex items-center justify-center">
            <UserCircle2 className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Log in to view your profile
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to see your account details.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Main UI
  // ----------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* ===================== PROFILE HERO ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-28 md:h-28 bg-white border border-gray-200 shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0 overflow-hidden">
            {details.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={details.avatar_url}
                alt={details.full_name || "Profile photo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <UserIcon size={56} strokeWidth={1.5} />
            )}
          </div>

          {/* Name + Email — always prefer non-empty */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight break-words">
              {details.full_name || "Your Name"}
            </h1>
            <p className="text-gray-600 mt-1 text-lg break-all">
              {details.email || "No email available"}
            </p>
            {details.college && (
              <p className="text-gray-500 mt-2 flex items-center gap-2">
                <School size={16} className="text-blue-600 shrink-0" />
                {details.college}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 px-5 py-2.5 font-semibold hover:bg-gray-50"
            >
              <Edit size={18} />
              Edit Profile
            </Link>

            <button
              type="button"
              onClick={openLinkedIn}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 font-semibold hover:bg-blue-700"
            >
              <Linkedin size={18} />
              {details.social_media ? "View LinkedIn" : "Add LinkedIn"}
            </button>
          </div>
        </div>
      </section>

      {/* ===================== QUICK STATS ===================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Enrolled</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {enrollmentLoading ? "..." : enrollments.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Certificates</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{courseCertificates.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Skills</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {details.skills.length}
          </p>
        </div>
      </section>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* PERSONAL INFO */}
          <section className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
              <UserCheck size={22} className="text-blue-600" />
              Personal Info
            </h2>
            <div className="space-y-4">
              {details.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-blue-600 shrink-0" />
                  <span>{details.phone}</span>
                </div>
              )}
              {details.gender && (
                <div className="flex items-center gap-3 text-gray-700">
                  <UserCheck size={18} className="text-blue-600 shrink-0" />
                  <span>{details.gender}</span>
                </div>
              )}
              {(details.city || details.state) && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={18} className="text-blue-600 shrink-0" />
                  <span>
                    {[details.city, details.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {details.current_address && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin size={18} className="text-blue-600 shrink-0 mt-1" />
                  <span>{details.current_address}</span>
                </div>
              )}
              {!details.phone &&
                !details.gender &&
                !details.city &&
                !details.state &&
                !details.current_address && (
                  <p className="text-sm text-gray-500">
                    No personal information added yet.
                  </p>
                )}
            </div>
          </section>

          {/* EDUCATION */}
          <section className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
              <School size={22} className="text-blue-600" />
              Education
            </h2>
            <div className="space-y-4">
              {details.college && (
                <div className="flex items-start gap-3">
                  <School size={18} className="text-blue-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">College / University</p>
                    <p className="font-semibold text-gray-800">
                      {details.college}
                    </p>
                  </div>
                </div>
              )}
              {details.course && (
                <div className="flex items-start gap-3">
                  <Book size={18} className="text-blue-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="font-semibold text-gray-800">
                      {details.course}
                    </p>
                  </div>
                </div>
              )}
              {details.branch && (
                <div className="flex items-start gap-3">
                  <Book size={18} className="text-blue-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Branch / Specialization
                    </p>
                    <p className="font-semibold text-gray-800">
                      {details.branch}
                    </p>
                  </div>
                </div>
              )}
              {details.graduation_year && (
                <div className="flex items-start gap-3">
                  <GraduationCap
                    size={18}
                    className="text-blue-600 mt-1 shrink-0"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Expected Graduation</p>
                    <p className="font-semibold text-gray-800">
                      {details.graduation_year}
                    </p>
                  </div>
                </div>
              )}
              {details.education && (
                <div className="flex items-start gap-3">
                  <GraduationCap
                    size={18}
                    className="text-blue-600 mt-1 shrink-0"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Education Details</p>
                    <p className="font-semibold text-gray-800">
                      {details.education}
                    </p>
                  </div>
                </div>
              )}
              {!details.college &&
                !details.course &&
                !details.branch &&
                !details.graduation_year &&
                !details.education && (
                  <p className="text-sm text-gray-500">
                    No education details added yet.
                  </p>
                )}
            </div>
          </section>

          {/* SKILLS */}
          <section className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Code size={22} className="text-blue-600" />
              Skills
            </h2>
            {details.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {details.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No skills added yet.</p>
            )}
          </section>

          {/* CAREER INTERESTS */}
          <section className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
              <Target size={22} className="text-blue-600" />
              Career Interests
            </h2>
            {details.career_interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {details.career_interests.map((career, index) => (
                  <span
                    key={`${career}-${index}`}
                    className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium"
                  >
                    {career}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No career interests added yet.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN – ENROLLMENTS */}
        <div className="lg:col-span-2">
          <section className="bg-white border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Book size={22} className="text-indigo-600" />
                My courses
              </h2>
              <span className="text-sm text-gray-800">
                {enrollments.length} Total
              </span>
            </div>

            {enrollmentLoading ? (
              <div className="py-14 text-center text-gray-500">
                Loading enrollments...
              </div>
            ) : enrollmentError ? (
              <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {enrollmentError}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 py-14 text-center">
                <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg font-medium">
                  No courses enrolled yet
                </p>
                <p className="text-gray-500 mt-1">
                  Enrolled and purchased courses will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((item) => (
                  <div
                    key={item.course_id}
                    className="group flex flex-col gap-4 border border-gray-200 bg-gray-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50 sm:flex-row sm:items-center"
                  >
                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="aspect-video w-full border object-cover sm:w-40" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{[item.category, item.level, item.duration].filter(Boolean).join(" · ")}</p>
                      {item.access_available === false && <p className="mt-2 inline-flex border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Course access temporarily unavailable · {item.course_status?.replaceAll("_", " ")}</p>}
                      {item.enrolled_at && <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><Calendar size={13}/> Enrolled {new Date(item.enrolled_at).toLocaleDateString("en-IN")}</p>}
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-600"><span>{item.completed_lessons}/{item.total_lessons} lessons complete</span><span className="font-semibold text-indigo-700">{item.progress}%</span></div>
                      <div className="mt-1 h-2 bg-gray-200"><div className="h-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }} /></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/course/${item.course_id}/learn`)}
                      disabled={item.access_available === false}
                      className="inline-flex shrink-0 items-center justify-center gap-2 border border-indigo-700 bg-indigo-700 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                    >
                      {item.access_available === false ? "Access unavailable" : "Continue learning"}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* CERTIFICATES */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">My Certificates</h2>
        <CertificatesPage />
      </section>
    </div>
  );
}

export default function Profile() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
