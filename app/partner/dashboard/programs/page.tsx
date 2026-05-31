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

const API = process.env.NEXT_PUBLIC_APP_URL;

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
  status: "Published" | "Draft" | "Archived";
  imageUrl?: string;
  description?: string;
}

export default function ProgramsDashboard() {
  // State
  const [internships, setInternships] = useState<Internship[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteType, setDeleteType] = useState<"internship" | "course" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch both datasets
  const fetchData = async () => {
    try {
      setLoading(true);
      const [internRes, courseRes] = await Promise.all([
        fetch(`${API}/upload/internships/list/`),
        fetch(`${API}/upload/courses/list/`), // adjust endpoint as needed
      ]);
      const internshipsData = await internRes.json();
      const coursesData = await courseRes.json();
      setInternships(Array.isArray(internshipsData) ? internshipsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    const endpoint =
      deleteType === "internship"
        ? `${API}/upload/delete_internship/${deleteId}/`
        : `${API}/upload/delete_course/${deleteId}/`; // adjust endpoint

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
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
        toast.error("Delete failed");
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
  const totalEnrollments = courses.reduce((acc, c) => acc + (c.enrolled || 0), 0);
  // applicantsCount may not be defined on the Internship type; tolerate different shapes
  const totalApplicants = internships.reduce(
    (acc, i) => acc + ((i as any).applicantsCount ?? (i as any).applicants?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50/10 pb-10">
      {/* Header Section */}
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
            Program Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your internships and courses from one dashboard.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Internships</p>
          <h3 className="text-3xl font-bold text-gray-900">{totalInternships}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Courses</p>
          <h3 className="text-3xl font-bold text-indigo-600">{totalCourses}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Enrollments</p>
          <h3 className="text-3xl font-bold text-blue-600">{totalEnrollments}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Internship Applicants</p>
          <h3 className="text-3xl font-bold text-yellow-600">{totalApplicants}</h3>
        </div>
      </div>

      {/* Internships Section */}
      <div className="px-4 sm:px-6 mb-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <MdWorkOutline className="text-indigo-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">Internships</h2>
          </div>
          <Link href="/partner/dashboard/programs/internship">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
              <MdAdd size={18} /> Create Internship
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No internships yet. Click "Create Internship" to get started.
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
                        <MdCurrencyRupee className="text-indigo-500" size={12} />
                        <span>{item.stipend}</span>
                      </div>
                      {item.description && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-500 mt-1">
                          <MdDescription className="text-indigo-400 mt-0.5" size={10} />
                          <p className="line-clamp-2">{item.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 flex gap-2">
                      <Link
                        href={`/partner/dashboard/programs/internship/edit/${item._id}`}
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

      {/* Courses Section */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <MdBook className="text-indigo-600 text-2xl" />
            <h2 className="text-xl font-bold text-gray-800">Courses</h2>
          </div>
          <Link href="/partner/dashboard/programs/courses">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">
              <MdAdd size={18} /> Create Course
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No courses yet. Click "Create Course" to get started.
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
                        course.status === "Published"
                          ? "bg-green-500"
                          : course.status === "Draft"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {course.status}
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
                        <span>{course.price === "Free" ? "Free" : `₹${course.price}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <MdGroup className="text-indigo-500" size={12} />
                        <span>{course.enrolled} enrolled</span>
                      </div>
                      {course.description && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-500 mt-1">
                          <MdDescription className="text-indigo-400 mt-0.5" size={10} />
                          <p className="line-clamp-2">{course.description}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50 flex gap-2">
                      <Link
                        href={`/partner/dashboard/programs/course/edit/${course._id}`}
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

      {/* Delete Confirmation Dialog */}
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
              You are about to delete{" "}
              <span className="font-semibold text-gray-900">
                "{selectedItem ? (selectedItem as any)?.title ?? "" : ""}"
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600">
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
            <AlertDialogTitle className="text-lg font-bold">Deleted Successfully</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              The record has been permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction onClick={() => setShowSuccess(false)} className="w-full bg-gray-900">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}