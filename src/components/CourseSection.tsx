"use client"

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CourseCard from "./pages/CourseCard";

interface Course {
  _id: string;
  title: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  instructor: string;
  category: string;
  rating: number;
  reviewsCount: number;
  duration: string;          // e.g. "12h 40m"
  enrolledStudents: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
}

export function TrendingCoursesSection({
  initialCourses,
  loading = false,
}: {
  initialCourses: Course[];
  loading?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => railRef.current?.scrollBy({ left: direction * 340, behavior: "smooth" });

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 px-1">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Trending Courses
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Upgrade your skills with industry-recognized certification courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden gap-1 sm:flex">
            <button type="button" aria-label="Previous courses" onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"><ArrowLeft size={16}/></button>
            <button type="button" aria-label="Next courses" onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"><ArrowRight size={16}/></button>
          </div>
          <Link href="/courses" className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-indigo-700 hover:underline">View All Courses <ArrowRight size={16} /></Link>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      {initialCourses.length === 0 && !loading ? <div className="border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">New courses will appear here soon.</div> : <div
        ref={railRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {loading
          ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[340px] w-[300px] shrink-0 animate-pulse border border-slate-200 bg-white" />)
          : initialCourses.map((course) => (
          <div key={course._id} className="snap-start shrink-0">
            <CourseCard course={{ ...course, thumbnail: course.thumbnail || course.thumbnail_url || course.imageUrl || "/placeholder.jpg" }} />
          </div>
        ))}
      </div>}
    </section>
  );
}

type RecommendationUser = {
  profile?: {
    skills?: unknown;
    career_interests?: unknown;
    course?: string;
    branch?: string;
    education?: string;
  };
};

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,]/).map(item => item.trim()).filter(Boolean);
  return [];
}

export function RecommendedCoursesSection({
  initialCourses,
  user,
}: {
  initialCourses: Course[];
  user: RecommendationUser | null;
}) {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const profile = user?.profile;
  const query = useMemo(() => [
    ...asTags(profile?.career_interests),
    ...asTags(profile?.skills),
    profile?.course || "",
    profile?.branch || "",
    profile?.education || "",
  ].filter(Boolean).join(" ").slice(0, 160), [profile]);

  useEffect(() => {
    const fallback = initialCourses.slice(4, 8);
    if (query.trim().length < 2) {
      setRecommendations(fallback.length ? fallback : initialCourses.slice(0, 4));
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, type: "course", limit: "8" });
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/search/semantic/?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Recommendation search failed.");
        const results = Array.isArray(data.courses) ? data.courses : [];
        setRecommendations(results.length
          ? results.map((course: any) => ({
              ...course,
              _id: String(course._id || course.id),
              thumbnail: course.thumbnail || course.thumbnail_url || course.imageUrl || "/placeholder.jpg",
            }))
          : fallback);
      } catch {
        if (!controller.signal.aborted) setRecommendations(fallback);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadRecommendations();
    return () => controller.abort();
  }, [initialCourses, query]);

  if (!recommendations.length && !loading) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Personalized learning</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Recommended for you</h2>
          <p className="mt-2 text-sm text-slate-500">{query.trim().length >= 2 ? "Picked using your skills and career interests." : "Courses selected for you to explore next."}</p>
        </div>
        <Link href="/courses" className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-indigo-700 hover:underline">Explore all courses <ArrowRight size={16}/></Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
        {loading && !recommendations.length
          ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-[340px] w-[300px] shrink-0 animate-pulse border border-slate-200 bg-white" />)
          : recommendations.map(course => <div key={course._id} className="snap-start"><CourseCard course={{ ...course, thumbnail: course.thumbnail || course.thumbnail_url || course.imageUrl || "/placeholder.jpg" }}/></div>)}
      </div>
    </section>
  );
}
