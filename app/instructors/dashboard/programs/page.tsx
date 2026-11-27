"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdAdd,
  MdCurrencyRupee,
  MdDelete,
  MdEdit,
  MdBusiness,
  MdLocationOn,
  MdAccessTime,
  MdWarning,
  MdDescription,
  MdAssignmentTurnedIn,
  MdCheckCircle,
  MdSchool,
  MdPerson,
  MdAttachMoney,
  MdGroup,
  MdWorkOutline,
  MdBook,
} from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CourseUploadStepper from "@/src/components/CourseUploadStepper";
import { LEGACY_API_BASE } from "@/src/lib/apiBases";

const API = process.env.APP_URL;

// --- Types ---
interface Internship {
  _id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  stipend: string;
  description: string;
  requirements: string;
  imageUrl?: string;
  status?: string;
}

interface Course {
  _id: string;
  title: string;
  instructor: string;
  price: number | string;
  enrolled: number;
  status: string;
  imageUrl?: string;
  description?: string;
  course_id?: string;
  instructor_email?: string;
}

export default function ProgramsDashboard() {
  // State
  const [internships, setInternships] = useState<Internship[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseError, setCourseError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteType, setDeleteType] = useState<"internship" | "course" | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCourseUploader, setShowCourseUploader] = useState(false);
  const route = useRouter()

  const shareCourse = async (course: Course) => {
    const courseUrl = `${window.location.origin}/course/${encodeURIComponent(course.course_id || course._id)}`;
    const shareData = { title: course.title, text: `Share ${course.title} with students.`, url: courseUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(courseUrl);
        toast.success("Course link copied. Share it with a student.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(courseUrl);
        toast.success("Course link copied. Share it with a student.");
      } catch {
        toast.error("Could not copy the course link. Copy the course address from your browser.");
      }
    }
  };

  // Fetch both datasets
  const fetchData = async () => {
    try {
      setLoading(true);
      setCourseError("");
      const mentorToken = localStorage.getItem("mentorToken");
      const [internRes, courseRes] = await Promise.all([
        fetch(`${LEGACY_API_BASE}/upload/internships/list/`).catch(() => null),
        fetch(`${API}/api/instructors/courses/`, { headers: mentorToken ? { Authorization: `Bearer ${mentorToken}` } : {} }).catch(() => null),
      ]);
      const internshipsData = internRes?.ok ? await internRes.json().catch(() => []) : [];
      setInternships(Array.isArray(internshipsData) ? internshipsData : []);
      if (!mentorToken) throw new Error("Your instructor session has expired. Sign in again to see your courses.");
      if (!courseRes) throw new Error("Could not connect to the course server. Check that the backend is running and try again.");
      const coursesData = await courseRes.json().catch(() => ({}));
      if (!courseRes.ok) throw new Error(coursesData.detail || coursesData.message || `Course list request failed (${courseRes.status}).`);
      const rows = Array.isArray(coursesData) ? coursesData : Array.isArray(coursesData.results) ? coursesData.results : Array.isArray(coursesData.courses) ? coursesData.courses : null;
      if (!rows) throw new Error("The course server returned an unexpected response. Refresh and try again.");
      setCourses(rows.map((course: any) => ({
        ...course, _id: course.course_id, instructor: course.instructor_name || course.instructor_email,
        imageUrl: course.thumbnail_url || course.imageUrl,
        enrolled: course.enrollment_count || 0, status: course.status,
      })));
      setCourseError("");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to load course data.";
      setCourses([]);
      setCourseError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchData();
    };
    window.addEventListener("focus", refreshWhenVisible);
    return () => window.removeEventListener("focus", refreshWhenVisible);
  }, []);

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    const mentorToken = localStorage.getItem("mentorToken");
    const endpoint = deleteType === "internship"
      ? `${LEGACY_API_BASE}/upload/delete_internship/${deleteId}/`
      : `${API}/api/instructors/courses/${deleteId}/`;

    try {
      const res = await fetch(endpoint, { method: "DELETE", ...(deleteType === "course" && mentorToken ? { headers: { Authorization: `Bearer ${mentorToken}` } } : {}) });
      if (res.ok) {
        if (deleteType === "internship") {
          setInternships((prev) => prev.filter((i) => i._id !== deleteId));
        } else {
          setCourses((prev) => prev.filter((c) => c._id !== deleteId));
        }
        setDeleteId(null);
        setDeleteType(null);
        setTimeout(() => setShowSuccess(true), 300);
        setTimeout(() => setShowSuccess(false), 2500);
      } else {
        const result = await res.json().catch(() => ({}));
        toast.error(result.detail || result.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting");
      console.error(err);
    }
  };

  const openDeleteDialog = (type: "internship" | "course", id: string) => {
    setDeleteType(type);
    setDeleteId(id);
  };

  const selectedItem =
    deleteType === "internship"
      ? internships.find((i) => i._id === deleteId)
      : courses.find((c) => c._id === deleteId);

  // Stats (simple totals)
  const totalInternships = internships.length;
  const totalCourses = courses.length;
  const totalEnrollments = courses.reduce(
    (acc, c) => acc + (c.enrolled || 0),
    0,
  );
  // applicantsCount may not be defined on the Internship type; tolerate different shapes
  const totalApplicants = internships.reduce(
    (acc, i) =>
      acc + ((i as any).applicantsCount ?? (i as any).applicants?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50/10 pb-10">
      {/* Header Section */}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 mb-10">
        <div className="bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Internships</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {totalInternships}
          </h3>
        </div>
        <div className="bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Courses</p>
          <h3 className="text-3xl font-bold text-indigo-600">{totalCourses}</h3>
        </div>
        <div className="bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Total Enrollments
          </p>
          <h3 className="text-3xl font-bold text-blue-600">
            {totalEnrollments}
          </h3>
        </div>
        <div className="bg-white p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Internship Applicants
          </p>
          <h3 className="text-3xl font-bold text-yellow-600">
            {totalApplicants}
          </h3>
        </div>
      </div>

      {/* Courses Section */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <MdBook className="text-indigo-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">Courses</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void fetchData()} disabled={loading} className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Refresh courses</button>
            <button type="button" onClick={() => setShowCourseUploader(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
              <MdAdd size={18} /> New course upload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className={`border p-8 text-center ${courseError ? "border-red-200 bg-red-50 text-red-800" : "border-gray-100 bg-white text-gray-500"}`}>
            {courseError ? <><p className="font-semibold">Could not load your courses</p><p className="mt-2 text-sm">{courseError}</p><button type="button" onClick={() => void fetchData()} className="mt-4 border border-current px-4 py-2 text-sm font-semibold hover:bg-white">Try again</button></> : <p>No uploaded courses yet. Click “New course upload” to get started.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {courses.map((course) => (
                <motion.div
                  key={course._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-lg transition-all group h-full"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-300">
                        <MdSchool size={48} />
                      </div>
                    )}
                    <div
                      className={`absolute top-2 right-2 text-[8px] px-2 py-0.5 rounded-full font-black uppercase text-white shadow-sm ${
                        course.status === "published" ? "bg-green-600" : course.status === "in_review" ? "bg-amber-600" : course.status === "processing" ? "bg-blue-600" : course.status === "rejected" ? "bg-red-600" : "bg-gray-600"
                      }`}
                    >
                      {course.status === "in_review" ? "Waiting for approval" : course.status === "processing" ? "Moderation in progress" : course.status.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    <div className="space-y-1 mt-2 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdPerson className="text-indigo-500" size={12} />
                        <span className="truncate">{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdAttachMoney className="text-indigo-500" size={12} />
                        <span>
                          {course.price === "Free"
                            ? "Free"
                            : `₹${course.price}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdGroup className="text-indigo-500" size={12} />
                        <span>{course.enrolled} enrolled</span>
                      </div>
                      {course.description && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-500 mt-1">
                          <MdDescription
                            className="text-indigo-400 mt-0.5"
                            size={10}
                          />
                          <p className="line-clamp-2">{course.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 flex gap-2">
                      {course.status === "published" && <button
                        type="button"
                        onClick={() => void shareCourse(course)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                        aria-label={`Share ${course.title} with students`}
                      >
                        <Share2 size={12} /> Share
                      </button>}
                      <Link
                        href={`/instructors/dashboard/enrollments?course_id=${course._id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        <MdGroup size={12} /> Students ({course.enrolled})
                      </Link>
                      <Link
                        href={`/instructors/dashboard/programs/course/edit/${course._id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        <MdEdit size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => openDeleteDialog("course", course._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        <MdDelete size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Internships Section */}
      <div className="px-4 sm:px-6 mb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <MdWorkOutline className="text-indigo-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">Internships</h2>
          </div>
          <Link href="/instructors/dashboard/programs/internship">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white  text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
              <MdAdd size={18} /> Create Internship
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="bg-white py-16 px-8 flex flex-col items-center text-center">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-6"
            >
              <circle cx="60" cy="60" r="60" fill="#F3F4F6" />
              <rect
                x="32"
                y="38"
                width="56"
                height="46"
                rx="4"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="1.5"
              />
              <rect x="40" y="48" width="40" height="4" rx="2" fill="#D1D5DB" />
              <rect x="40" y="58" width="28" height="4" rx="2" fill="#D1D5DB" />
              <rect x="40" y="68" width="34" height="4" rx="2" fill="#D1D5DB" />
              <circle cx="82" cy="34" r="14" fill="#3B82F6" />
              <path
                d="M82 27v14M75 34h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No internships yet
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Get started by creating your first internship listing for students
              to apply to.
            </p>
            <button
              onClick={() => {
                route.push("/instructors/dashboard/programs/internship")
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Create Internship
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {internships.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-lg transition-all group h-full"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gray-50">
                    <img
                      src={item.imageUrl || "/placeholder-internship.jpg"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt=""
                    />
                    <div className="absolute top-2 right-2 text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-green-500 text-white shadow-sm">
                      {item.status || "Active"}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <div className="space-y-1 mt-2 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdBusiness className="text-indigo-500" size={12} />
                        <span className="truncate">{item.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdLocationOn className="text-indigo-500" size={12} />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdAccessTime className="text-indigo-500" size={12} />
                        <span>{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdCurrencyRupee
                          className="text-indigo-500"
                          size={12}
                        />
                        <span>{item.stipend}</span>
                      </div>
                      {item.description && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-500 mt-1">
                          <MdDescription
                            className="text-indigo-400 mt-0.5"
                            size={10}
                          />
                          <p className="line-clamp-2">{item.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 flex gap-2">
                      <Link
                        href={`/instructors/dashboard/programs/internship/edit/${item._id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        <MdEdit size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => openDeleteDialog("internship", item._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        <MdDelete size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showCourseUploader && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="New course upload"><div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-7"><CourseUploadStepper onClose={() => setShowCourseUploader(false)} onComplete={() => { setShowCourseUploader(false); void fetchData(); }} /></div></div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl p-4 sm:p-6 max-w-[90%] sm:max-w-md border-gray-100">
          <AlertDialogHeader className="flex flex-col items-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center"
            >
              <MdWarning className="text-red-500 text-2xl" />
            </motion.div>
            <AlertDialogTitle className="text-lg font-bold text-center">
              Delete {deleteType === "internship" ? "Internship" : "Course"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              {deleteType === "course" ? (
                <>
                  Remove "<span className="font-semibold text-gray-900">{selectedItem ? ((selectedItem as any)?.title ?? "") : ""}</span>" from the catalog? Existing learners and payment records will be kept. Courses without learner or payment records are permanently deleted.
                </>
              ) : (
                <>
                  You are about to delete{" "}
                  <span className="font-semibold text-gray-900">
                    "{selectedItem ? ((selectedItem as any)?.title ?? "") : ""}"
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-2xl p-4 sm:p-6 max-w-[90%] sm:max-w-md text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <MdCheckCircle className="text-emerald-500 text-2xl" />
          </motion.div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Removed Successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              The item has been removed from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={() => setShowSuccess(false)}
              className="w-full bg-gray-900"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
