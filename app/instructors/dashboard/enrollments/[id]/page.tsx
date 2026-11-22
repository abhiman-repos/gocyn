"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_APP_URL;
type Lesson = { lesson_id: string; title: string; completed: boolean; completed_at: string | null };
type Section = { section_id: string; title: string; lessons: Lesson[] };
type Enrollment = {
  id: string;
  student: string;
  email: string;
  course: string;
  date: string;
  status: string;
  amount_paid: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  sections: Section[];
  certificate_issued: boolean;
  certificate_delivery: "automatic" | "manual";
  certificate_id: string | null;
  certificate_issued_at: string | null;
};

export default function EnrollmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");

  const loadEnrollment = useCallback(async () => {
    const token = localStorage.getItem("mentorToken");
    if (!token) {
      setError("Your instructor session expired. Sign in again.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API}/api/instructors/courses/enrollments/${params.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not load student enrollment.");
      setEnrollment(data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load student enrollment.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void loadEnrollment(); }, [loadEnrollment]);

  const issueCertificate = async () => {
    if (!enrollment || enrollment.progress < 100 || enrollment.total_lessons === 0) return;
    const token = localStorage.getItem("mentorToken");
    if (!token) return setError("Your instructor session expired. Sign in again.");
    setIssuing(true);
    try {
      const response = await fetch(`${API}/api/instructors/courses/enrollments/${enrollment.id}/certificate/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not issue the certificate.");
      await loadEnrollment();
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "Could not issue the certificate.");
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <main className="p-8 text-gray-600">Loading enrollment…</main>;
  if (!enrollment) return <main className="space-y-4 p-8"><p className="text-red-700">{error || "Enrollment not found."}</p><Link href="/instructors/dashboard/enrollments" className="text-blue-700 underline">Back to enrollments</Link></main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <Link href="/instructors/dashboard/enrollments" className="text-sm font-medium text-blue-700 underline">← Back to enrollments</Link>
      {error && <div role="alert" className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <section className="border border-gray-200 bg-white">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-gray-200 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{enrollment.student}</h1>
            <a href={`mailto:${enrollment.email}`} className="mt-1 inline-block text-blue-700 underline">{enrollment.email}</a>
            <p className="mt-3 text-gray-700">Course: <span className="font-semibold">{enrollment.course}</span></p>
          </div>
          {enrollment.certificate_issued ? (
            <div className="border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              Sent to learner · {enrollment.certificate_id}
            </div>
          ) : enrollment.certificate_delivery === "automatic" ? (
            <div className="max-w-sm border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              {enrollment.progress === 100
                ? "Automatic delivery is enabled. If the certificate was not emailed, retry course completion or contact support."
                : "The certificate will be emailed automatically when the learner completes every lesson."}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void issueCertificate()}
              disabled={issuing || enrollment.progress < 100 || enrollment.total_lessons === 0}
              className="border border-blue-700 bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
            >
              {issuing ? "Sending certificate…" : enrollment.progress === 100 && enrollment.total_lessons > 0 ? "Send certificate" : "Eligible after all lessons are complete"}
            </button>
          )}
        </header>
        <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-5"><p className="text-xs uppercase text-gray-500">Enrollment date</p><p className="mt-1 font-semibold text-gray-900">{new Date(enrollment.date).toLocaleString("en-IN")}</p></div>
          <div className="p-5"><p className="text-xs uppercase text-gray-500">Status</p><p className="mt-1 font-semibold text-gray-900">{enrollment.status}</p></div>
          <div className="p-5"><p className="text-xs uppercase text-gray-500">Payment</p><p className="mt-1 font-semibold text-gray-900">{Number(enrollment.amount_paid) > 0 ? `₹${Number(enrollment.amount_paid).toLocaleString("en-IN")}` : "Free"}</p></div>
          <div className="p-5"><p className="text-xs uppercase text-gray-500">Progress</p><p className="mt-1 font-semibold text-gray-900">{enrollment.progress}% · {enrollment.completed_lessons}/{enrollment.total_lessons} lessons</p></div>
        </div>
        <div className="border-t border-gray-200 px-5 py-4 text-sm">
          <span className="font-semibold text-gray-900">Certificate delivery: </span>
          <span className="text-gray-700">{enrollment.certificate_delivery === "automatic" ? "Automatic after course completion" : "Manual by instructor after completion review"}</span>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <header className="border-b border-gray-200 p-5"><h2 className="text-lg font-semibold text-gray-900">Course progress</h2></header>
        <div className="space-y-6 p-5">
          <div className="h-3 w-full border border-gray-300 bg-gray-100">
            <div className="h-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, enrollment.progress))}%` }} />
          </div>
          {enrollment.sections.map((section) => (
            <div key={section.section_id} className="border border-gray-200">
              <h3 className="border-b border-gray-200 bg-gray-50 p-3 font-semibold text-gray-900">{section.title}</h3>
              <ul className="divide-y divide-gray-200">
                {section.lessons.map((lesson) => (
                  <li key={lesson.lesson_id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                    <span className="text-gray-800">{lesson.title}</span>
                    <span className={lesson.completed ? "font-medium text-green-700" : "text-gray-500"}>
                      {lesson.completed ? `Completed${lesson.completed_at ? ` · ${new Date(lesson.completed_at).toLocaleDateString("en-IN")}` : ""}` : "Not completed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {enrollment.sections.length === 0 && <p className="text-sm text-gray-500">No course lessons are available.</p>}
        </div>
      </section>
    </main>
  );
}
