"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddCourse from "../../add/page";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();

  const courseId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [error, setError] = useState("");

  // ✅ Fetch course details from Django backend
  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API}/api/courses/${courseId}/`);

        if (!res.ok) throw new Error("Failed to fetch course details");

        const data = await res.json();
        setCourse(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // 🌀 Loading Skeleton
  if (loading) {
    return (
      <div className="p-10">
        <div className="animate-pulse space-y-6 max-w-2xl mx-auto">
          <div className="h-10 bg-gray-200 rounded-xl w-1/2" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // ❌ Error UI
  if (error) {
    return (
      <div className="p-10 text-center max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-100 shadow-xl">
        <h2 className="text-xl font-bold text-red-600">
          Failed to load course
        </h2>
        <p className="text-gray-500 mt-2 text-sm">{error}</p>
        <button
          onClick={() => router.push("/admin/course")}
          className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          Go Back to Courses
        </button>
      </div>
    );
  }

  // 🚫 Not found
  if (!course) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Course not found
      </div>
    );
  }

  // ✅ Render SAME UI as Add Course page with initialData & isEditMode
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AddCourse initialData={course} isEditMode />
    </motion.div>
  );
}