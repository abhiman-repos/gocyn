"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  FiBriefcase,
  FiUsers,
  FiAward,
  FiTarget,
  FiTrendingUp,
  FiZap,
  FiGlobe,
  FiBarChart2,
  FiBookOpen,
  FiMonitor,
  FiCheckCircle,
  FiStar,
  FiPlay,
  FiShield,
  FiClock,
} from "react-icons/fi";

// ─── Animation variants (reusable) ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function AboutClient() {
  return (
    <article>
      {/* ── HERO ── */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                <FiZap size={16} />
                India’s Fastest‑Growing Learning Ecosystem
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                We are <span className="text-blue-600">Gocyn</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-xl">
                The only platform that unifies <strong>online courses</strong>,{" "}
                <strong>real‑world internships</strong>, and{" "}
                <strong>industry certifications</strong> — purpose‑built to make
                you job‑ready, not just exam‑ready.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/courses"
                  className="bg-blue-600 text-white px-8 py-2 font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <FiPlay size={20} />
                  Explore Courses
                </Link>
                <Link
                  href="/internships"
                  className="border border-gray-300 px-8 py-2  font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2"
                >
                  <FiBriefcase size={20} />
                  Find Internships
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video bg-white  shadow-2xl overflow-hidden border border-gray-100">
                <Image
                  src="/logo.png"
                  alt="GOCYN team empowering students through courses and internships"
                  width={1400}
                  height={788}
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {/* Floating stat badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-2  flex items-center gap-4">
                <FiBarChart2 className="w-10 h-10 text-blue-600" />
                <div>
                  <div className="text-3xl font-extrabold text-blue-600">
                    5000+
                  </div>
                  <p className="font-medium text-sm">Students Already Placed</p>
                  <p className="text-xs text-gray-500">in top companies</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-12">
          <span className="text-sm font-medium uppercase tracking-widest opacity-60">
            Trusted by learners from
          </span>
          {/* Replace with real logos */}
          {["Google", "Microsoft", "Amazon", "Infosys", "TCS"].map((co) => (
            <div
              key={co}
              className="text-lg font-semibold opacity-40 hover:opacity-80 transition"
            >
              {co}
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE DO (Udemy × Internshala × GfG) ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
          
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Everything you need, in one platform
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              We’ve combined the best of{" "}
              <strong>Udemy, Internshala, and GeeksforGeeks</strong> to give you
              a single destination for courses, internships, and skill mastery.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-10"
          >
            {[
              {
                icon: FiMonitor,
                title: "Live & Recorded Courses",
                desc: "Master in‑demand skills with self‑paced courses or live bootcamps. Python, Data Science, Web Dev, DSA — taught by industry mentors.",
              },
              {
                icon: FiBriefcase,
                title: "Real Internships",
                desc: "Work on live projects with startups & MNCs. Every internship comes with a completion certificate and a performance letter.",
              },
              {
                icon: FiBookOpen,
                title: "Practice & Tutorials",
                desc: "Sharpen your coding with thousands of curated problems, articles, and company‑specific interview prep (like GfG).",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="bg-gray-50 p-10 rounded-3xl hover:shadow-xl transition-shadow group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition">
                  <item.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── OUR STORY + TIMELINE ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              From a dorm room to 5000+ careers
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Gocyn started in 2024 when three engineering students realised the
              gap between college curriculum and industry expectations. Today we’re
              India’s fastest‑growing upskilling platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            {[
              {
                year: "2024",
                icon: FiZap,
                detail:
                  "Founded in Indore with 12 students and 3 mentors. First 50 internships delivered.",
              },
              {
                year: "2025",
                icon: FiTrendingUp,
                detail:
                  "Crossed 500+ courses, 2000 active learners, and partnered with 100+ companies.",
              },
              {
                year: "Today",
                icon: FiGlobe,
                detail:
                  "5000+ students placed, 200+ hiring partners, 50+ expert mentors. Just getting started.",
              },
            ].map((item) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon className="w-9 h-9 text-blue-600" />
                </div>
                <h4 className="font-bold text-lg mb-2">{item.year}</h4>
                <p className="text-gray-600">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY METRICS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: FiUsers, value: "5000+", label: "Learners Empowered" },
              { icon: FiBriefcase, value: "200+", label: "Hiring Partners" },
              { icon: FiBookOpen, value: "50+", label: "Expert Mentors" },
              { icon: FiAward, value: "98%", label: "Internship‑to‑Job Rate" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <stat.icon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <div className="text-5xl font-extrabold text-blue-600">
                  {stat.value}
                </div>
                <div className="text-gray-600 mt-2 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            What our students say
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Priya Sharma",
                role: "SDE @ Google",
                text: "Gocyn’s internship gave me real project experience that I directly talked about in my Google interview. The mentor sessions were gold.",
              },
              {
                name: "Arjun Mehta",
                role: "Data Analyst, Amazon",
                text: "The DSA course + internship combo landed me my dream job. I’ve never seen a platform that combines both so well.",
              },
            ].map((t, idx) => (
              <motion.blockquote
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl shadow-sm border relative"
              >
                <FiStar className="w-6 h-6 text-yellow-500 absolute top-6 right-6" />
                <p className="text-gray-700 italic leading-relaxed">
                  “{t.text}”
                </p>
                <footer className="mt-6 font-semibold text-gray-900">
                  {t.name}
                </footer>
                <p className="text-sm text-gray-500">{t.role}</p>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR VALUES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            The Gocyn Way
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: FiTarget,
                title: "Job‑first Curriculum",
                desc: "Everything we build is mapped to real job requirements.",
              },
              {
                icon: FiShield,
                title: "100% Transparency",
                desc: "No hidden fees. No fake promises. Every internship is verified.",
              },
              {
                icon: FiUsers,
                title: "1‑on‑1 Mentorship",
                desc: "Weekly live sessions with industry experts.",
              },
              {
                icon: FiClock,
                title: "Learn at Your Pace",
                desc: "Self‑paced courses with lifetime access, just like Udemy.",
              },
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <v.icon className="w-12 h-12 mx-auto text-blue-600 mb-6" />
                <h3 className="font-bold text-xl mb-3">{v.title}</h3>
                <p className="text-gray-600">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ (long‑form, SEO‑rich) ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-8">
            {[
              {
                q: "How is Gocyn different from Udemy or Internshala?",
                a: "We combine the self‑paced learning of Udemy, the real internship opportunities of Internshala, and the structured skill‑building of GeeksforGeeks – all under one roof. You can learn a skill, practice it, and immediately apply it in a live internship.",
              },
              {
                q: "Are the internships remote or on‑site?",
                a: "All our internships are remote‑first, so you can work from anywhere. Some partner companies may offer on‑site opportunities after a successful remote stint.",
              },
              {
                q: "Will I get a certificate?",
                a: "Yes! You receive a verifiable industry certificate after every course and internship completion. Many of our certificates have helped students land interviews at top tech firms.",
              },
              {
                q: "Is there a free trial?",
                a: "We offer a selection of free courses and mini‑internships so you can experience Gocyn before committing. Check out our 'Free Learning' section.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-2xl shadow-sm"
              >
                <dt className="font-semibold text-lg flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 mt-0.5 text-blue-600 shrink-0" />
                  {faq.q}
                </dt>
                <dd className="mt-3 text-gray-600 leading-relaxed ml-8">
                  {faq.a}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-extrabold">
            Ready to transform your career?
          </h2>
          <p className="mt-4 text-xl opacity-90">
            Join 5,000+ learners who got hired through Gocyn’s courses & internships.
          </p>
        </div>
      </section>
    </article>
  );
}