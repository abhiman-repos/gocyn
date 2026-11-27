"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

const API = process.env.APP_URL;
type CourseRow = {
  course_id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: string;
  status: string;
  instructor_name: string;
  instructor_email: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
};
type Video = {
  video_id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  scan_status: string;
  scan_provider: string;
  scan_error: string;
  duration_seconds: number | null;
  risk_score: number | null;
  findings: {
    timestamp_seconds: number;
    label: string;
    parent_label: string;
    confidence: number;
  }[];
  moderation_model_version: string;
  media_metadata: Record<string, any>;
  scanned_at: string | null;
  playback_url: string;
  thumbnail_url?: string;
};
type CourseDetail = CourseRow & {
  duration: string;
  learning_outcomes: string[];
  prerequisites: string;
  materials: { material_id: string; title: string; original_name: string; size_bytes: number; download_url: string }[];
  review_note: string;
  reviewed_by_email?: string;
  reviewed_at: string | null;
  sections: {
    section_id: string;
    title: string;
    position: number;
    lessons: {
      lesson_id: string;
      title: string;
      description: string;
      position: number;
      video: Video | null;
    }[];
  }[];
  review_history: any[];
};

function headers(json = false): HeadersInit {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Admin session expired. Sign in again.");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}
async function jsonResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.detail || data.message || "Request failed.");
  return data;
}
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";
const formatSize = (bytes: number) =>
  bytes < 1024 ** 3
    ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
    : `${(bytes / 1024 ** 3).toFixed(2)} GB`;
const formatDuration = (seconds?: number | null) =>
  seconds == null
    ? "Unknown"
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const formatTimestamp = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

