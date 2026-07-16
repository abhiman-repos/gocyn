"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Star,
  Clock,
  Users,
  ArrowRight,
  Search,
  Zap,
  Briefcase,
  CheckCircle2,
  Trophy,
  MapPin,
  Target,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import { FaBuilding, FaUserGraduate } from "react-icons/fa";
import CountUp from "@/src/components/CountUp";
import { useRouter } from "next/navigation";
import { GraduationCap, FileText } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import FAQPage from "@/src/components/FQPage";
import Image from "next/image";
import HeroPanels from "@/src/components/Heropanel";

const API = process.env.NEXT_PUBLIC_APP_URL;

// Background Images

const stats = [
  { label: "Active internship", value: 150, suffix: "+", icon: BookOpen },
  { label: "Expert Mentors", value: 80, suffix: "+", icon: Users },
  { label: "Success Rate", value: 94, suffix: "%", icon: Star },
  { label: "Hours of Content", value: 5, suffix: "k+", icon: Clock },
];

// ================= INTERNSHIP CARD (STRUCTURE UNCHANGED) =================
const InternshipCard = ({ item }: any) => {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={() => router.push(`/internship/${item._id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer w-full"
    >
      {/* IMAGE */}
      <div className="relative h-40 sm:h-44 overflow-hidden rounded-t-2xl">
        <img
          src={item.imageUrl || "/placeholder.jpg"}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          alt={item.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-blue-600/90 text-white font-semibold backdrop-blur-md">
          {item.status}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 sm:p-5 space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
          {item.title}
        </h3>

        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
          <FaBuilding className="text-gray-400" />
          {item.company}
        </p>

        <div className="flex justify-between text-xs sm:text-sm text-gray-600 pt-2">
          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
            <Clock size={14} className="text-blue-600" />
            {item.duration}
          </span>
          <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
            <MapPin size={14} className="text-purple-600" />
            {item.location}
          </span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-base sm:text-lg font-bold text-blue-600 flex items-center gap-1">
            <IndianRupee size={16} /> {item.stipend}
          </span>
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-blue-600">
            <FaUserGraduate size={14} />
            Enroll Now
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ================= MENTOR CARD (STRUCTURE UNCHANGED) =================
const MentorCard = ({ mentor }: any) => {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden"
    >
      {/* Image with experience badge */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          src={mentor.imageUrl || "/placeholder.jpg"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={mentor.name}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Experience badge – highlighted */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow">
          {mentor.experience} yrs exp
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Name & Email */}
        <div>
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
            {mentor.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">{mentor.email}</p>
        </div>

        {/* Expertise with icon – fixed size */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <GraduationCap size={16} className="text-blue-500 shrink-0" />
          <span className="line-clamp-1">{mentor.expertise}</span>
        </div>

        {/* Bio with icon – fixed size */}
        <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
          <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="line-clamp-2">{mentor.bio || "No bio available"}</p>
        </div>

        {/* Optional View Profile link */}
      </div>
    </motion.div>
  );
};
// ================= MAIN COMPONENT =================
export default function Home() {
  const [internships, setInternships] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loadings, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  const { user, loading } = useAuth();

  // Hero Background Auto Change

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [iRes, mRes] = await Promise.all([
          fetch(`${API}/upload/internships/list/`),
          fetch(`${API}/api/mentors/list/`),
        ]);
        const internshipsData = await iRes.json();
        const mentorsData = await mRes.json();

        setInternships(internshipsData.slice(0, 4));
        setMentors(mentorsData.slice(0, 4));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-16 md:space-y-20 pb-16 md:pb-20 bg-[#fcfcfc]">
      {/* HERO SECTION - Responsive */}
      {/* HERO SECTION - FULLY RESPONSIVE */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Hero background – dark fallback always visible */}
        {/* HERO IMAGE SLIDER */}
        <div className="absolute inset-2 z-0">
          <HeroPanels />
          {/* OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50 z-10 pointer-events-none" />{" "}
        </div>

        {/* Content */}
      </section>

      {/* STATS SECTION - Responsive */}
      <div className=" -mt-30 sm:-mt-28 md:-mt-32 relative z-20">
        {!user ? (
          <>
            <section className="relative overflow-hidden  border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black px-6 py-6 md:px-10 shadow-xl">
              {/* Background Glow */}
              <div className="absolute -left-20 top-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.06]">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* Left Content */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-2xl"
                >
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-sm font-medium text-violet-300 backdrop-blur-md">
                    <Sparkles className="h-4 w-4" />
                    Partnership Program
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
                    Partner With Us & Grow Together
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                    Promote your brand, collaborate with our ecosystem, and
                    unlock premium partnership opportunities through our
                    platform.
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Link
                    href="/partner/login"
                    className="group inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-zinc-200"
                  >
                    Become a Partner
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-white p-6 lg:p-10 shadow-xl">
              {stats.map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <stat.icon className="text-blue-600" size={24} />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-gray-900">
                    <CountUp from={0} to={stat.value} duration={2} />
                    {stat.suffix}
                  </div>
                  <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FEATURED INTERNSHIPS SECTION */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Featured Internships
            </h2>
            <p className="text-gray-500">
              The most recent opportunities from top-tier companies.
            </p>
          </div>
          <Link
            href="/internships"
            className="text-blue-600 font-bold hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            View All Opportunities <ArrowRight size={18} />
          </Link>
        </div>

        {/* Cards Container - Yeh part change kiya hai */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loadings
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-full h-72 sm:h-80 md:h-84 bg-gray-100 animate-pulse rounded-3xl"
                />
              ))
            : internships.map((i) => <InternshipCard key={i._id} item={i} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base md:text-lg">
              Your simple 3-step journey to a successful career in tech.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Steps remain same - only gap adjusted */}
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center group"
            >
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform shadow-lg shadow-blue-200">
                <Search size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                1. Discover
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                Browse through verified internships and specialized courses that
                fit your goals.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center group"
            >
              <div className="w-20 h-20 bg-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-6 group-hover:rotate-0 transition-transform shadow-lg shadow-purple-200">
                <Zap size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                2. Upskill
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                Learn from the best mentors and work on real-world projects to
                build your portfolio.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center group"
            >
              <div className="w-20 h-20 bg-green-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-green-200">
                <Briefcase size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                3. Get Hired
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                Apply with confidence and secure your position at your dream
                company.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US + IMAGE */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              Why Students <br className="hidden md:block" />{" "}
              <span className="text-blue-600">Trust Our Platform</span>
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: "Verified Internships",
                  desc: "Every opportunity is manually checked for quality and authenticity.",
                  icon: CheckCircle2,
                  color: "text-green-500",
                },
                {
                  title: "Global Certificates",
                  desc: "Earn certificates that are recognized by top tech companies globally.",
                  icon: Trophy,
                  color: "text-yellow-500",
                },
                {
                  title: "1-on-1 Guidance",
                  desc: "Connect directly with mentors who are currently working in top firms.",
                  icon: Target,
                  color: "text-blue-500",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-start p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all"
                >
                  <item.icon className={`${item.color} shrink-0`} size={28} />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="text-gray-500 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200"
              alt="Students learning"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 p-8 text-white space-y-3">
              <h3 className="text-4xl font-black">94%</h3>
              <p className="text-lg font-semibold text-blue-400">
                Student Success Rate
              </p>
              <p className="text-sm text-gray-200 max-w-xs">
                Join 10,000+ learners building real-world skills and landing top
                internships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className="max-w-7xl mx-auto px-4 py-10 overflow-hidden">
        <p className="text-center text-black-400 font-bold uppercase tracking-[0.2em] text-sm mb-10">
          Trusted by students from
        </p>

        <div className="relative ">
          {/* Left to right scroll */}
          <div className="flex overflow-hidden mb-6">
            <div className="flex animate-scroll-left-to-right gap-8 md:gap-16 lg:gap-24 py-4">
              {/* First set */}
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                GOOGLE
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                MICROSOFT
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                AMAZON
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                NETFLIX
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                ADOBE
              </h3>
              {/* Duplicate for seamless loop */}
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                GOOGLE
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                MICROSOFT
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                AMAZON
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                NETFLIX
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                ADOBE
              </h3>
            </div>
          </div>

          {/* Right to left scroll */}
          <div className="flex overflow-hidden">
            <div className="flex animate-scroll-right-to-left gap-8 md:gap-16 lg:gap-24 py-4">
              {/* First set */}
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                SPOTIFY
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                META
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                APPLE
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                TESLA
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                UBER
              </h3>
              {/* Duplicate for seamless loop */}
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                SPOTIFY
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                META
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                APPLE
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                TESLA
              </h3>
              <h3 className="text-2xl md:text-3xl font-black italic whitespace-nowrap opacity-40">
                UBER
              </h3>
            </div>
          </div>

          {/* Gradient overlays for smooth edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-white pointer-events-none"></div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      {!user && (
        <>
          {" "}
          <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 py-16 md:py-20">
            {/* Background Glows */}
            <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.06]">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
              <div className="space-y-6">
                {/* Main Heading */}
                <h2 className="text-4xl md:text-4xl lg:text-5xl font-bold text-white tracking-tighter leading-tight">
                  Ready to jumpstart your career?
                </h2>

                {/* Subheading */}
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Join thousands of students gaining real industry experience
                  through expert mentorship and recognized certifications.
                </p>

                {/* CTA Button */}
                <div className="pt-4">
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-3 bg-white text-black hover:bg-gray-100 px-10 py-3 font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-white/20"
                  >
                    Get Started Free
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                </div>

                {/* Trust Signals */}
              </div>
            </div>
          </section>
        </>
      )}

      {/* MENTORS SECTION - Cards Auto Adjust */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 px-2">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Top Mentors
            </h2>
            <p className="text-gray-500">
              Learn directly from experts with real industry experience.
            </p>
          </div>

          {/* ✅ fixed link */}
          <Link
            href="/mentors"
            className="text-blue-600 font-bold hover:underline flex items-center gap-1"
          >
            View All Mentors <ArrowRight size={18} />
          </Link>
        </div>

        {/* ✅ FIXED GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {loadings
            ? [1, 2, 3, 4].map((i) => (
                // ✅ FIXED SKELETON
                <div
                  key={i}
                  className="w-full aspect-[4/5] bg-gray-100 animate-pulse rounded-2xl"
                />
              ))
            : mentors.map((m) => <MentorCard key={m._id} mentor={m} />)}
        </div>
      </section>

      {!user && (
        <>
          <section className="relative overflow-hidden py-6 md:px-10">
            <FAQPage />
          </section>
        </>
      )}
    </div>
  );
}
