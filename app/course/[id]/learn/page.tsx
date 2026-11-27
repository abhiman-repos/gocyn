"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, CirclePlay, Download, Loader2, LockKeyhole, Play, RotateCcw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;
type Lesson = { lesson_id: string; title: string; description?: string; duration_seconds?: number | null; video_url: string; completed: boolean; last_position_seconds: number };
type Section = { section_id: string; title: string; lessons: Lesson[] };

const secondsLabel = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function CourseLearningPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [learning, setLearning] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshingVideo, setRefreshingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumeAtRef = useRef(0);
  const savingRef = useRef(false);
  const latestRef = useRef({ lessonId: "", seconds: 0 });
  const savedAtRef = useRef(0);

  const flatLessons = useMemo(() => (learning?.sections || []).flatMap((section: Section) => section.lessons.map(lesson => ({ ...lesson, section_title: section.title }))), [learning]);
  const activeLesson = flatLessons.find((lesson: any) => lesson.lesson_id === activeLessonId) || null;

  const fetchLearning = useCallback(async (token: string) => {
    const response = await fetch(`${API}/api/courses/${id}/learning/`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Your course learning space could not be loaded.");
    return data;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.replace("/login"); return; }
      try {
        const learningData = await fetchLearning(token);
        if (!learningData.course) throw new Error("Course details are unavailable for this enrollment.");
        if (cancelled) return;
        setCourse(learningData.course);
        setLearning(learningData);
        const lessons: Lesson[] = (learningData.sections || []).flatMap((section: Section) => section.lessons || []);
        const first = lessons.find(lesson => !lesson.completed && lesson.last_position_seconds > 0 && lesson.video_url)
          || lessons.find(lesson => !lesson.completed && lesson.video_url)
          || lessons.find(lesson => lesson.video_url);
        if (first) {
          setActiveLessonId(first.lesson_id);
          resumeAtRef.current = first.completed ? 0 : Math.max(0, first.last_position_seconds || 0);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not open your course.");
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [fetchLearning, id, router]);

  const savePlayback = useCallback(async (lessonId: string, seconds: number, force = false) => {
    const position = Math.max(0, Math.floor(seconds));
    latestRef.current = { lessonId, seconds: position };
    if (!lessonId || savingRef.current || (!force && Date.now() - savedAtRef.current < 8000)) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    savingRef.current = true;
    savedAtRef.current = Date.now();
    try {
      const response = await fetch(`${API}/api/courses/${id}/lessons/${lessonId}/playback/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ position_seconds: position }), keepalive: force,
      });
      if (!response.ok) return;
      setLearning((current: any) => current ? ({ ...current, sections: current.sections.map((section: Section) => ({ ...section, lessons: section.lessons.map(lesson => lesson.lesson_id === lessonId ? { ...lesson, last_position_seconds: position } : lesson) })) }) : current);
    } catch { /* Resume position will retry on the next player event. */ }
    finally {
      savingRef.current = false;
      const latest = latestRef.current;
      if (latest.lessonId === lessonId && Math.abs(latest.seconds - position) >= 3) window.setTimeout(() => void savePlayback(latest.lessonId, latest.seconds, true), 0);
    }
  }, [id]);

  const chooseLesson = async (lesson: Lesson) => {
    if (!lesson.video_url) return;
    if (activeLessonId && videoRef.current) await savePlayback(activeLessonId, videoRef.current.currentTime, true);
    setRefreshingVideo(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.replace("/login"); return; }
      const latest = await fetchLearning(token);
      setLearning(latest);
      const fresh = (latest.sections || []).flatMap((section: Section) => section.lessons || []).find((item: Lesson) => item.lesson_id === lesson.lesson_id) || lesson;
      resumeAtRef.current = fresh.completed ? 0 : Math.max(0, fresh.last_position_seconds || 0);
      latestRef.current = { lessonId: fresh.lesson_id, seconds: resumeAtRef.current };
      savedAtRef.current = 0;
      setActiveLessonId(fresh.lesson_id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this lesson.");
    } finally { setRefreshingVideo(false); }
  };

  const markComplete = async (lesson: Lesson) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const response = await fetch(`${API}/api/courses/${id}/lessons/${lesson.lesson_id}/progress/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.detail || "Could not update lesson progress."); return; }
    setLearning((current: any) => current ? ({ ...current, ...result, sections: current.sections.map((section: Section) => ({ ...section, lessons: section.lessons.map(item => item.lesson_id === lesson.lesson_id ? { ...item, completed: true } : item) })) }) : current);
  };

  useEffect(() => {
    const persist = () => { const player = videoRef.current; if (player && activeLessonId) void savePlayback(activeLessonId, player.currentTime, true); };
    const visibility = () => { if (document.visibilityState === "hidden") persist(); };
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", visibility);
    return () => { persist(); window.removeEventListener("pagehide", persist); document.removeEventListener("visibilitychange", visibility); };
  }, [activeLessonId, savePlayback]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="flex items-center gap-3"><Loader2 className="animate-spin"/>Opening your learning space…</div></main>;
  if (error && !course) return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white"><div><p className="text-lg font-semibold">Course access unavailable</p><p className="mt-2 text-sm text-slate-300">{error}</p><Link href={`/course/${id}`} className="mt-5 inline-flex border border-white/20 px-4 py-2">Back to course</Link></div></main>;

  const progress = Math.max(0, Math.min(100, Number(learning?.progress) || 0));
  const lessonsLeft = Math.max(0, (learning?.total_lessons || 0) - (learning?.completed_lessons || 0));

  return <main className="min-h-screen bg-[#f5f6f8] text-slate-900">
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#111827] px-4 text-white sm:px-7">
      <div className="flex min-w-0 items-center gap-4"><Link href="/profile" aria-label="Back to profile" className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 hover:bg-white/10"><ArrowLeft size={17}/></Link><div className="min-w-0"><p className="truncate text-sm font-semibold">{course?.title}</p><p className="text-[11px] text-slate-400">Your learning space</p></div></div>
      <Link href="/profile" className="hidden text-sm text-slate-300 hover:text-white sm:block">My learning</Link>
    </header>

    <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 bg-[#0b0f18]">
        <div className="mx-auto max-w-5xl p-3 sm:p-6 lg:p-8">
          <div className="overflow-hidden border border-white/10 bg-black shadow-2xl">
            {activeLesson?.video_url ? <video ref={videoRef} key={`${activeLesson.lesson_id}:${activeLesson.video_url}`} src={activeLesson.video_url} controls playsInline controlsList="nodownload" className="aspect-video w-full bg-black" onLoadedMetadata={event => { const player = event.currentTarget; const position = resumeAtRef.current; if (position > 0 && (!player.duration || position < player.duration - 1)) player.currentTime = position; }} onTimeUpdate={event => { if (activeLessonId) void savePlayback(activeLessonId, event.currentTarget.currentTime); }} onPause={event => { if (activeLessonId) void savePlayback(activeLessonId, event.currentTarget.currentTime, true); }} onEnded={event => { if (activeLesson) { void savePlayback(activeLesson.lesson_id, event.currentTarget.currentTime, true); void markComplete(activeLesson); } }} /> : <div className="grid aspect-video place-items-center text-slate-400"><div className="text-center"><CirclePlay size={42} className="mx-auto mb-3 text-indigo-400"/><p>{refreshingVideo ? "Preparing lesson…" : "Select a lesson to begin"}</p></div></div>}
          </div>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4 text-white"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">{activeLesson?.section_title || course?.category || "Course lesson"}</p><h1 className="mt-2 text-xl font-bold sm:text-2xl">{activeLesson?.title || course?.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{activeLesson?.description || "Continue at your own pace. Your learning progress is saved automatically."}</p></div>{activeLesson && <button onClick={() => void markComplete(activeLesson)} disabled={activeLesson.completed} className="inline-flex shrink-0 items-center gap-2 border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:text-slate-500">{activeLesson.completed ? <><Check size={16}/> Completed</> : "Mark complete"}</button>}</div>
          <div className="mt-8 border border-white/10 bg-white/[0.04] p-4 text-white sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Course progress</p><p className="mt-1 text-sm text-slate-300">{learning?.completed_lessons || 0} of {learning?.total_lessons || 0} lessons complete · {lessonsLeft} remaining</p></div><span className="text-2xl font-bold text-indigo-300">{progress}%</span></div><div className="mt-4 h-2 bg-white/10"><div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{width:`${progress}%`}}/></div>{progress === 100 && <p className="mt-3 text-sm font-medium text-emerald-300">Course completed. Your completion is recorded.</p>}</div>
          {learning?.materials?.length > 0 && <section className="mt-7 border border-white/10 bg-white/[0.04] p-5 text-white"><h2 className="font-semibold">Course resources</h2><div className="mt-3 divide-y divide-white/10">{learning.materials.map((material: any) => <a key={material.material_id} href={material.download_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-3 text-sm text-slate-300 hover:text-white"><span className="truncate">{material.title || material.original_name}</span><Download size={16} className="shrink-0 text-indigo-300"/></a>)}</div></section>}
        </div>
      </section>

      <aside className="border-l border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Course content</p><h2 className="mt-1 font-bold">{course?.title}</h2></div><span className="text-sm font-bold text-indigo-700">{progress}%</span></div><div className="mt-3 h-1.5 bg-slate-100"><div className="h-full bg-indigo-600" style={{width:`${progress}%`}}/></div></div>
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
          {(learning?.sections || []).map((section: Section, sectionIndex: number) => {
            const completed = section.lessons.filter(lesson => lesson.completed).length;
            return <section key={section.section_id} className="border-b border-slate-200"><div className="bg-slate-50 px-5 py-3"><div className="text-sm font-semibold">{sectionIndex + 1}. {section.title}</div><p className="mt-1 text-xs text-slate-500">{completed}/{section.lessons.length} lessons complete</p></div><div className="divide-y divide-slate-100">{section.lessons.map((lesson, lessonIndex) => <button key={lesson.lesson_id} type="button" onClick={() => void chooseLesson(lesson)} disabled={!lesson.video_url || refreshingVideo} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${activeLessonId === lesson.lesson_id ? "border-l-2 border-indigo-600 bg-indigo-50" : "hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-60`}><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border text-[11px] font-semibold ${lesson.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : activeLessonId === lesson.lesson_id ? "border-indigo-200 bg-indigo-100 text-indigo-700" : "border-slate-200 text-slate-500"}`}>{lesson.completed ? <Check size={13}/> : lesson.video_url ? <Play size={11}/> : <LockKeyhole size={11}/>}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-5">{lessonIndex + 1}. {lesson.title}</span><span className="mt-1 flex items-center gap-2 text-xs text-slate-500">{lesson.duration_seconds ? secondsLabel(lesson.duration_seconds) : "Video lesson"}{lesson.last_position_seconds > 0 && !lesson.completed && <span className="text-indigo-700">Resume · {secondsLabel(lesson.last_position_seconds)}</span>}</span></span></button>)}</div></section>;
          })}
        </div>
        <div className="border-t border-slate-200 p-4"><Link href={`/course/${id}`} className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={15}/> Course overview</Link></div>
      </aside>
    </div>
    {error && <div role="status" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg">{error}<button onClick={() => setError("")} className="ml-3 font-bold">Dismiss</button></div>}
  </main>;
}
