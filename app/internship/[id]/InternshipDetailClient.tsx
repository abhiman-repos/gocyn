"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
  IndianRupee,
  Users,
  Award,
  Target,
  Calendar,
  Briefcase,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { createPortal } from "react-dom";

import { LEGACY_API_BASE } from "@/src/lib/apiBases";

export default function InternshipDetail({ id, initialInternship }: { id: string; initialInternship?: any }) {
  const internshipId = id;

  const [internship, setInternship] = useState<any>(initialInternship || null);
  const [loading, setLoading] = useState(!initialInternship);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  // Modal States
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "info" | "error">(
    "success",
  );

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

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (isEnrolled || isEnrolling) return;

    try {
      setIsEnrolling(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${LEGACY_API_BASE}/upload/enroll/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          internship_id: internship._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Enrollment failed");
      }

      if (data.message === "Already enrolled") {
        setIsEnrolled(true);
        showModal(
          "Already Enrolled",
          "You have already applied for this internship.",
          "info",
        );
      } else {
        setIsEnrolled(true);
        showModal(
          "Enrollment Successful!",
          "You have successfully enrolled in this internship. Check your dashboard for details.",
          "success",
        );
      }
    } catch (err: any) {
      showModal(
        "Enrollment Failed",
        err.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  // Fallback banner agar imageUrl na ho
  const FALLBACK_BANNER =
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920";

  function getYouTubeId(url?: string) {
    if (!url) return "";
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : "";
  }

  useEffect(() => {
    if (initialInternship) {
      setInternship(initialInternship);
      setLoading(false);
      return;
    }
    if (!internshipId) {
      setLoading(false);
      return;
    }

    const fetchInternship = async () => {
      try {
        const res = await fetch(`${LEGACY_API_BASE}/upload/internship/${internshipId}/`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setInternship(data);
      } catch (err) {
        console.error("API Error:", err);
        // Optional: You can set demo data here if needed
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [internshipId, initialInternship]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-semibold text-gray-500">
        Internship not found
      </div>
    );
  }

  const videoId = getYouTubeId(internship.youtube);

  // Use imageUrl from API, fallback to unsplash if not available
  const bannerImage = internship.imageUrl || FALLBACK_BANNER;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section - Using API imageUrl as Cover */}
      <section className="relative min-h-[70vh] sm:min-h-[600px] flex items-center text-white pt-20 sm:pt-24 pb-24 sm:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <Image
            src={bannerImage}
            alt={`${internship.title} Banner`}
            fill
            priority
            className="object-cover object-center"
            quality={90}
          />
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 w-full">
          <Link
            href="/internships"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 sm:mb-10 transition-colors group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-sm sm:text-base">Back to Internships</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-600/40 border border-indigo-400/30 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-2 sm:mb-6 backdrop-blur-md">
                <Briefcase size={18} />
                <span className="font-medium">Hiring Now</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tighter">
                {internship.title}
              </h1>
              <p className="text-xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] uppercase">
               Company : {internship.company}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <MapPin size={24} />,
                    label: "LOCATION",
                    value: internship.location,
                    type: "normal",
                  },
                  {
                    icon: <Clock size={24} />,
                    label: "DURATION",
                    value: internship.duration,
                    type: "normal",
                  },
                  {
                    icon: <IndianRupee size={24} />,
                    label: "PRICE",
                    value: `₹${internship.stipend}`,
                    type: "price",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-xl border transition-all duration-300
        ${
          item.type === "price"
            ? "bg-green-500/10 border-green-400/30 shadow-lg shadow-green-500/20 hover:scale-105"
            : "bg-white/10 border-white/20"
        }
      `}
                  >
                    {/* 🔥 Badge for price */}
                    {item.type === "price" && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold">
                        BEST VALUE
                      </span>
                    )}

                    {/* Icon */}
                    <div
                      className={`mb-2 sm:mb-3 ${
                        item.type === "price"
                          ? "text-green-400"
                          : "text-indigo-300"
                      }`}
                    >
                      {item.icon}
                    </div>

                    {/* Label */}
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${
                        item.type === "price"
                          ? "text-green-300"
                          : "text-white/60"
                      }`}
                    >
                      {item.label}
                    </p>

                    {/* Value */}
                    <p
                      className={`font-bold mt-1 ${
                        item.type === "price"
                          ? "text-xl sm:text-2xl text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]"
                          : "text-lg sm:text-xl text-white"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling || isEnrolled}
                className={`w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl text-lg font-semibold transition-all ${
                  isEnrolled
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {isEnrolled
                  ? "Already Enrolled"
                  : isEnrolling
                    ? "Enrolling..."
                    : "Enroll Now"}
              </button>
            </div>

            {/* Video Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 mt-8 lg:mt-0"
            >
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  className="w-full aspect-video"
                  allowFullScreen
                />
              ) : (
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <p className="text-white/60 text-sm sm:text-base">
                    Video preview coming soon
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Side */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* About the Internship */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 bg-indigo-100 rounded-2xl">
                  <Award className="text-indigo-600" size={28} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  About the Internship
                </h2>
              </div>
              <div className="text-gray-600 text-base sm:text-[17px] leading-relaxed whitespace-pre-line">
                {internship.description ||
                  "5-month Full Stack Developer Internship program."}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 bg-indigo-100 rounded-2xl">
                  <Target className="text-indigo-600" size={28} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Requirements
                </h2>
              </div>
              <div className="text-gray-600 text-base sm:text-[17px] leading-relaxed whitespace-pre-line">
                {internship.requirements ||
                  `• HTML, CSS & JavaScript (ES6+)\n• Basic knowledge of React.js\n• Understanding of Git & GitHub\n• Problem-solving skills\n• Team work & communication\n• Minimum 15 hours/week commitment\n• Laptop with stable internet`}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            {/* Mentors */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Users className="text-indigo-600" size={28} />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Mentors
                </h2>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {internship.mentors && internship.mentors.length > 0 ? (
                  internship.mentors.map((mentor: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-inner shrink-0">
                        {mentor.name?.[0] || "S"}
                      </div>
                      <div>
                        <p className="font-semibold text-lg sm:text-xl text-gray-900">
                          {mentor.name}
                        </p>
                        <p className="text-sm sm:text-base text-indigo-600 font-medium">
                          {mentor.expertise}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm sm:text-base">
                    No mentors listed yet.
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
              <Calendar size={40} className="mb-4 sm:mb-6 opacity-90" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Launch Your Career
              </h3>
              <p className="text-white/80 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Apply today and get a chance to work with industry leaders.
              </p>
              <button className="w-full py-3 sm:py-4 bg-white text-indigo-700 font-bold text-base sm:text-lg rounded-2xl hover:bg-indigo-50 transition-all">
                Join Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ENROLLMENT MODAL ==================== */}
      {showEnrollModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                  <CheckCircle size={24} />
                </div>

                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {modalTitle}
                </h3>
              </div>

              {/* Content */}
              <div className="px-6 sm:px-8 pb-4 sm:pb-6">
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {modalMessage}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t px-6 sm:px-8 py-4 sm:py-6 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition text-sm sm:text-base font-medium"
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
