"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useAuth } from "@/src/context/AuthContext";
import {
  ArrowLeft,
  Loader2,
  Users,
  Target,
  CheckCircle,
  PlayCircle,
  BookOpen,
  MonitorPlay,
  Infinity as InfinityIcon,
  Star,
  Globe,
  Award,
  AlertCircle
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function CourseDetail() {
  const params = useParams();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  // Modal States
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "info" | "error">("success");

  const router = useRouter();
  const { user } = useAuth();

  const showModal = (title: string, message: string, type: "success" | "info" | "error") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowEnrollModal(true);
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isEnrolled || isEnrolling) return;

    try {
      setIsEnrolling(true);
      const token = localStorage.getItem("token");

      // Naya Corrected Enroll API Route
      const res = await fetch(`${API}/api/courses/enroll/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: course._id, 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Enrollment failed");
      }

      setIsEnrolled(true);
      showModal(
        "Enrollment Successful!", 
        "Welcome to the course! You can now start learning from your dashboard.", 
        "success"
      );

    } catch (err: any) {
      showModal("Enrollment Failed", err.message || "Something went wrong. Please try again.", "error");
    } finally {
      setIsEnrolling(false);
    }
  };

  const FALLBACK_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1920";

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

    const fetchCourse = async () => {
      try {
        // Naya Corrected Fetch API Route
        const res = await fetch(`${API}/api/courses/${courseId}/`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setCourse(data);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Course not found</h2>
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
    <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
      
      {/* Hero Section (Simple & Clean Dark Theme) */}
      <section className="relative bg-slate-900 text-white pt-24 pb-32 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden">
           <Image
            src={bannerImage}
            alt="Course Background"
            fill
            className="object-cover opacity-10"
            priority
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col justify-center">
            
            {/* Breadcrumb */}
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors w-fit text-sm font-medium"
            >
              <ArrowLeft size={16} />
              <span>Back to Courses</span>
            </Link>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white rounded-md">
                {category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              {course.title}
            </h1>
            
            {/* Description Preview */}
            <p className="text-lg text-slate-300 mb-8 max-w-2xl line-clamp-2">
              {course.description || "Master the skills you need. Join thousands of students in this comprehensive course."}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 mb-8">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <span className="text-white font-medium">4.9 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <span>Beginner to Advanced</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" />
                <span>English / Hindi</span>
              </div>
            </div>

            {/* Instructor Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xl text-indigo-400">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Instructor</p>
                <p className="font-semibold text-white text-base">{authorName}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20 -mt-16 lg:-mt-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Content Column */}
          <div className="lg:col-span-8 space-y-6 mt-16 lg:mt-24">
            
            {/* What you'll learn */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="text-indigo-600" size={24} />
                What you'll learn
              </h2>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-6">
                {[
                  "Build real-world projects from scratch",
                  "Understand complex concepts easily",
                  "Industry best practices & patterns",
                  "Prepare for technical interviews"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
                    <span className="text-slate-600 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={24} />
                Course Description
              </h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {course.description || "Detailed course description will be available soon."}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="text-indigo-600" size={24} />
                Prerequisites
              </h2>
              <ul className="space-y-3 text-slate-600 text-sm sm:text-base list-inside">
                {(course.requirements || "A willingness to learn and internet connection").split('\n').map((req: string, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                    {req.replace('•', '').trim()}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Sidebar - Sticky Course Card (Simple UI) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              
              {/* Video Preview */}
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    className="w-full h-full absolute inset-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                     <PlayCircle size={48} className="mb-2 opacity-50" />
                     <p className="text-sm font-medium">No preview available</p>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-slate-900">
                    {price === "Free" || price === "0" ? "Free" : `₹${price}`}
                  </h2>
                </div>

                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling || isEnrolled}
                  className={`w-full py-3.5 rounded-lg text-base font-semibold transition-colors flex justify-center items-center gap-2 ${
                    isEnrolled
                      ? "bg-green-500 text-white cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isEnrolling && <Loader2 size={18} className="animate-spin" />}
                  {isEnrolled ? "Already Enrolled" : isEnrolling ? "Processing..." : "Enroll Now"}
                </button>
                <p className="text-center text-xs text-slate-500 mt-3">
                  Full lifetime access
                </p>

                <hr className="my-6 border-slate-100" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 text-sm">This course includes:</h3>
                  {[
                    { icon: <MonitorPlay size={18}/>, text: `${duration} on-demand video` },
                    { icon: <InfinityIcon size={18}/>, text: "Full lifetime access" },
                    { icon: <Globe size={18}/>, text: "Access on mobile and desktop" },
                    { icon: <Award size={18}/>, text: "Certificate of completion" },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600">
                      <div className="text-slate-400">{feat.icon}</div>
                      <span className="text-sm">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Simple Enrollment Modal */}
      {showEnrollModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  modalType === 'success' ? 'bg-green-100 text-green-600' : 
                  modalType === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {modalType === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20} />}
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
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}