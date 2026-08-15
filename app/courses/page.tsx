"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  IndianRupee,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";
import { FaUserGraduate } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_APP_URL;

// ================= EXACT SAME COURSE CARD FROM HOME PAGE =================
const CourseCard = ({ item }: any) => {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={() => router.push(`/course/${item._id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer w-full flex flex-col"
    >
      {/* IMAGE & BADGE */}
      <div className="relative h-40 sm:h-44 overflow-hidden rounded-t-2xl shrink-0">
        <img
          src={item.imageUrl || "/placeholder.jpg"}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          alt={item.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Category / Level Badge */}
        <div className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-blue-600/90 text-white font-semibold backdrop-blur-md">
          {item.level || item.category || "Course"}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-3">
        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
          {item.title}
        </h3>

        {/* Instructor */}
        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
          <FaUserGraduate className="text-gray-400" />
          By {item.instructor || item.provider || "Industry Expert"}
        </p>

        {/* Course Metadata (Duration & Lessons/Rating) */}
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 pt-2 mt-auto">
          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
            <Clock size={14} className="text-blue-600" />
            {item.duration || "10+ Hours"}
          </span>

          <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
            <BookOpen size={14} className="text-purple-600" />
            {item.lessons ? `${item.lessons} Lessons` : `${item.rating || "4.8"} ★`}
          </span>
        </div>

        {/* FOOTER: Price & CTA */}
        <div className="flex justify-between items-center pt-3 border-t mt-3">
          <div className="flex items-center gap-1">
            <span className="text-base sm:text-lg font-bold text-blue-600 flex items-center">
              <IndianRupee size={16} /> {item.price === "0" || !item.price || item.price.toLowerCase() === "free" ? "Free" : item.price}
            </span>
            {item.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{item.originalPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-blue-600">
            <Sparkles size={14} className="text-yellow-500" />
            Start Learning
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ================= MAIN COURSES PAGE COMPONENT =================
export default function CoursesList() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API}/api/courses/list/`);
        if (!res.ok) throw new Error("Failed to fetch courses");
        
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (err: any) {
        console.error("API Error:", err);
        setError("Could not load courses at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Master your <span className="text-blue-600">Future</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Level up your skills with industry-leading experts. Start your
          learning journey with our hand-picked premium courses.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Loading amazing courses...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No courses available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} item={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}