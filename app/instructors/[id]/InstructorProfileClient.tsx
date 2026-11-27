"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Award, BookOpen, BriefcaseBusiness, Globe2, Loader2, Mail, Users } from "lucide-react";
import CourseCard from "@/src/components/pages/CourseCard";

const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

type InstructorCourse = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: string;
  price?: string | number;
  instructor?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnail?: string;
};

type InstructorProfile = {
  _id: string;
  name: string;
  email?: string;
  bio?: string;
  imageUrl?: string | null;
  expertise?: string[] | string;
  skills?: string[] | string;
  currentRole?: string;
  company?: string;
  experience?: number;
  yearsOfExperience?: number;
  socialProfile?: string;
  offeringType?: string[] | string;
  teachingStyle?: string;
  targetAudience?: string;
  preferredLanguages?: string[] | string;
  achievements?: string;
  courses?: InstructorCourse[];
};

function listValues(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,]/).map(item => item.trim()).filter(Boolean);
  return [];
}

export default function PublicInstructorProfilePage({ id, initialProfile }: { id: string; initialProfile?: InstructorProfile | null }) {
  const [profile, setProfile] = useState<InstructorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (initialProfile) {
        setProfile(initialProfile);
        setLoading(false);
        return;
      }
      if (!API || !id) {
        setError("Instructor profile could not be loaded.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API}/api/instructors/${encodeURIComponent(id)}/`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "This instructor profile is unavailable.");
        setProfile(data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load this instructor.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id, initialProfile]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f7f8fb]"><div className="flex items-center gap-3 text-sm text-slate-600"><Loader2 size={18} className="animate-spin text-indigo-700"/>Loading instructor profile…</div></main>;

  if (error || !profile) return <main className="mx-auto grid min-h-screen max-w-3xl place-items-center bg-[#f7f8fb] px-5"><div className="w-full border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-slate-900">Instructor profile unavailable</h1><p className="mt-2 text-sm text-slate-600">{error || "This instructor is not available."}</p><Link href="/mentors" className="mt-5 inline-flex items-center gap-2 bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={16}/>Browse mentors</Link></div></main>;

  const expertise = [...new Set([...listValues(profile.expertise), ...listValues(profile.skills)])];
  const offerings = listValues(profile.offeringType);
  const languages = listValues(profile.preferredLanguages);
  const experience = profile.yearsOfExperience ?? profile.experience ?? 0;
  const courses = Array.isArray(profile.courses) ? profile.courses : [];

  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16 pt-6 sm:pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link href="/mentors" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"><ArrowLeft size={16}/>All mentors</Link>

        <section className="grid overflow-hidden border border-slate-200 bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative min-h-[280px] bg-slate-100 lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.imageUrl || "/placeholder.jpg"} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="p-6 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Approved instructor</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{profile.name}</h1>
            <p className="mt-2 text-base font-medium text-slate-600">{[profile.currentRole, profile.company].filter(Boolean).join(" · ") || "Industry instructor"}</p>
            {profile.bio && <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">{profile.bio}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              {experience > 0 && <span className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm text-slate-700"><BriefcaseBusiness size={15} className="text-indigo-700"/>{experience} years experience</span>}
              {courses.length > 0 && <span className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm text-slate-700"><BookOpen size={15} className="text-indigo-700"/>{courses.length} published {courses.length === 1 ? "course" : "courses"}</span>}
              {profile.targetAudience && <span className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm text-slate-700"><Users size={15} className="text-indigo-700"/>{profile.targetAudience}</span>}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {expertise.map(item => <span key={item} className="bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800">{item}</span>)}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {profile.email && <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"><Mail size={16}/>Contact instructor</a>}
              {profile.socialProfile && <a href={profile.socialProfile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700"><Globe2 size={16}/>Professional profile</a>}
            </div>
          </div>
        </section>

        {(offerings.length > 0 || profile.teachingStyle || languages.length > 0 || profile.achievements) && <section className="mt-7 border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2"><Award size={18} className="text-indigo-700"/><h2 className="text-lg font-bold text-slate-900">Programs and teaching</h2></div>
          {offerings.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{offerings.map(item => <span key={item} className="border border-slate-200 px-3 py-1.5 text-sm text-slate-700">{item}</span>)}</div>}
          {profile.teachingStyle && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{profile.teachingStyle}</p>}
          {languages.length > 0 && <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">Languages:</span> {languages.join(", ")}</p>}
          {profile.achievements && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{profile.achievements}</p>}
        </section>}

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Instructor catalog</p><h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Courses and programs</h2><p className="mt-2 text-sm text-slate-600">Published courses are ready to explore. Enroll or purchase from a course page to unlock its videos and resources.</p></div>
            <span className="border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{courses.length} available</span>
          </div>

          {courses.length === 0 ? <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><BookOpen size={25} className="mx-auto text-slate-400"/><h3 className="mt-3 font-semibold text-slate-900">No published courses yet</h3><p className="mt-1 text-sm text-slate-500">This instructor’s published programs will appear here.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course, index) => <div key={course._id || course.id || index} className="w-full [&>a]:w-full"><CourseCard course={{...course, _id: String(course._id || course.id), thumbnail: course.thumbnail || course.thumbnail_url || course.imageUrl || "/placeholder.jpg", instructor: course.instructor || profile.name}}/><Link href={`/course/${course._id || course.id}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline">View course details and enroll <ArrowRight size={15}/></Link></div>)}</div>}
        </section>
      </div>
    </main>
  );
}
