"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useAuth } from "@/src/context/AuthContext";
import {
  ArrowLeft,
  Loader2,
  Target,
  CheckCircle,
  PlayCircle,
  BookOpen,
  MonitorPlay,
  Star,
  Award,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  GraduationCap,
  Share2,
} from "lucide-react";
import PurchaseCard from "@/src/components/pages/PurchaseCard";
import CourseSponsorSection from "@/src/components/CourseSponsorSection";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function CourseDetail({ id, initialCourse }: { id: string; initialCourse?: any }) {
  const courseId = id;

  const [course, setCourse] = useState<any>(initialCourse || null);
  const [loading, setLoading] = useState(!initialCourse);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [suggestedCourses, setSuggestedCourses] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumePositionRef = useRef(0);
  const lastPlaybackSavedAtRef = useRef(0);
  const playbackSaveInFlightRef = useRef(false);
  const latestPlaybackRef = useRef({ lessonId: "", position: 0 });

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "info" | "error">(
    "success",
  );
  const [openSections, setOpenSections] = useState<number[]>([0]);
  const [shareMessage, setShareMessage] = useState("");

  const toggleSection = (idx: number) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const durationLabel = (seconds?: number | null) => seconds == null ? "" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const playbackLabel = (seconds?: number | null) => {
    const value = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
  };
  const curriculum = learningData?.sections?.length
    ? learningData.sections.map((section: any) => ({ section: section.title, lessons: section.lessons.map((lesson: any) => ({ ...lesson, duration: durationLabel(lesson.duration_seconds), preview: true, accessible: true })) }))
    : (course?.curriculum || []).map((section: any) => ({ ...section, lessons: (section.lessons || []).map((lesson: any) => ({ ...lesson, preview: Boolean(lesson.is_preview), accessible: Boolean(lesson.is_preview), duration: durationLabel(lesson.duration_seconds) })), section: section.section || section.title }));
  const relatedCourses = suggestedCourses;
  const avgRating = Number(course?.avgRating) || (reviews.length ? reviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 0), 0) / reviews.length : 0);
  const learningOutcomes = Array.isArray(course?.learning_outcomes) ? course.learning_outcomes.filter(Boolean) : [];
  const requirements = course?.prerequisites || course?.requirements || "";
  const totalLessons = curriculum.reduce(
    (sum: number, s: any) => sum + s.lessons.length,
    0,
  );
  const learningLessons = (learningData?.sections || []).flatMap((section: any) =>
    (section.lessons || []).map((lesson: any) => ({ ...lesson, section_title: section.title })),
  );
  const resumeLesson = learningLessons.find((lesson: any) => !lesson.completed && lesson.last_position_seconds > 0)
    || learningLessons.find((lesson: any) => !lesson.completed);
  const activeLesson = learningLessons.find((lesson: any) => lesson.lesson_id === activeLessonId);

  const router = useRouter();
  const { user } = useAuth();

  const showModal = (
    title: string,
    message: string,
    type: "success" | "info" | "error",
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowEnrollModal(true);
  };

  const shareCourse = async () => {
    const courseUrl = `${window.location.origin}/course/${encodeURIComponent(courseId)}`;
    const shareData = { title: course?.title || "Course", text: `Explore ${course?.title || "this course"} on Gocyn.`, url: courseUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(courseUrl);
        setShareMessage("Course link copied. Share it with a student.");
        window.setTimeout(() => setShareMessage(""), 3000);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(courseUrl);
        setShareMessage("Course link copied. Share it with a student.");
        window.setTimeout(() => setShareMessage(""), 3000);
      } catch {
        setShareMessage("Could not share this course link. Copy the page address from your browser.");
        window.setTimeout(() => setShareMessage(""), 4000);
      }
    }
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!isEnrolled) return;
    try {
      setIsSubmittingReview(true);
      const response = await fetch(`${API}/api/courses/${courseId}/reviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || "Your review could not be submitted.");
      const submittedReview = data.review || data;
      setReviews(current => [submittedReview, ...current.filter(review => review.id !== submittedReview.id)]);
      setReviewComment("");
      showModal("Review submitted", "Thanks for sharing your experience with this course.", "success");
    } catch (error: any) {
      showModal("Review not submitted", error.message || "Please try again.", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openLearningSpace = async (token: string, courseIdentifier: string) => {
    const response = await fetch(`${API}/api/courses/${courseIdentifier}/learning/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const learning = await response.json().catch(() => ({}));
    if (!response.ok || !learning.course) {
      throw new Error(learning.detail || "Your course access could not be loaded. Please try again.");
    }
    setIsEnrolled(true);
    setLearningData(learning);
    router.push(`/course/${courseIdentifier}/learn`);
  };

  const verifyCoursePayment = async (payment: any, token: string, courseIdentifier: string) => {
    const verification = await fetch(`${API}/api/courses/${courseIdentifier}/payment-verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payment),
    });
    const verified = await verification.json().catch(() => ({}));
    if (!verification.ok) throw new Error(verified.detail || "Payment could not be verified.");
    setPendingPayment(null);
    await openLearningSpace(token, courseIdentifier);
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const courseIdentifier = String(course._id || course.id || courseId || "");
    if (!courseIdentifier) return;
    if (isEnrolling) return;
    if (isEnrolled) {
      try {
        setIsEnrolling(true);
        const token = localStorage.getItem("token");
        if (!token) { router.push("/login"); return; }
        await openLearningSpace(token, courseIdentifier);
      } catch (error: any) {
        showModal("Course unavailable", error.message || "Your course could not be opened. Please try again.", "error");
      } finally { setIsEnrolling(false); }
      return;
    }

    let checkoutOpened = false;
    try {
      setIsEnrolling(true);
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      if (pendingPayment?.courseId === courseIdentifier) {
        await verifyCoursePayment(pendingPayment.payment, token, courseIdentifier);
        return;
      }

      const numericCoursePrice = Number(course.price);
      const isPaidCourse = Number.isFinite(numericCoursePrice) && numericCoursePrice > 0;
      if (isPaidCourse) {
        router.push(`/course/${courseIdentifier}/checkout`);
        return;
      }
      const res = await fetch(`${API}/api/courses/enroll/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: courseIdentifier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Enrollment failed");
      }

      await openLearningSpace(token, courseIdentifier);
    } catch (err: any) {
      showModal(
        "Enrollment Failed",
        err.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      if (!checkoutOpened) setIsEnrolling(false);
    }
  };

  const FALLBACK_BANNER =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1920";

  function getYouTubeId(url?: string) {
    if (!url) return "";
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : "";
  }

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    if (initialCourse) {
      setCourse(initialCourse);
      setReviews(Array.isArray(initialCourse.reviews) ? initialCourse.reviews : []);
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API}/api/courses/${courseId}/`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCourse(data);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, initialCourse]);

  useEffect(() => {
    if (!course) return;
    if (Array.isArray(course.relatedCourses) && course.relatedCourses.length) {
      setSuggestedCourses(course.relatedCourses);
      return;
    }
    let cancelled = false;
    void fetch(`${API}/api/courses/list/`, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        const rows = Array.isArray(data) ? data : data.courses || data.results || [];
        const currentId = String(course._id || course.id || courseId);
        const sameCategory = rows.filter((item: any) => String(item._id || item.id) !== currentId && (!course.category || item.category === course.category));
        const suggestions = (sameCategory.length ? sameCategory : rows.filter((item: any) => String(item._id || item.id) !== currentId)).slice(0, 4);
        setSuggestedCourses(suggestions);
      }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [course, courseId]);

  useEffect(() => {
    if (!courseId || !user || !course) { setIsEnrolled(false); setLearningData(null); return; }
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) return;
    void fetch(`${API}/api/courses/${courseId}/enrollment/`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(async data => {
        if (cancelled || !data) return;
        setIsEnrolled(Boolean(data.enrolled));
        if (data.enrolled) {
          const learning = await fetch(`${API}/api/courses/${courseId}/learning/`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
          if (learning.ok && !cancelled) setLearningData(await learning.json());
        } else setLearningData(null);
      }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [courseId, user, course]);

  const markLessonComplete = async (lessonId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const response = await fetch(`${API}/api/courses/${courseId}/lessons/${lessonId}/progress/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const updated = await response.json();
    setLearningData((current: any) => ({ ...current, ...updated, sections: current.sections.map((section: any) => ({ ...section, lessons: section.lessons.map((lesson: any) => lesson.lesson_id === lessonId ? { ...lesson, completed: true } : lesson) })) }));
  };

  const startLesson = async (lesson: any) => {
    if (!lesson?.lesson_id) return;
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (activeLessonId && activeLessonId !== lesson.lesson_id && videoRef.current) {
      await syncPlaybackPosition(activeLessonId, videoRef.current.currentTime, true);
    }
    let playableLesson = lesson;
    try {
      const response = await fetch(`${API}/api/courses/${courseId}/learning/`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (response.ok) {
        const latest = await response.json();
        setLearningData(latest);
        playableLesson = (latest.sections || []).flatMap((section: any) => section.lessons || [])
          .find((item: any) => item.lesson_id === lesson.lesson_id) || lesson;
      }
    } catch {
      // Fall back to the already loaded lesson if a refresh is temporarily unavailable.
    }
    if (!playableLesson?.video_url) return;
    const resumeAt = Math.max(0, Number(playableLesson.last_position_seconds) || 0);
    resumePositionRef.current = resumeAt;
    latestPlaybackRef.current = { lessonId: playableLesson.lesson_id, position: resumeAt };
    lastPlaybackSavedAtRef.current = 0;
    setActiveLessonId(playableLesson.lesson_id);
    setActiveVideoUrl(playableLesson.video_url);
  };

  const syncPlaybackPosition = useCallback(async (lessonId: string, position: number, force = false) => {
    const safePosition = Math.max(0, Math.floor(position));
    latestPlaybackRef.current = { lessonId, position: safePosition };
    if (!lessonId || !Number.isFinite(safePosition) || playbackSaveInFlightRef.current) return;
    const now = Date.now();
    if (!force && now - lastPlaybackSavedAtRef.current < 10_000) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    playbackSaveInFlightRef.current = true;
    lastPlaybackSavedAtRef.current = now;
    try {
      const response = await fetch(`${API}/api/courses/${courseId}/lessons/${lessonId}/playback/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ position_seconds: safePosition }),
        keepalive: force,
      });
      if (!response.ok) return;
      setLearningData((current: any) => current ? ({
        ...current,
        sections: current.sections.map((section: any) => ({
          ...section,
          lessons: section.lessons.map((lesson: any) => lesson.lesson_id === lessonId
            ? { ...lesson, last_position_seconds: safePosition } : lesson),
        })),
      }) : current);
    } catch {
      // The local playback continues; a later timeupdate/pause retries the save.
    } finally {
      playbackSaveInFlightRef.current = false;
      const latest = latestPlaybackRef.current;
      if (latest.lessonId === lessonId && Math.abs(latest.position - safePosition) >= 5) {
        window.setTimeout(() => void syncPlaybackPosition(latest.lessonId, latest.position, true), 0);
      }
    }
  }, [courseId]);

  useEffect(() => {
    if (!isEnrolled || !activeLessonId) return;
    const persistPosition = () => {
      if (latestPlaybackRef.current.lessonId !== activeLessonId) return;
      const player = videoRef.current;
      if (player) void syncPlaybackPosition(activeLessonId, player.currentTime, true);
    };
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") persistPosition(); };
    window.addEventListener("pagehide", persistPosition);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      persistPosition();
      window.removeEventListener("pagehide", persistPosition);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeLessonId, isEnrolled, syncPlaybackPosition]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Course not found
        </h2>
        <Link href="/courses" className="text-indigo-600 hover:underline">
          Return to Courses
        </Link>
      </div>
    );
  }

  const videoId = getYouTubeId(course.youtube);
  const bannerImage = course.imageUrl || FALLBACK_BANNER;
  const price = course.price || course.stipend || "Free";
  const authorName = course.instructor || course.company || "Expert Instructor";
  const duration = course.duration || "Self-paced";
  const category = course.category || "General";

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* ───────────────── Hero (height controlled) ───────────────── */}
      <section className="relative bg-slate-900 text-white pt-8 pb-20 sm:pb-24 lg:pb-28 px-4 sm:px-6">
        <div className="absolute inset-0">
          <img
            src={bannerImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/85 to-slate-900" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-7 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Back to Courses</span>
          </Link>

          <div className="max-w-2xl lg:max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-600 text-white rounded-md">
                {category}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {course.title}
            </h1>

            <p className="mb-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              {course.description || "Explore the course curriculum and learning resources below."}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-slate-300 mb-6">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" />
                <span>{duration}</span>
              </div>

              {course.level && <span className="border border-white/15 px-2.5 py-1 text-xs text-slate-200">{course.level}</span>}
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-indigo-500/80 flex items-center justify-center font-bold text-base text-indigo-400">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-slate-400 text-[11px] uppercase tracking-wider">
                  Created by
                </p>
                <p className="font-semibold text-white text-[15px]">
                  {authorName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} className="text-indigo-400" />
                {totalLessons} lessons
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void shareCourse()} className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10" aria-label="Share course link with students">
                <Share2 size={16} /> Share course
              </button>
              {shareMessage && <span role="status" className="text-sm text-emerald-200">{shareMessage}</span>}
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── Main Content ───────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="order-last space-y-6 pt-8 lg:order-first lg:col-span-8">
            {/* What you'll learn */}
            {learningOutcomes.length > 0 && <div className="border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
                <Target className="text-indigo-600" size={22} />
                What you&apos;ll learn
              </h2>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                {learningOutcomes.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle
                      className="text-emerald-500 mt-0.5 shrink-0"
                      size={18}
                    />
                    <span className="text-slate-600 text-sm sm:text-[15px]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>}

            {/* Course Content */}
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <MonitorPlay className="text-indigo-600" size={22} />
                  Course Content
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                {curriculum.length} sections • {totalLessons} lectures •{" "}
                {duration} total length
              </p>
              {isEnrolled && learningData && <section className="mb-6 border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Learning dashboard</p><h3 className="mt-1 text-lg font-bold text-slate-900">Your progress</h3><p className="mt-1 text-sm text-slate-600">Keep your momentum. Your lesson progress is saved as you learn.</p></div>
                  <div className="text-right"><span className="text-3xl font-bold tracking-tight text-indigo-700">{learningData.progress || 0}%</span><p className="text-xs font-medium text-slate-500">course complete</p></div>
                </div>
                <div className="mt-5 h-2.5 overflow-hidden bg-slate-200"><div className="h-full bg-gradient-to-r from-indigo-600 to-sky-500 transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, learningData.progress || 0))}%` }} /></div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Lessons completed</p><p className="mt-1 text-lg font-bold text-slate-900">{learningData.completed_lessons || 0}<span className="text-sm font-medium text-slate-400"> / {learningData.total_lessons || 0}</span></p></div>
                  <div className="border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Lessons remaining</p><p className="mt-1 text-lg font-bold text-slate-900">{Math.max(0, (learningData.total_lessons || 0) - (learningData.completed_lessons || 0))}</p></div>
                  <div className="col-span-2 border border-slate-200 bg-white p-3 sm:col-span-1"><p className="text-xs text-slate-500">Learning status</p><p className="mt-1 text-sm font-bold text-emerald-700">{learningData.progress === 100 ? "Course completed" : "In progress"}</p></div>
                </div>
                {resumeLesson?.video_url && <button type="button" onClick={() => startLesson(resumeLesson)} className="mt-4 flex w-full items-center justify-between gap-4 border border-indigo-200 bg-white px-4 py-3 text-left hover:border-indigo-400 hover:bg-indigo-50">
                  <span><span className="block text-xs font-semibold uppercase tracking-wide text-indigo-700">{resumeLesson.last_position_seconds > 0 ? `Resume · ${playbackLabel(resumeLesson.last_position_seconds)}` : "Continue learning"}</span><span className="mt-1 block font-semibold text-slate-900">{resumeLesson.title}</span><span className="text-xs text-slate-500">{resumeLesson.section_title}</span></span><span className="shrink-0 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Continue</span>
                </button>}
              </section>}

              <div className="border border-slate-200  overflow-hidden divide-y divide-slate-200">
                {curriculum.map((section: any, idx: number) => {
                  const isOpen = openSections.includes(idx);
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => toggleSection(idx)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isOpen ? (
                            <ChevronUp
                              size={18}
                              className="text-slate-500 shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                              className="text-slate-500 shrink-0"
                            />
                          )}
                          <span className="font-semibold text-slate-800 text-sm">
                            {section.section}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">
                          {section.lessons.filter((lesson: any) => lesson.completed).length}/{section.lessons.length} complete
                        </span>
                      </button>
                      {isEnrolled && section.lessons.length > 0 && <div className="h-1 bg-slate-100"><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${section.lessons.filter((lesson: any) => lesson.completed).length / section.lessons.length * 100}%` }} /></div>}

                      {isOpen && (
                        <div className="divide-y divide-slate-100">
                          {section.lessons.map((lesson: any, lIdx: number) => (
                            <div
                              key={lIdx}
                              className="flex items-center justify-between px-5 py-3 pl-12 text-sm"
                            >
                              <div className="flex items-center gap-3 text-slate-600">
                                {lesson.preview ? (
                                  <PlayCircle
                                    size={15}
                                    className="text-indigo-500 shrink-0"
                                  />
                                ) : (
                                  <Lock
                                    size={13}
                                    className="text-slate-400 shrink-0"
                                  />
                                )}
                                <span
                                  className={
                                    lesson.preview
                                      ? "text-indigo-600 font-medium"
                                      : ""
                                  }
                                >
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="text-slate-400 text-xs shrink-0">
                                {lesson.duration}
                              </span>
                              {isEnrolled && lesson.video_url && <div className="ml-3 flex shrink-0 items-center gap-2"><button type="button" onClick={() => { setPreviewPlaying(false); startLesson(lesson); }} className="border border-indigo-200 px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50">{activeLessonId === lesson.lesson_id ? "Playing" : lesson.last_position_seconds > 0 ? `Resume ${playbackLabel(lesson.last_position_seconds)}` : "Watch lesson"}</button><button type="button" onClick={() => void markLessonComplete(lesson.lesson_id)} disabled={lesson.completed} className="border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-700 disabled:border-slate-200 disabled:text-slate-400">{lesson.completed ? "Completed" : "Mark done"}</button></div>}
                              {!isEnrolled && lesson.preview && <button type="button" onClick={async () => { try { const response = await fetch(`${API}/api/courses/${courseId}/lessons/${lesson.lesson_id}/preview/`); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.detail || "Preview is not available yet."); setActiveLessonId(lesson.lesson_id); setActiveVideoUrl(data.video_url); setPreviewPlaying(true); resumePositionRef.current = 0; } catch (error: any) { showModal("Preview unavailable", error.message || "Preview is not available yet.", "info"); } }} className="ml-3 shrink-0 border border-indigo-200 px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50">{previewPlaying && activeLessonId === lesson.lesson_id ? "Preview playing" : "Play preview"}</button>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {(isEnrolled || previewPlaying) && activeVideoUrl && <section className="mt-6 overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Now learning</p><h3 className="mt-1 text-sm font-semibold">{activeLesson?.title || "Course lesson"}</h3>{activeLesson?.section_title && <p className="mt-0.5 text-xs text-slate-400">{activeLesson.section_title}</p>}</div><span className="border border-white/15 px-3 py-1 text-xs text-slate-300">Progress saved automatically</span></div>
                <video ref={videoRef} key={activeLessonId || activeVideoUrl} src={activeVideoUrl} controls controlsList="nodownload" className="aspect-video w-full" aria-label={activeLesson?.title || "Course lesson video"}
                  onLoadedMetadata={(event) => { const player = event.currentTarget; const position = resumePositionRef.current; if (position > 0 && (!player.duration || position < player.duration - 1)) player.currentTime = position; }}
                  onTimeUpdate={(event) => { if (activeLessonId) void syncPlaybackPosition(activeLessonId, event.currentTarget.currentTime); }}
                  onPause={(event) => { if (activeLessonId) void syncPlaybackPosition(activeLessonId, event.currentTarget.currentTime, true); }}
                  onEnded={(event) => { if (activeLessonId) { void syncPlaybackPosition(activeLessonId, event.currentTarget.currentTime, true); void markLessonComplete(activeLessonId); } }} />
              </section>}
              {course.materials?.length > 0 && <section className="mt-6 border border-slate-200 p-5"><h3 className="font-semibold text-slate-900">Course resources</h3><ul className="mt-3 divide-y">{course.materials.map((material: any) => { const enrolledMaterial = learningData?.materials?.find((item: any) => item.material_id === material.material_id); return <li key={material.material_id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="truncate">{material.title || material.original_name}</span>{enrolledMaterial?.download_url ? <a href={enrolledMaterial.download_url} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-indigo-700 underline">Download</a> : <span className="shrink-0 text-slate-500">Enroll to access</span>}</li>;})}</ul></section>}
            </div>

            {/* Description */}
            <div className="bg-white p-6 sm:p-8 ">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2.5">
                <BookOpen className="text-indigo-600" size={22} />
                Course Description
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
                {course.description ||
                  "Detailed course description will be available soon."}
              </div>
            </div>

            {/* Prerequisites */}
            {requirements && <div className="border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2.5">
                <Award className="text-indigo-600" size={22} />
                Requirements
              </h2>
              <ul className="space-y-3">
                {(
                  requirements
                )
                  .split("\n")
                  .map((req: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-600 text-[15px]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                      {req.replace("•", "").trim()}
                    </li>
                  ))}
              </ul>
            </div>}

            {/* Reviews */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
                <Star className="text-indigo-600" size={22} />
                Student Reviews
              </h2>

              <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-slate-100">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <span className="text-5xl font-bold text-slate-900">{avgRating ? avgRating.toFixed(1) : "—"}</span>
                  <div className="flex text-amber-400 my-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} fill={i <= Math.round(avgRating) ? "currentColor" : "none"} className={i <= Math.round(avgRating) ? "" : "text-slate-300"} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {(course.reviewsCount || reviews.length).toLocaleString()} {(course.reviewsCount || reviews.length) === 1 ? "review" : "reviews"}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((review: any) => Number(review.rating) === stars).length;
                    const percent = reviews.length ? Math.round(count / reviews.length * 100) : 0;
                    return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-xs text-slate-500">{stars} star</span>
                      <div className="h-2 flex-1 overflow-hidden bg-slate-100"><div className="h-full bg-amber-400" style={{ width: `${percent}%` }} /></div>
                      <span className="w-8 shrink-0 text-right text-xs text-slate-400">{percent}%</span>
                    </div>
                    );
                  })}
                </div>
              </div>

              {isEnrolled ? <form onSubmit={submitReview} className="mb-8 border border-indigo-100 bg-indigo-50/50 p-5">
                <h3 className="font-semibold text-slate-900">Share your course review</h3>
                <p className="mt-1 text-sm text-slate-600">Your feedback helps other learners choose their next course.</p>
                <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Course rating">
                  {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" role="radio" aria-checked={reviewRating === star} aria-label={`${star} star${star === 1 ? "" : "s"}`} onClick={() => setReviewRating(star)} className="p-1 text-amber-500"><Star size={24} fill={star <= reviewRating ? "currentColor" : "none"} /></button>)}
                  <span className="ml-2 text-sm font-medium text-slate-700">{reviewRating} out of 5</span>
                </div>
                <label className="mt-3 block text-sm font-medium text-slate-700">Your review<textarea required minLength={5} maxLength={2000} value={reviewComment} onChange={event => setReviewComment(event.target.value)} rows={4} placeholder="What did you learn? What stood out?" className="mt-1.5 w-full resize-y border border-slate-300 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{reviewComment.length}/2000</span><button type="submit" disabled={isSubmittingReview || reviewComment.trim().length < 5} className="border border-indigo-700 bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{isSubmittingReview ? "Submitting…" : "Submit review"}</button></div>
              </form> : <div className="mb-8 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Enroll in this course to share a review.</div>}

              <div className="space-y-6">
                {reviews.length === 0 ? <p className="border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p> : reviews.map((review: any, i: number) => (
                  <div
                    key={review.review_id || review.id || i}
                    className="pb-6 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">
                        {(review.name || review.user_name || review.full_name || "Student").charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {review.name || review.user_name || review.full_name || "Student"}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={11}
                                fill={
                                  i <= review.rating ? "currentColor" : "none"
                                }
                                className={
                                  i <= review.rating ? "" : "text-slate-300"
                                }
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">
                            {review.date || (review.created_at ? new Date(review.created_at).toLocaleDateString() : "")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">
                      {review.comment || review.review}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <section className="border border-slate-200 bg-white p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">Keep learning</p><h2 className="mt-1 text-xl font-bold text-slate-900">Course suggestions</h2><p className="mt-1 text-sm text-slate-500">Explore more courses you may enjoy.</p></div><Link href="/courses" className="text-sm font-semibold text-indigo-700 hover:underline">Browse all courses</Link></div>
              <div className="mb-8"><CourseSponsorSection /></div>
              {relatedCourses.length ? <div className="grid gap-4 sm:grid-cols-2">
                {relatedCourses.slice(0, 4).map((rc: any) => {
                  const suggestionId = rc._id || rc.id || rc.course_id;
                  const suggestionImage = rc.thumbnail_url || rc.thumbnail || rc.imageUrl || rc.image;
                  return <Link key={suggestionId} href={`/course/${suggestionId}`} className="group overflow-hidden border border-slate-200 bg-white transition-shadow hover:shadow-md">
                    <div className="relative aspect-video bg-slate-100">{suggestionImage ? <img src={suggestionImage} alt={rc.title || "Course"} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Course preview</div>}</div>
                    <div className="p-4"><h3 className="line-clamp-2 font-semibold text-slate-900">{rc.title}</h3><p className="mt-1 text-xs text-slate-500">{rc.instructor || rc.instructor_name || rc.category}</p><p className="mt-3 font-bold text-slate-900">{rc.price === "Free" || Number(rc.price) === 0 ? "Free" : `₹${rc.price}`}</p></div>
                  </Link>;
                })}
              </div> : <div className="border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">More course suggestions will appear here soon.</div>}
            </section>
          </div>

          <aside className="order-first lg:order-last lg:col-span-4 lg:-mt-72">
            <div className="lg:sticky lg:top-6">
              <PurchaseCard videoId={videoId} thumbnail={bannerImage} title={course.title} price={price} duration={duration} isEnrolled={isEnrolled} isEnrolling={isEnrolling} onEnroll={handleEnroll} totalLessons={totalLessons} materialCount={course.materials?.length || 0} progress={learningData?.progress || 0} actionLabel={pendingPayment?.courseId === course._id ? "Retry payment verification" : undefined} />
            </div>
          </aside>

        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      modalType === "success"
                        ? "bg-emerald-100 text-emerald-600"
                        : modalType === "error"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {modalType === "error" ? (
                      <AlertCircle size={22} />
                    ) : (
                      <CheckCircle size={22} />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalTitle}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {modalMessage}
                </p>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