export default function CourseReviewPage() {
  const [requestedCourseId, setRequestedCourseId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("in_review");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CourseDetail | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualChecks, setManualChecks] = useState({ visual: false, audio: false, harmful: false, rights: false });
  const manualChecksConfirmed = Object.values(manualChecks).every(Boolean);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const autoOpenedCourseId = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setStatusFilter(status);
    setRequestedCourseId(params.get("course_id"));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jsonResponse(
        await fetch(`${API}/api/admin/courses/?status=${statusFilter}`, {
          headers: headers(),
          cache: "no-store",
        }),
      );
      setCourses(data.results || []);
    } catch (error: any) {
      toast.error(error.message || "Could not load courses.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);
  useEffect(() => {
    void load();
  }, [load]);

  const openCourse = useCallback(async (row: CourseRow) => {
    try {
      const data = await jsonResponse(
        await fetch(`${API}/api/admin/courses/${row.course_id}/`, {
          headers: headers(),
          cache: "no-store",
        }),
      );
      setSelected(data);
      setNote(data.review_note || "");
      setManualChecks({ visual: false, audio: false, harmful: false, rights: false });
    } catch (error: any) {
      toast.error(error.message || "Could not load course details.");
    }
  }, []);

  useEffect(() => {
    if (!requestedCourseId) {
      autoOpenedCourseId.current = null;
      return;
    }
    if (autoOpenedCourseId.current === requestedCourseId) return;
    const row = courses.find((course) => course.course_id === requestedCourseId);
    if (!row) return;
    autoOpenedCourseId.current = requestedCourseId;
    void openCourse(row);
  }, [courses, openCourse, requestedCourseId]);

  const review = async (action: "approve" | "reject" | "suspend") => {
    if (!selected) return;
    try {
      setBusy(true);
      const data = await jsonResponse(
        await fetch(`${API}/api/admin/courses/${selected.course_id}/action/`, {
          method: "POST",
          headers: headers(true),
          body: JSON.stringify({ action, note, manual_checks: manualChecks }),
        }),
      );
      toast.success(
        action === "approve"
          ? "Course published."
          : action === "suspend"
            ? "Course suspended."
            : "Course rejected.",
      );
      setSelected({ ...selected, ...data });
      await load();
    } catch (error: any) {
      toast.error(error.message || "Course review failed.");
    } finally {
      setBusy(false);
    }
  };
  const videos: Video[] = selected?.sections.flatMap(section => section.lessons.map(lesson => lesson.video).filter((video): video is Video => video !== null)) || [];
  const flaggedCount = videos.filter(video => video?.scan_status === "flagged").length;
  const needsHumanCount = videos.filter(video => ["manual_review", "failed"].includes(video?.scan_status || "")).length;
  const pendingCount = videos.filter(video => ["queued", "scanning", "uploading"].includes(video?.scan_status || "")).length;
  const highestRisk = videos.reduce((risk, video) => Math.max(risk, video?.risk_score ?? 0), 0);

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course review</h1>
          <p className="mt-1 text-sm text-gray-500">
            Inspect course content and video moderation findings before
            publication.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="in_review">Awaiting review</option>
            <option value="processing">Processing</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="all">All courses</option>
          </select>
          <button
            onClick={() => void load()}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </header>
      <section className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <p className="p-10 text-center text-gray-500">Loading courses…</p>
        ) : !courses.length ? (
          <p className="p-10 text-center text-gray-500">
            No courses in this queue.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Instructor</th>
                  <th className="px-5 py-3">Category / Level</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.map((course) => (
                  <tr key={course.course_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" className="aspect-video w-24 shrink-0 border object-cover" /> : <div className="aspect-video w-24 shrink-0 border bg-gray-100" />}
                        <div className="min-w-0"><div className="font-semibold text-gray-900">
                        {course.title}
                      </div>
                      <div className="max-w-md truncate text-gray-500">
                        {course.description}
                      </div></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>{course.instructor_name || "—"}</div>
                      <div className="text-gray-500">
                        {course.instructor_email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {course.category} · {course.level}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {formatDate(course.updated_at)}
                    </td>
                    <td className="px-5 py-4 capitalize">
                      {course.status.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => void openCourse(course)}
                        className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"
                      >
                        Review course
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Review course"
        >
          <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selected.instructor_name} · {selected.instructor_email} ·{" "}
                  {selected.category} · {selected.level}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Updated {formatDate(selected.updated_at)} · Status:{" "}
                  {selected.status.replaceAll("_", " ")}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close review"
              >
                ✕
              </button>
            </header>
            <div className="space-y-6 overflow-y-auto p-5">
              <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                {selected.thumbnail_url && <div className="sm:col-span-2"><img src={selected.thumbnail_url} alt={`${selected.title} course thumbnail`} className="aspect-video w-full max-w-2xl border bg-gray-100 object-cover" /></div>}
                <div className="sm:col-span-2">
                  <h3 className="font-semibold">Course overview</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {selected.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Price
                  </p>
                  <p className="mt-1">₹{selected.price}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Duration
                  </p>
                  <p className="mt-1">{(selected as any).duration || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Learning outcomes
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {(selected.learning_outcomes || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Prerequisites
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {selected.prerequisites || "None specified"}
                  </p>
                </div>
              </section>
              {selected.materials?.length > 0 && <section className="border border-gray-200 bg-white p-4"><h3 className="font-semibold">Course resources</h3><ul className="mt-2 divide-y">{selected.materials.map(material => <li key={material.material_id} className="flex items-center justify-between gap-4 py-2 text-sm"><span className="min-w-0 truncate">{material.title} <span className="text-gray-500">· {formatSize(material.size_bytes)}</span></span><a href={material.download_url} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-blue-700 underline">Review file</a></li>)}</ul></section>}
              <section aria-label="Moderation summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Summary label="Video lessons" value={String(videos.length)} tone="neutral" />
                <Summary label="Flagged videos" value={String(flaggedCount)} tone={flaggedCount ? "red" : "green"} />
                <Summary label="Manual review / failed" value={String(needsHumanCount)} tone={needsHumanCount ? "amber" : "green"} />
                <Summary label="Highest adult-content risk" value={`${highestRisk}/100`} tone={highestRisk >= 50 ? "red" : highestRisk > 0 ? "amber" : "green"} />
              </section>
              {pendingCount > 0 && <p role="status" className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{pendingCount} video{pendingCount === 1 ? " is" : "s are"} still processing. Review the scan results again when processing finishes.</p>}
              <section className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <h3 className="font-semibold">Human review checklist</h3>
                <p className="mt-1">Automated video moderation reports visual-content labels and timestamps. It does not verify spoken abusive language, copyright ownership, plagiarism, or every form of harmful content. Listen to the audio, inspect the lessons and course materials, and verify rights before approving.</p>
              </section>
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Course content and video review
                </h3>
                {selected.sections.map((section) => (
                  <div key={section.section_id} className="space-y-3">
                    <h4 className="rounded-lg bg-slate-100 px-3 py-2 font-semibold">
                      {section.title}
                    </h4>
                    {section.lessons.map((lesson) => (
                      <article
                        key={lesson.lesson_id}
                        className="space-y-4 rounded-xl border p-4"
                      >
                        <div>
                          <h5 className="font-semibold">
                            {lesson.position}. {lesson.title}
                          </h5>
                          {lesson.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        {lesson.video ? (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <Info
                                label="File"
                                value={lesson.video.original_name}
                              />
                              <Info
                                label="Type / size"
                                value={`${lesson.video.content_type} · ${formatSize(lesson.video.size_bytes)}`}
                              />
                              <Info
                                label="Duration"
                                value={formatDuration(
                                  lesson.video.duration_seconds,
                                )}
                              />
                              <Info
                                label="Resolution / frame rate"
                                value={`${lesson.video.media_metadata?.FrameWidth || "?"}×${lesson.video.media_metadata?.FrameHeight || "?"} · ${lesson.video.media_metadata?.FrameRate || "?"} fps`}
                              />
                              <Info
                                label="Codec / format"
                                value={`${lesson.video.media_metadata?.Codec || "?"} · ${lesson.video.media_metadata?.Format || "?"}`}
                              />
                              <Info
                                label="Moderation state"
                                value={lesson.video.scan_status.replaceAll(
                                  "_",
                                  " ",
                                )}
                              />
                              <Info
                                label="Provider / model"
                                value={`${lesson.video.scan_provider || "—"} · ${lesson.video.moderation_model_version || "—"}`}
                              />
                              <Info
                                label="Adult-content risk score"
                                value={
                                  lesson.video.risk_score == null
                                    ? "Unavailable; manual review required"
                                    : `${lesson.video.risk_score}/100`
                                }
                              />
                              <Info
                                label="Scanned at"
                                value={formatDate(lesson.video.scanned_at)}
                              />
                            </div>
                            {lesson.video.risk_score != null && <div className="border border-gray-200 bg-white p-3"><div className="mb-2 flex justify-between text-xs font-semibold"><span>Adult-content risk</span><span>{lesson.video.risk_score}/100</span></div><div className="h-3 w-full border border-gray-300 bg-gray-100" role="meter" aria-label="Adult-content risk score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lesson.video.risk_score}><div className={`h-full ${lesson.video.risk_score >= 70 ? "bg-red-600" : lesson.video.risk_score >= 35 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${Math.max(0, Math.min(100, lesson.video.risk_score))}%` }} /></div></div>}
                            {lesson.video.scan_error && (
                              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                {lesson.video.scan_error}
                              </p>
                            )}
                            <video
                              controls
                              preload="metadata"
                              controlsList="nodownload"
                              src={lesson.video.playback_url}
                              poster={lesson.video.thumbnail_url}
                              ref={element => { videoRefs.current[lesson.video!.video_id] = element; }}
                              className="aspect-video max-h-[65vh] w-full border bg-black object-contain"
                              aria-label={`Review ${lesson.title}`}
                            />
                            {lesson.video.findings?.length ? (
                              <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                      <th className="px-3 py-2">
                                        Time in video
                                      </th>
                                      <th className="px-3 py-2">Label</th>
                                      <th className="px-3 py-2">Category</th>
                                      <th className="px-3 py-2">Confidence</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {lesson.video.findings.map(
                                      (finding, index) => (
                                        <tr
                                          key={`${finding.timestamp_seconds}-${finding.label}-${index}`}
                                        >
                                          <td className="px-3 py-2 tabular-nums">
                                            <button type="button" onClick={() => { const player = videoRefs.current[lesson.video!.video_id]; if (player) { player.currentTime = finding.timestamp_seconds; void player.play(); } }} className="font-medium text-blue-700 underline underline-offset-2">{formatTimestamp(finding.timestamp_seconds)}</button>
                                          </td>
                                          <td className="px-3 py-2">
                                            {finding.label}
                                          </td>
                                          <td className="px-3 py-2">
                                            {finding.parent_label || "—"}
                                          </td>
                                          <td className="px-3 py-2">
                                            {Number(finding.confidence).toFixed(1)}%
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No automated moderation findings. A clean result
                                does not replace the admin’s course review.
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                            No video is attached to this lesson.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ))}
              </section>
              {selected.review_history?.length > 0 && (
                <section>
                  <h3 className="font-semibold">Review history</h3>
                  <div className="mt-2 space-y-2">
                    {selected.review_history.map((event, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-gray-50 p-3 text-sm"
                      >
                        <span className="capitalize">
                          {event.from_status.replaceAll("_", " ")} →{" "}
                          {event.to_status.replaceAll("_", " ")}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          · {event.actor_email} · {formatDate(event.created_at)}
                        </span>
                        {event.note && (
                          <p className="mt-1 text-gray-700">{event.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <label className="block text-sm font-semibold">
                Admin review note
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                  placeholder="Required when approving flagged or unscannable videos"
                />
              </label>
              <section className="space-y-3 border border-gray-300 bg-white p-4" aria-label="Required review checklist">
                <h3 className="font-semibold">Complete each review before approval</h3>
                {([
                  ["visual", "I reviewed the visual moderation findings and checked the video for nudity or other prohibited imagery."],
                  ["audio", "I listened to the lesson audio and checked for abusive or otherwise prohibited speech."],
                  ["harmful", "I reviewed the course and lessons for harmful, dangerous, or misleading content."],
                  ["rights", "I verified copyright ownership, licenses, and permission for the submitted material."],
                ] as const).map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={manualChecks[key]} onChange={event => setManualChecks(current => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-blue-700"/><span>{label}</span></label>)}
                {!manualChecksConfirmed && <p className="text-xs text-gray-600">Approval stays disabled until all four checks are complete.</p>}
              </section>
            </div>
            <footer className="flex flex-wrap justify-end gap-2 border-t bg-gray-50 p-4">
              <button
                disabled={busy}
                onClick={() => void review("reject")}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              {selected.status !== "suspended" && (
                <button
                  disabled={busy}
                  onClick={() => void review("suspend")}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              <button
                disabled={busy || selected.status === "processing" || !manualChecksConfirmed}
                onClick={() => void review("approve")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? "Saving…"
                  : selected.status === "published"
                    ? "Republish"
                    : "Approve and publish"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: "neutral" | "red" | "amber" | "green" }) {
  const colors = {
    neutral: "border-gray-200 bg-white text-gray-900",
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
  return <div className={`border p-3 ${colors[tone]}`}><p className="text-xs font-semibold uppercase text-gray-600">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></div>;
}
