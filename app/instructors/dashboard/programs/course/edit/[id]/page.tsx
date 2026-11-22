"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;
type Draft = {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: string;
  learning_outcomes: string[];
  prerequisites: string;
  certificate_delivery: "automatic" | "manual";
  status: string;
  thumbnail_url?: string;
  materials: { material_id: string; title: string; original_name: string; size_bytes: number; download_url?: string }[];
  sections: { section_id: string; title: string; position: number; lessons: { lesson_id: string; title: string; position: number; video?: { original_name: string; scan_status: string; duration_seconds: number | null; thumbnail_url: string } }[] }[];
};
const CATEGORIES = ["Web Development", "Mobile Development", "Data Science", "AI & Machine Learning", "Cloud Computing", "DevOps", "Cybersecurity", "UI/UX Design", "Digital Marketing", "Business & Entrepreneurship", "Personal Development"];
const PRICES = [0, 299, 499, 799, 999, 1199, 1499, 1999, 2499, 2999, 3999, 4999, 5999, 6999, 7999, 8999, 9999];
function headers(json = false): HeadersInit {
  const token = localStorage.getItem("mentorToken");
  if (!token) throw new Error("Instructor session expired.");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}
async function dataOf(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.detail || data.message || "Request failed.");
  return data;
}

export default function EditInstructorCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Draft | null>(null);
  const [learning, setLearning] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [moduleDraft, setModuleDraft] = useState({ title: "", position: "0" });
  const [savingModule, setSavingModule] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [videoUpload, setVideoUpload] = useState<string | null>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dataOf(
        await fetch(`${API}/api/instructors/courses/${params.id}/`, {
          headers: headers(),
          cache: "no-store",
        }),
      );
      setCourse({ ...result, price: String(Number(result.price) || 0), materials: result.materials || [] });
      setLearning((result.learning_outcomes || []).join("\n"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!course) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...course,
        learning_outcomes: learning
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      };
      await dataOf(
        await fetch(`${API}/api/instructors/courses/${params.id}/`, {
          method: "PATCH",
          headers: headers(true),
          body: JSON.stringify(payload),
        }),
      );
      if (thumbnailFile) {
        const form = new FormData();
        form.append("thumbnail", thumbnailFile);
        await dataOf(await fetch(`${API}/api/instructors/courses/${params.id}/thumbnail/`, { method: "POST", headers: headers(), body: form }));
      }
      for (const file of materialFiles) {
        const form = new FormData(); form.append("file", file); form.append("title", file.name.replace(/\.[^.]+$/, ""));
        await dataOf(await fetch(`${API}/api/instructors/courses/${params.id}/materials/`, { method: "POST", headers: headers(), body: form }));
      }
      await dataOf(
        await fetch(`${API}/api/instructors/courses/${params.id}/submit/`, {
          method: "POST",
          headers: headers(),
        }),
      );
      toast.success("Updated course resubmitted for moderation and review.");
      router.push("/instructors/dashboard/programs");
    } catch (err: any) {
      setError(err.message || "Could not update course.");
    } finally {
      setSaving(false);
    }
  };
  const addModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!moduleTitle.trim()) return;
    setAddingModule(true);
    setError("");
    try {
      await dataOf(await fetch(`${API}/api/instructors/courses/${params.id}/modules/`, {
        method: "POST", headers: headers(true), body: JSON.stringify({ title: moduleTitle.trim(), position: course?.sections?.length || 0 }),
      }));
      setModuleTitle("");
      await load();
      toast.success("Course module added.");
    } catch (err: any) {
      setError(err.message || "Could not add module.");
    } finally {
      setAddingModule(false);
    }
  };
  const beginModuleEdit = (section: NonNullable<Draft["sections"]>[number]) => {
    setEditingModule(section.section_id);
    setModuleDraft({ title: section.title, position: String(section.position) });
    setError("");
  };
  const updateModule = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingModule || !moduleDraft.title.trim()) return;
    const wasPublished = course?.status === "published";
    setSavingModule(true);
    setError("");
    try {
      await dataOf(await fetch(`${API}/api/instructors/courses/modules/${editingModule}/`, {
        method: "PATCH",
        headers: headers(true),
        body: JSON.stringify({ title: moduleDraft.title.trim(), position: Number(moduleDraft.position) }),
      }));
      setEditingModule(null);
      await load();
      toast.success(wasPublished ? "Module updated. Save and resubmit the course for review." : "Module updated.");
    } catch (err: any) {
      setError(err.message || "Could not update module.");
    } finally {
      setSavingModule(false);
    }
  };  const removeResource = async (materialId: string) => {
    try {
      await dataOf(await fetch(`${API}/api/instructors/courses/${params.id}/materials/${materialId}/`, { method: "DELETE", headers: headers() }));
      setCourse(current => current ? { ...current, materials: current.materials.filter(item => item.material_id !== materialId) } : current);
    } catch (err: any) { toast.error(err.message || "Could not remove resource."); }
  };
  const uploadLessonVideo = async (sectionId: string, file: File) => {
    if (!/\.(mp4|mov|avi)$/i.test(file.name)) { toast.error("Choose an MP4, MOV, or AVI video."); return; }
    setVideoUpload(sectionId);
    try {
      const metadata = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
        const video = document.createElement("video"); const url = URL.createObjectURL(file);
        video.preload = "metadata"; video.onloadedmetadata = () => { const result = { duration: Math.round(video.duration), width: video.videoWidth, height: video.videoHeight }; URL.revokeObjectURL(url); resolve(result); };
        video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video duration.")); }; video.src = url;
      });
      const lesson = await dataOf(await fetch(`${API}/api/instructors/courses/sections/${sectionId}/lessons/`, { method: "POST", headers: headers(true), body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, "").slice(0, 180), position: Date.now() }) }));
      const initiated = await dataOf(await fetch(`${API}/api/instructors/courses/lessons/${lesson.lesson_id}/video/initiate/`, { method: "POST", headers: headers(true), body: JSON.stringify({ file_name: file.name, size_bytes: file.size, duration_seconds: metadata.duration, media_metadata: { width: metadata.width, height: metadata.height } }) }));
      const parts: { part_number: number; etag: string }[] = [];
      for (let partNumber = 1; partNumber <= initiated.part_count; partNumber++) {
        const part = await dataOf(await fetch(`${API}/api/instructors/courses/videos/${initiated.video_id}/parts/${partNumber}/url/`, { headers: headers() }));
        const chunk = file.slice((partNumber - 1) * initiated.part_size, Math.min(partNumber * initiated.part_size, file.size));
        const etag = await new Promise<string>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("PUT", part.url); xhr.onload = () => { const value = xhr.getResponseHeader("ETag")?.replaceAll('"', ""); value ? resolve(value) : reject(new Error("Storage did not return an upload tag. Check bucket CORS settings.")); }; xhr.onerror = () => reject(new Error("Video upload failed.")); xhr.send(chunk); });
        parts.push({ part_number: partNumber, etag });
      }
      await dataOf(await fetch(`${API}/api/instructors/courses/videos/${initiated.video_id}/complete/`, { method: "POST", headers: headers(true), body: JSON.stringify({ parts }) }));
      await load(); toast.success("Video uploaded; moderation has started.");
    } catch (err: any) { toast.error(err.message || "Could not upload video."); }
    finally { setVideoUpload(null); }
  };
  const shareCourse = async () => {
    const courseUrl = `${window.location.origin}/course/${encodeURIComponent(params.id)}`;
    const shareData = { title: course?.title || "Course", text: `Share ${course?.title || "this course"} with students.`, url: courseUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(courseUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(courseUrl);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2500);
      } catch {
        toast.error("Could not copy the course link. Copy the course address from your browser.");
      }
    }
  };
  if (loading)
    return <p className="p-8 text-sm text-gray-500">Loading course…</p>;
  if (!course)
    return (
      <main className="mx-auto max-w-3xl  border bg-white p-6">
        <p className="text-red-700">{error || "Course not found."}</p>
        <Link
          href="/instructors/dashboard/programs"
          className="mt-4 inline-block text-blue-700"
        >
          Back to courses
        </Link>
      </main>
    );
  const input = (label: string, key: keyof Draft, type = "text") => (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        required={key !== "duration" && key !== "prerequisites"}
        value={String(course[key] ?? "")}
        onChange={(event) =>
          setCourse((current) =>
            current ? { ...current, [key]: event.target.value } : current,
          )
        }
        className="mt-1 w-full  border px-3 py-2 font-normal"
      />
    </label>
  );
  return (
    <main className="mx-auto max-w-4xl space-y-5">
      <header>
        <Link
          href="/instructors/dashboard/programs"
          className="text-sm text-blue-700"
        >
          ← Back to courses
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Edit course</h1>
        <p className="mt-1 text-sm text-gray-500">
          Saving edits sends the course back through video moderation and admin
          review.
        </p>
        <p className="mt-1 text-sm capitalize text-amber-700">
          Status: {course.status.replaceAll("_", " ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void shareCourse()} disabled={course.status !== "published"} title={course.status !== "published" ? "Publish the course before sharing it with students." : undefined} className="inline-flex items-center gap-2 border border-indigo-700 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Share2 size={16}/> Share course with students
          </button>
          {course.status !== "published" && <span className="text-xs text-slate-500">Students can access the public course link after approval.</span>}
          {shareCopied && <span role="status" className="text-sm text-emerald-700">Course link copied.</span>}
        </div>
      </header>
      <form
        onSubmit={save}
        className="grid gap-4  border bg-white p-5 sm:grid-cols-2"
      >
        {input("Title", "title")}
        <label className="block text-sm font-medium">Category<select required value={course.category} onChange={event => setCourse({ ...course, category: event.target.value })} className="mt-1 w-full border px-3 py-2 font-normal"><option value="">Choose a category</option>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
        <label className="block text-sm font-medium">Level<select required value={course.level} onChange={event => setCourse({ ...course, level: event.target.value })} className="mt-1 w-full border px-3 py-2 font-normal">{["Beginner", "Intermediate", "Advanced"].map(level => <option key={level}>{level}</option>)}</select></label>
        {input("Duration", "duration")}
        <label className="block text-sm font-medium">
          Price (INR)
          <select
            value={course.price}
            onChange={(event) =>
              setCourse({ ...course, price: event.target.value })
            }
            className="mt-1 w-full border px-3 py-2 font-normal"
          >{PRICES.map(price => <option key={price} value={price}>{price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}</option>)}</select>
        </label>
        <label className="block text-sm font-medium">Certificate delivery<select value={course.certificate_delivery || "manual"} onChange={event => setCourse({ ...course, certificate_delivery: event.target.value as "automatic" | "manual" })} className="mt-1 w-full border px-3 py-2 font-normal"><option value="automatic">Automatically email after course completion</option><option value="manual">Instructor sends after reviewing completion</option></select><span className="mt-1 block text-xs font-normal text-gray-500">Choose when the learner receives the course certificate.</span></label>
        <label className="block text-sm font-medium">Course thumbnail<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("Thumbnail must be 5 MB or smaller."); return; } setThumbnailFile(file); setThumbnailPreview(URL.createObjectURL(file)); }} className="mt-1 block w-full text-sm font-normal"/><span className="mt-1 block text-xs font-normal text-gray-500">JPG, PNG, or WebP; up to 5 MB.</span></label>
        <div className="aspect-video overflow-hidden border bg-gray-100 sm:col-span-2">{(thumbnailPreview || course.thumbnail_url) ? <img src={thumbnailPreview || course.thumbnail_url} alt="Course thumbnail preview" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-sm text-gray-500">No course thumbnail yet</div>}</div>
        <label className="block text-sm font-medium sm:col-span-2">Course materials<input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" onChange={event => { const files = Array.from(event.target.files || []); if (files.some(file => file.size > 25 * 1024 * 1024)) { toast.error("Each resource must be 25 MB or smaller."); return; } setMaterialFiles(current => [...current, ...files]); event.currentTarget.value = ""; }} className="mt-1 block w-full text-sm font-normal"/><span className="mt-1 block text-xs font-normal text-gray-500">PDF, Office documents, TXT, or ZIP; up to 25 MB each. New files upload when you save.</span>{materialFiles.length > 0 && <ul className="mt-2 divide-y border">{materialFiles.map((file,index) => <li key={`${file.name}-${file.lastModified}-${index}`} className="flex justify-between gap-3 p-2 text-xs"><span>{file.name}</span><button type="button" onClick={() => setMaterialFiles(current => current.filter((_,i) => i !== index))} className="text-red-700">Remove</button></li>)}</ul>}</label>
        <div className="divide-y border sm:col-span-2">{(course.materials || []).map(material => <div key={material.material_id} className="flex items-center justify-between gap-3 p-3 text-sm"><span className="min-w-0 truncate">{material.title || material.original_name} <span className="text-gray-500">· {Math.ceil(material.size_bytes / 1024)} KB</span></span><button type="button" onClick={() => void removeResource(material.material_id)} disabled={course.status === "published" || course.status === "in_review" || course.status === "processing"} className="shrink-0 text-red-700 disabled:opacity-40">Remove</button></div>)}{(!course.materials || course.materials.length === 0) && <p className="p-3 text-sm text-gray-500">No course materials uploaded.</p>}</div>
        <label className="block text-sm font-medium sm:col-span-2">
          Description
          <textarea
            required
            rows={5}
            value={course.description}
            onChange={(event) =>
              setCourse({ ...course, description: event.target.value })
            }
            className="mt-1 w-full  border px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Learning outcomes, one per line
          <textarea
            rows={4}
            value={learning}
            onChange={(event) => setLearning(event.target.value)}
            className="mt-1 w-full  border px-3 py-2 font-normal"
          />
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Prerequisites
          <textarea
            rows={3}
            value={course.prerequisites}
            onChange={(event) =>
              setCourse({ ...course, prerequisites: event.target.value })
            }
            className="mt-1 w-full  border px-3 py-2 font-normal"
          />
        </label>
        {error && (
          <p
            role="alert"
            className="whitespace-pre-wrap  bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end sm:col-span-2">
          <button
            disabled={saving}
            className=" bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save and resubmit"}
          </button>
        </div>
      </form>
      <section className="space-y-4 border bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold">Course modules</h2>
          <p className="text-sm text-gray-500">Edit module names and order. Changes to a published course return it to draft and require review before publication.</p>
        </div>
        <ol className="divide-y border">
          {(course.sections || []).map((section, index) => (
            <li key={section.section_id} className="p-3">
              {editingModule === section.section_id ? (
                <form onSubmit={updateModule} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto_auto]">
                  <label className="text-xs font-semibold text-slate-600">Module title<input autoFocus required maxLength={180} value={moduleDraft.title} onChange={event => setModuleDraft(current => ({ ...current, title: event.target.value }))} className="mt-1 block w-full border px-3 py-2 text-sm font-normal" /></label>
                  <label className="text-xs font-semibold text-slate-600">Order<input type="number" min="0" step="1" required value={moduleDraft.position} onChange={event => setModuleDraft(current => ({ ...current, position: event.target.value }))} className="mt-1 block w-full border px-3 py-2 text-sm font-normal" /></label>
                  <button type="submit" disabled={savingModule} className="self-end bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingModule ? "Saving…" : "Save"}</button>
                  <button type="button" disabled={savingModule} onClick={() => setEditingModule(null)} className="self-end border px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{index + 1}. {section.title}</span>
                  <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{section.lessons?.length || 0} lessons</span><button type="button" onClick={() => beginModuleEdit(section)} disabled={course.status === "in_review" || course.status === "processing"} className="border px-3 py-1.5 text-xs font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Edit module</button></div>
                </div>
              )}
              {section.lessons?.map((lesson, lessonIndex) => <div key={lesson.lesson_id} className="mt-3 flex items-center justify-between gap-3 border-l-2 border-slate-200 pl-3 text-sm"><span>{lessonIndex + 1}. {lesson.title}</span><span className="text-xs text-gray-500">{lesson.video ? `${lesson.video.scan_status.replaceAll("_", " ")} · ${lesson.video.duration_seconds ? `${Math.round(lesson.video.duration_seconds / 60)} min` : lesson.video.original_name}` : "No video uploaded"}</span></div>)}
              <label className="mt-3 inline-flex cursor-pointer items-center border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{videoUpload === section.section_id ? "Uploading video…" : "Add video lesson"}<input type="file" accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi" className="hidden" disabled={!!videoUpload || course.status === "in_review" || course.status === "processing"} onChange={event => { const file = event.target.files?.[0]; if (file) void uploadLessonVideo(section.section_id, file); event.currentTarget.value = ""; }}/></label>
            </li>
          ))}
          {(!course.sections || course.sections.length === 0) && <li className="p-3 text-sm text-gray-500">No modules yet.</li>}
        </ol>
        <form onSubmit={addModule} className="flex flex-col gap-3 sm:flex-row">
          <input aria-label="Module title" required maxLength={180} value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="Module title" className="min-w-0 flex-1 border px-3 py-2" />
          <button type="submit" disabled={addingModule} className="bg-slate-900 px-5 py-2 font-semibold text-white disabled:opacity-50">{addingModule ? "Adding…" : "Add module"}</button>
        </form>
      </section>
    </main>
  );
}



