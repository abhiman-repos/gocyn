"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Head from "next/head";
import {
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Shield,
  Clock,
  FileText,
  AlertCircle,
  CreditCard,
  Lock,
  UserCheck,
  Globe,
  Gavel,
  RefreshCw,
  BookOpen,
  Eye,
} from "lucide-react";

const scrollToElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const offsetTop = element.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: offsetTop, behavior: "smooth" });
  }
};

const sections = [
  { id: "acceptance", title: "Acceptance of Terms", icon: FileText, num: "01" },
  { id: "definitions", title: "Definitions", icon: BookOpen, num: "02" },
  { id: "eligibility", title: "Eligibility", icon: UserCheck, num: "03" },
  { id: "account", title: "Account & Security", icon: Lock, num: "04" },
  { id: "services", title: "Platform Services", icon: Globe, num: "05" },
  { id: "intellectual", title: "Intellectual Property", icon: Eye, num: "06" },
  { id: "user-conduct", title: "User Conduct", icon: AlertCircle, num: "07" },
  { id: "payments", title: "Payments & Refunds", icon: CreditCard, num: "08" },
  { id: "privacy", title: "Privacy & Data", icon: Shield, num: "09" },
  { id: "termination", title: "Termination", icon: X, num: "10" },
  { id: "liability", title: "Limitation of Liability", icon: Gavel, num: "11" },
  { id: "governing", title: "Governing Law", icon: Globe, num: "12" },
  { id: "changes", title: "Changes to Terms", icon: RefreshCw, num: "13" },
  { id: "contact", title: "Contact Us", icon: FileText, num: "14" },
];

export default function TermsAndConditions() {
  const lastUpdated = "26 May 2026";
  const effectiveDate = "01 January 2025";
  const [activeSection, setActiveSection] = useState<string>("acceptance");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) setActiveSection(section.id);
            });
          },
          { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms and Conditions – Gocyn",
    description:
      "Gocyn's Terms and Conditions governing access to online courses, mentorship programs, and internship opportunities in India. Read your rights, refund policy, and user obligations.",
    url: "https://gocyn.com/terms-and-conditions",
    dateModified: "2026-05-26",
    publisher: {
      "@type": "Organization",
      name: "Gocyn",
      url: "https://gocyn.com",
      logo: "https://gocyn.com/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        email: "legal@gocyn.com",
        contactType: "customer service",
        areaServed: "IN",
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://gocyn.com" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Terms and Conditions",
          item: "https://gocyn.com/terms-and-conditions",
        },
      ],
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://gocyn.com/terms-and-conditions",
    },
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the refund policy for Gocyn courses?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Gocyn offers a 14-day refund on courses if you have completed less than 20% of the content. Subscription fees are non-refundable after 7 days.",
        },
      },
      {
        "@type": "Question",
        name: "Who can use Gocyn?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Gocyn is available to users aged 13 and above. Users between 13–18 require parental or guardian consent to use the platform.",
        },
      },
      {
        "@type": "Question",
        name: "What law governs Gocyn's Terms and Conditions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Gocyn's Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Indore, Madhya Pradesh.",
        },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>Terms and Conditions | Gocyn – Online Courses, Internships & Mentorship Platform India</title>
        <meta
          name="description"
          content="Read Gocyn's Terms and Conditions. Understand your rights when enrolling in online courses, finding internships, or connecting with mentors. Includes refund policy, user conduct rules, and data protection guidelines for Indian learners."
        />
        <meta
          name="keywords"
          content="Gocyn terms and conditions, online learning terms India, internship platform terms, mentorship platform agreement, Gocyn refund policy, e-learning terms of service India, online courses legal agreement, Gocyn user agreement"
        />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://gocyn.com/terms-and-conditions" />
        <meta property="og:title" content="Terms and Conditions | Gocyn – India's Learning & Internship Platform" />
        <meta
          property="og:description"
          content="Official terms for Gocyn – India's platform for online courses, internships, and mentorship. Review user rights, refund policy, and data practices."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gocyn.com/terms-and-conditions" />
        <meta property="og:image" content="https://gocyn.com/og-terms.jpg" />
        <meta property="og:site_name" content="Gocyn" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms and Conditions | Gocyn" />
        <meta name="twitter:description" content="Gocyn's legal terms including refund policy, user conduct guidelines, and intellectual property rules for India's top learning platform." />
        <meta name="twitter:image" content="https://gocyn.com/twitter-terms.jpg" />
        <meta name="author" content="Gocyn Legal Team" />
        <meta name="geo.region" content="IN-MP" />
        <meta name="geo.placename" content="Indore, Madhya Pradesh, India" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Instrument Serif', serif; }
        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          z-index: 9999;
          transition: width 0.1s linear;
        }
        .toc-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.18s ease;
          text-decoration: none;
          color: #64748b;
          cursor: pointer;
        }
        .toc-link:hover {
          background: #f1f5f9;
          color: #1e293b;
          padding-left: 16px;
        }
        .toc-link.active {
          background: linear-gradient(135deg, #ede9fe, #e0e7ff);
          color: #4f46e5;
          font-weight: 600;
          border-left: 3px solid #4f46e5;
        }
        .toc-num {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          min-width: 22px;
          letter-spacing: 0.5px;
        }
        .toc-link.active .toc-num { color: #7c3aed; }
        .section-card {
          border-left: 3px solid transparent;
          padding: 32px 0;
          border-bottom: 1px solid #f1f5f9;
          scroll-margin-top: 100px;
        }
        .section-card:last-child { border-bottom: none; }
        .section-number {
          font-size: 11px;
          font-weight: 700;
          color: #4f46e5;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .section-title {
          font-family: 'Instrument Serif', serif;
          font-size: 26px;
          color: #0f172a;
          margin-bottom: 16px;
          line-height: 1.25;
        }
        .section-body {
          color: #475569;
          line-height: 1.8;
          font-size: 15px;
        }
        .section-body p { margin-bottom: 14px; }
        .section-body ul, .section-body ol {
          padding-left: 20px;
          margin-bottom: 14px;
        }
        .section-body li { margin-bottom: 8px; }
        .section-body strong { color: #1e293b; font-weight: 600; }
        .section-body a { color: #4f46e5; text-decoration: underline; }
        .highlight-box {
          background: linear-gradient(135deg, #fefce8, #fef9c3);
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 16px 20px;
          margin: 16px 0;
          font-size: 14px;
          color: #78350f;
        }
        .info-box {
          background: linear-gradient(135deg, #eff6ff, #e0e7ff);
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 16px 20px;
          margin: 16px 0;
          font-size: 14px;
          color: #1e40af;
        }
        .warn-box {
          background: linear-gradient(135deg, #fff1f2, #ffe4e6);
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 16px 20px;
          margin: 16px 0;
          font-size: 14px;
          color: #9f1239;
        }
        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        @media (max-width: 1280px) {
          .section-title { font-size: 22px; }
        }
      `}</style>

      {/* Scroll Progress */}
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        {/* ── Top Nav ── */}
        <nav
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "0 24px",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#64748b",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              aria-label="Back to Home"
            >
              <ArrowLeft size={16} />
              <span style={{ display: "none" }} className="sm:inline">Back to Gocyn</span>
            </Link>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 26,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                }}
              >
                Gocyn
              </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                className="tag-badge"
                style={{ background: "#ede9fe", color: "#4f46e5", display: "flex" as const }}
              >
                <Shield size={11} />
                Legal
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: "none",
                  padding: 8,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
                className="xl:hidden-btn"
                aria-label="Table of contents"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Mobile TOC ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: "fixed",
                inset: "64px 0 auto 0",
                zIndex: 40,
                background: "#fff",
                borderBottom: "1px solid #e2e8f0",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                maxHeight: "65vh",
                overflowY: "auto",
                padding: 20,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Jump to Section
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  className={`toc-link${activeSection === s.id ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToElement(s.id); setMobileMenuOpen(false); }}
                  href={`#${s.id}`}
                >
                  <span className="toc-num">{s.num}</span>
                  {s.title}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 24px 80px" }}>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>

            {/* ── Sidebar TOC ── */}
            <aside
              style={{
                width: 260,
                flexShrink: 0,
                position: "sticky",
                top: 84,
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
                display: "none",
              }}
              className="desktop-toc"
            >
              <style>{`
                @media (min-width: 1280px) {
                  .desktop-toc { display: block !important; }
                  .xl:hidden-btn { display: none !important; }
                }
                @media (max-width: 1279px) {
                  .xl:hidden-btn { display: flex !important; }
                }
              `}</style>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: "20px 16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                  Table of Contents
                </p>
                <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      className={`toc-link${activeSection === s.id ? " active" : ""}`}
                      onClick={(e) => { e.preventDefault(); scrollToElement(s.id); }}
                      href={`#${s.id}`}
                    >
                      <span className="toc-num">{s.num}</span>
                      {s.title}
                      {activeSection === s.id && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
                    </a>
                  ))}
                </nav>
              </div>
              {/* Quick info card */}
              <div style={{ marginTop: 16, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", borderRadius: 16, padding: 20, color: "#fff" }}>
                <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Need Help?</p>
                <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 12 }}>Questions about these terms? Our legal team is here.</p>
                <a href="mailto:legal@gocyn.com" style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd", textDecoration: "none" }}>legal@gocyn.com →</a>
              </div>
            </aside>

            {/* ── Main Content ── */}
            <main style={{ flex: 1, minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div style={{ padding: "48px 48px 36px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                    <span className="tag-badge" style={{ background: "#ede9fe", color: "#4f46e5" }}>
                      <Shield size={11} /> Terms of Service
                    </span>
                    <span className="tag-badge" style={{ background: "#f0fdf4", color: "#15803d" }}>
                      <FileText size={11} /> Version 3.0
                    </span>
                  </div>
                  <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, color: "#0f172a", lineHeight: 1.15, marginBottom: 16 }}>
                    Terms and<br />
                    <em>Conditions</em>
                  </h1>
                  <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.7, maxWidth: 600, marginBottom: 24 }}>
                    These terms govern your use of Gocyn — India's platform for online courses, internship opportunities, and expert mentorship. By using Gocyn, you agree to these terms. Please read them carefully.
                  </p>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#94a3b8" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} />
                      Effective: <strong style={{ color: "#475569" }}>{effectiveDate}</strong>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw size={14} />
                      Last updated: <strong style={{ color: "#475569" }}>{lastUpdated}</strong>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Globe size={14} />
                      Jurisdiction: <strong style={{ color: "#475569" }}>India (MP)</strong>
                    </span>
                  </div>
                </div>

                {/* Alert Box */}
                <div style={{ padding: "0 48px" }}>
                  <div className="info-box" style={{ marginTop: 32 }}>
                    <strong>📌 Quick Summary:</strong> You must be 13+ to use Gocyn. Course purchases are refundable within 14 days (if &lt;20% completed). All content is Gocyn's intellectual property. Disputes are resolved under Indian law in Indore, MP.
                  </div>
                </div>

                {/* Sections */}
                <div style={{ padding: "0 48px 48px" }}>

                  {/* 01 */}
                  <section id="acceptance" className="section-card">
                    <p className="section-number">01 — Acceptance</p>
                    <h2 className="section-title">Acceptance of Terms</h2>
                    <div className="section-body">
                      <p>
                        These Terms and Conditions ("Terms", "Agreement") constitute a legally binding contract between you ("User", "you", "your") and <strong>Gocyn</strong>, operated by Gocyn EdTech Private Limited ("Company", "we", "us", "our"), a company registered under the laws of India.
                      </p>
                      <p>
                        By accessing, registering on, or using the Gocyn website, mobile application, or any associated services (collectively, the "Platform"), you confirm that you have read, understood, and agree to be bound by these Terms, along with our <Link href="/privacy-policy">Privacy Policy</Link> and any additional guidelines published on the Platform.
                      </p>
                      <div className="warn-box">
                        <strong>⚠ Important:</strong> If you do not agree to these Terms, please discontinue use of the Platform immediately. Continued use constitutes unconditional acceptance.
                      </div>
                      <p>
                        These Terms apply to all visitors, registered users, course learners, internship seekers, and mentors using the Platform.
                      </p>
                    </div>
                  </section>

                  {/* 02 */}
                  <section id="definitions" className="section-card">
                    <p className="section-number">02 — Definitions</p>
                    <h2 className="section-title">Definitions</h2>
                    <div className="section-body">
                      <p>For clarity throughout these Terms, the following definitions apply:</p>
                      <ul>
                        <li><strong>"Platform"</strong> — The Gocyn website (gocyn.com), mobile apps, APIs, and all associated digital services.</li>
                        <li><strong>"Content"</strong> — All course videos, materials, assignments, quizzes, certificates, text, graphics, and code available on the Platform.</li>
                        <li><strong>"Course"</strong> — Any online educational program offered on Gocyn, including pre-recorded, live, or hybrid formats.</li>
                        <li><strong>"Internship Listing"</strong> — Any internship or work opportunity posted by an employer partner on the Platform.</li>
                        <li><strong>"Mentorship"</strong> — One-on-one or group sessions facilitated between a registered Mentor and a Learner via the Platform.</li>
                        <li><strong>"Subscription"</strong> — A recurring paid plan granting access to premium Platform features.</li>
                        <li><strong>"User Data"</strong> — Any personal information, usage data, or content submitted by you to the Platform.</li>
                        <li><strong>"Instructor"</strong> — An individual or entity that creates and publishes courses on the Platform.</li>
                      </ul>
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="eligibility" className="section-card">
                    <p className="section-number">03 — Eligibility</p>
                    <h2 className="section-title">User Eligibility</h2>
                    <div className="section-body">
                      <p>
                        Gocyn is available to individuals who meet the following eligibility criteria:
                      </p>
                      <ul>
                        <li>You are at least <strong>13 years of age</strong>. Users aged 13–17 must have explicit parental or legal guardian consent.</li>
                        <li>You are not barred from receiving services under the laws of India or any other applicable jurisdiction.</li>
                        <li>You have not previously been suspended or removed from the Platform for violating these Terms.</li>
                        <li>You have the legal authority to enter into this binding agreement.</li>
                      </ul>
                      <p>
                        Gocyn reserves the right to verify eligibility at any time and to suspend or terminate accounts that do not meet these requirements. By registering, you warrant that all information provided is truthful, accurate, and complete.
                      </p>
                      <div className="highlight-box">
                        <strong>For Institutional Users:</strong> If you are accessing Gocyn on behalf of a school, college, or corporate organization, you represent that you have the authority to bind that entity to these Terms.
                      </div>
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="account" className="section-card">
                    <p className="section-number">04 — Account</p>
                    <h2 className="section-title">Account Registration & Security</h2>
                    <div className="section-body">
                      <p>
                        To access Gocyn's full features, you must create an account by providing accurate, current, and complete information. You agree to keep your information updated at all times.
                      </p>
                      <p>You are responsible for:</p>
                      <ul>
                        <li>Maintaining the strict confidentiality of your login credentials (username, password, OTP).</li>
                        <li>All activities and transactions that occur under your account, whether authorized by you or not.</li>
                        <li>Immediately notifying Gocyn at <a href="mailto:support@gocyn.com">support@gocyn.com</a> of any unauthorized account access or security breach.</li>
                        <li>Never sharing, selling, or transferring your account to any third party.</li>
                        <li>Using a strong, unique password and enabling two-factor authentication where offered.</li>
                      </ul>
                      <p>
                        Gocyn will not be liable for any loss or damage arising from your failure to protect your account credentials. We reserve the right to disable accounts that we believe pose a security risk.
                      </p>
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="services" className="section-card">
                    <p className="section-number">05 — Services</p>
                    <h2 className="section-title">Platform Services</h2>
                    <div className="section-body">
                      <p>Gocyn provides the following core services, subject to these Terms:</p>
                      <ul>
                        <li><strong>Online Courses:</strong> Access to pre-recorded and live learning programs across technology, business, design, and other disciplines.</li>
                        <li><strong>Internship Opportunities:</strong> A curated marketplace connecting learners with verified employer partners for paid and unpaid internships across India.</li>
                        <li><strong>Mentorship Programs:</strong> Facilitated sessions between industry experts and learners for career guidance, skill development, and professional growth.</li>
                        <li><strong>Certifications:</strong> Completion certificates issued upon successfully finishing qualifying courses or programs.</li>
                        <li><strong>Community Features:</strong> Discussion forums, peer learning groups, and networking tools.</li>
                      </ul>
                      <p>
                        Gocyn reserves the right to modify, suspend, or discontinue any service at any time with reasonable notice. We do not guarantee the availability of any specific course, instructor, mentor, or internship listing.
                      </p>
                      <div className="info-box">
                        <strong>ℹ Service Availability:</strong> Platform availability may be subject to scheduled maintenance, third-party service outages, or force majeure events. We strive for 99.5% uptime but do not guarantee uninterrupted service.
                      </div>
                    </div>
                  </section>

                  {/* 06 */}
                  <section id="intellectual" className="section-card">
                    <p className="section-number">06 — Intellectual Property</p>
                    <h2 className="section-title">Intellectual Property Rights</h2>
                    <div className="section-body">
                      <p>
                        All content, materials, software, trademarks, service marks, and logos on the Platform are the exclusive property of Gocyn or its licensors, and are protected by Indian and international intellectual property laws, including the <strong>Copyright Act, 1957</strong>, the <strong>Trade Marks Act, 1999</strong>, and the <strong>Information Technology Act, 2000</strong>.
                      </p>
                      <p>
                        Upon purchasing a course or accessing platform services, Gocyn grants you a <strong>limited, personal, non-exclusive, non-transferable, revocable license</strong> to access and use the content solely for your own personal, non-commercial educational purposes.
                      </p>
                      <p>This license expressly does not permit you to:</p>
                      <ul>
                        <li>Copy, reproduce, distribute, or republish any course content.</li>
                        <li>Record, screenshot, or screen-capture video content.</li>
                        <li>Sell, license, sublicense, or commercially exploit any content.</li>
                        <li>Create derivative works or incorporate content into other materials.</li>
                        <li>Use Gocyn's trademarks, logos, or branding without prior written consent.</li>
                        <li>Reverse engineer or extract source code from the Platform.</li>
                      </ul>
                      <p>
                        <strong>User-Generated Content:</strong> By submitting content (reviews, forum posts, assignments) to the Platform, you grant Gocyn a worldwide, royalty-free, perpetual license to use, display, and distribute such content in connection with Platform operations.
                      </p>
                    </div>
                  </section>

                  {/* 07 */}
                  <section id="user-conduct" className="section-card">
                    <p className="section-number">07 — User Conduct</p>
                    <h2 className="section-title">User Conduct & Prohibited Activities</h2>
                    <div className="section-body">
                      <p>
                        Gocyn is committed to maintaining a safe, inclusive, and productive learning environment. By using the Platform, you agree not to engage in any of the following prohibited activities:
                      </p>
                      <p><strong>Account & Access Violations:</strong></p>
                      <ul>
                        <li>Creating multiple accounts to circumvent bans, refund limits, or promotional restrictions.</li>
                        <li>Sharing login credentials with others or allowing concurrent access from multiple devices in violation of your plan.</li>
                        <li>Using automated bots, scrapers, or scripts to access Platform content.</li>
                      </ul>
                      <p><strong>Content & IP Violations:</strong></p>
                      <ul>
                        <li>Downloading, recording, or redistributing course videos, materials, or assessments.</li>
                        <li>Uploading course content to third-party platforms (YouTube, Telegram, etc.) without authorization.</li>
                        <li>Submitting plagiarized work or impersonating another person in assessments.</li>
                      </ul>
                      <p><strong>Community Violations:</strong></p>
                      <ul>
                        <li>Harassing, bullying, threatening, or discriminating against other users, instructors, or mentors on any basis including caste, religion, gender, disability, or sexual orientation.</li>
                        <li>Posting spam, malware, phishing links, or misleading information.</li>
                        <li>Soliciting personal information from minors or other users.</li>
                      </ul>
                      <p><strong>Platform Security Violations:</strong></p>
                      <ul>
                        <li>Attempting to probe, scan, or test vulnerabilities of the Platform without authorization.</li>
                        <li>Introducing malicious code, viruses, or Trojan horses.</li>
                        <li>Interfering with the proper functioning of servers or networks connected to the Platform.</li>
                      </ul>
                      <div className="warn-box">
                        <strong>⚠ Consequences:</strong> Violations may result in immediate account suspension, permanent ban, forfeiture of purchased access, and/or civil or criminal legal action under applicable Indian law.
                      </div>
                    </div>
                  </section>

                  {/* 08 */}
                  <section id="payments" className="section-card">
                    <p className="section-number">08 — Payments</p>
                    <h2 className="section-title">Payments, Subscriptions & Refunds</h2>
                    <div className="section-body">
                      <p><strong>Pricing & Payment Processing:</strong></p>
                      <ul>
                        <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST) unless stated otherwise.</li>
                        <li>Payments are processed through secure third-party gateways (Razorpay, Stripe, UPI, etc.). Gocyn does not store your full payment card details.</li>
                        <li>International transactions may be subject to currency conversion fees charged by your bank or card issuer.</li>
                      </ul>
                      <p><strong>Subscriptions:</strong></p>
                      <ul>
                        <li>Subscription plans (monthly, quarterly, annual) automatically renew at the end of each billing cycle unless canceled at least <strong>24 hours before renewal</strong>.</li>
                        <li>You may cancel your subscription anytime from Account Settings. Cancellation takes effect at the end of the current billing period.</li>
                        <li>Gocyn reserves the right to modify subscription pricing with <strong>30 days' prior notice</strong>.</li>
                      </ul>
                      <p><strong>Refund Policy:</strong></p>
                      <ul>
                        <li><strong>Course Refunds:</strong> Available within <strong>14 calendar days</strong> of purchase, provided you have completed less than <strong>20%</strong> of the course content. Refund requests must be submitted to <a href="mailto:support@gocyn.com">support@gocyn.com</a> with your order details.</li>
                        <li><strong>Subscription Refunds:</strong> First-time subscribers may request a refund within <strong>7 days</strong> of the initial purchase. No refunds are issued for renewals.</li>
                        <li><strong>Mentorship Sessions:</strong> Cancellations made at least <strong>24 hours before</strong> the scheduled session are eligible for a full refund or credit. No refunds for late cancellations or no-shows.</li>
                        <li><strong>Non-Refundable Items:</strong> Promotional, discounted, or free courses; certificate fees; and custom corporate training packages are non-refundable.</li>
                      </ul>
                      <div className="highlight-box">
                        <strong>💳 Chargeback Policy:</strong> Initiating an unjustified chargeback or payment dispute with your bank may result in immediate account suspension. Gocyn will provide evidence to your bank contesting invalid chargebacks. Repeated misuse may result in legal action and recovery of processing fees.
                      </div>
                      <p>Approved refunds are processed within <strong>7–10 business days</strong> to the original payment method.</p>
                    </div>
                  </section>

                  {/* 09 */}
                  <section id="privacy" className="section-card">
                    <p className="section-number">09 — Privacy</p>
                    <h2 className="section-title">Privacy and Data Protection</h2>
                    <div className="section-body">
                      <p>
                        Gocyn takes your privacy seriously. Our collection, use, storage, and disclosure of your personal data are governed by our <Link href="/privacy-policy"><strong>Privacy Policy</strong></Link>, which is incorporated into these Terms by reference.
                      </p>
                      <p>Key data practices include:</p>
                      <ul>
                        <li>We collect personal data (name, email, phone number, payment info) necessary to provide our services.</li>
                        <li>We use cookies and analytics to improve Platform performance and personalize your experience.</li>
                        <li>We may share data with trusted third-party service providers (payment processors, cloud hosts, analytics tools) strictly for service delivery purposes.</li>
                        <li>We do not sell your personal data to advertisers or third parties for marketing purposes.</li>
                        <li>Data transfers to countries outside India are conducted in compliance with applicable data protection laws.</li>
                      </ul>
                      <p>
                        You have rights under the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, including the right to access, correct, and erase your personal data. To exercise these rights, contact <a href="mailto:privacy@gocyn.com">privacy@gocyn.com</a>.
                      </p>
                    </div>
                  </section>

                  {/* 10 */}
                  <section id="termination" className="section-card">
                    <p className="section-number">10 — Termination</p>
                    <h2 className="section-title">Termination of Account</h2>
                    <div className="section-body">
                      <p>
                        <strong>Termination by Gocyn:</strong> We reserve the right to suspend, restrict, or permanently terminate your account and access to the Platform at our sole discretion, immediately and without prior notice, if we determine that:
                      </p>
                      <ul>
                        <li>You have violated any provision of these Terms or any applicable law.</li>
                        <li>Your conduct is harmful to Gocyn, its users, instructors, partners, or third parties.</li>
                        <li>Continuing your access poses legal or reputational risk to Gocyn.</li>
                        <li>Required by law enforcement or judicial order.</li>
                      </ul>
                      <p>
                        <strong>Termination by You:</strong> You may close your account at any time by contacting <a href="mailto:support@gocyn.com">support@gocyn.com</a>. Account closure does not entitle you to a refund of any fees already paid, except where explicitly provided in our Refund Policy.
                      </p>
                      <p>
                        <strong>Effect of Termination:</strong> Upon termination, your right to access the Platform ceases immediately. Gocyn may retain your data as required by law or for legitimate business purposes, as outlined in the Privacy Policy. Sections pertaining to intellectual property, liability limitations, governing law, and indemnification survive termination.
                      </p>
                    </div>
                  </section>

                  {/* 11 */}
                  <section id="liability" className="section-card">
                    <p className="section-number">11 — Liability</p>
                    <h2 className="section-title">Disclaimer & Limitation of Liability</h2>
                    <div className="section-body">
                      <p>
                        <strong>Disclaimer of Warranties:</strong> The Platform and all content are provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, completeness, or non-infringement.
                      </p>
                      <p>Gocyn does not warrant that:</p>
                      <ul>
                        <li>The Platform will be uninterrupted, error-free, or free of viruses or other harmful components.</li>
                        <li>Course content will result in employment, career advancement, or specific skill acquisition.</li>
                        <li>Internship or job listings posted by third-party employers are accurate, current, or will result in placement.</li>
                        <li>Mentor advice constitutes professional legal, financial, or medical guidance.</li>
                      </ul>
                      <p>
                        <strong>Limitation of Liability:</strong> To the fullest extent permitted by Indian law, Gocyn, its directors, employees, instructors, and partners shall not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, including loss of profits, data, reputation, or goodwill, arising from your use of or inability to use the Platform.
                      </p>
                      <p>
                        Gocyn's total aggregate liability to you for any claims under or in connection with these Terms shall not exceed the <strong>total amount paid by you to Gocyn in the twelve (12) months preceding the claim</strong>.
                      </p>
                      <p>
                        <strong>Indemnification:</strong> You agree to indemnify and hold harmless Gocyn, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including attorney fees) arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.
                      </p>
                    </div>
                  </section>

                  {/* 12 */}
                  <section id="governing" className="section-card">
                    <p className="section-number">12 — Governing Law</p>
                    <h2 className="section-title">Governing Law & Dispute Resolution</h2>
                    <div className="section-body">
                      <p>
                        These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without giving effect to any conflict of law principles.
                      </p>
                      <p>
                        <strong>Informal Resolution:</strong> Before initiating any legal proceeding, you agree to first attempt to resolve the dispute informally by sending a written notice to <a href="mailto:legal@gocyn.com">legal@gocyn.com</a> detailing the nature of your claim. Gocyn will respond within 15 business days. If the dispute is not resolved within <strong>60 days</strong> of the notice, either party may proceed to formal resolution.
                      </p>
                      <p>
                        <strong>Jurisdiction:</strong> Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be subject to the <strong>exclusive jurisdiction of the courts located in Indore, Madhya Pradesh, India</strong>.
                      </p>
                      <p>
                        <strong>Applicable Laws:</strong> These Terms are subject to and interpreted in accordance with, among others:
                      </p>
                      <ul>
                        <li>Information Technology Act, 2000 and its Rules</li>
                        <li>Consumer Protection Act, 2019</li>
                        <li>Indian Contract Act, 1872</li>
                        <li>Digital Personal Data Protection Act, 2023</li>
                        <li>Copyright Act, 1957</li>
                      </ul>
                    </div>
                  </section>

                  {/* 13 */}
                  <section id="changes" className="section-card">
                    <p className="section-number">13 — Changes</p>
                    <h2 className="section-title">Modifications to These Terms</h2>
                    <div className="section-body">
                      <p>
                        Gocyn reserves the right to revise, update, or replace these Terms at any time. When changes are made:
                      </p>
                      <ul>
                        <li>The "Last Updated" date at the top of this page will be revised.</li>
                        <li>For material changes, we will notify you via email (at the address on your account) or a prominent in-app notice at least <strong>14 days before</strong> the changes take effect.</li>
                        <li>Continued use of the Platform after the effective date of changes constitutes your acceptance of the updated Terms.</li>
                        <li>If you do not agree to the revised Terms, you must discontinue use and may request account closure.</li>
                      </ul>
                      <p>
                        We encourage you to review these Terms periodically. The most current version will always be available at <a href="https://gocyn.com/terms-and-conditions">gocyn.com/terms-and-conditions</a>.
                      </p>
                    </div>
                  </section>

                  {/* 14 */}
                  <section id="contact" className="section-card">
                    <p className="section-number">14 — Contact</p>
                    <h2 className="section-title">Contact Us</h2>
                    <div className="section-body">
                      <p>If you have any questions, concerns, or requests regarding these Terms, please reach out to us:</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
                        {[
                          { label: "Legal Inquiries", email: "legal@gocyn.com", desc: "Terms, IP, disputes" },
                          { label: "Privacy Concerns", email: "privacy@gocyn.com", desc: "Data requests, DPDPA rights" },
                          { label: "General Support", email: "support@gocyn.com", desc: "Refunds, accounts, courses" },
                        ].map((c) => (
                          <div
                            key={c.email}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 12,
                              padding: 20,
                            }}
                          >
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{c.label}</p>
                            <a href={`mailto:${c.email}`} style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", textDecoration: "none" }}>{c.email}</a>
                            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{c.desc}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ marginTop: 20 }}>
                        <strong>Registered Office:</strong> Gocyn EdTech Private Limited, Indore, Madhya Pradesh – 452001, India.
                      </p>
                    </div>
                  </section>

                  {/* Footer Agreement Box */}
                  <div
                    style={{
                      marginTop: 40,
                      background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
                      borderRadius: 16,
                      padding: "32px 36px",
                      color: "#fff",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>By using Gocyn, you acknowledge that:</p>
                    <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                      You have read, understood, and agree to be legally bound by these Terms and Conditions, our Privacy Policy, and any other policies linked herein.
                    </p>
                    
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                      
                      <Link
                        href="/register"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#4f46e5",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 14,
                          padding: "12px 24px",
                          borderRadius: 10,
                          textDecoration: "none",
                        }}
                      >
                        Get Started on Gocyn <ChevronRight size={16} />
                      </Link>
                      <Link
                        href="/privacy-policy"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "rgba(255,255,255,0.1)",
                          color: "#e2e8f0",
                          fontWeight: 600,
                          fontSize: 14,
                          padding: "12px 24px",
                          borderRadius: 10,
                          textDecoration: "none",
                        }}
                      >
                        View Privacy Policy
                      </Link>
                    </div>
                  </div>

                </div>
              </motion.div>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            <p>© {new Date().getFullYear()} Gocyn EdTech Private Limited. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms-and-conditions", label: "Terms" },
                { href: "/refund-policy", label: "Refund Policy" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{ color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <p>
              Questions?{" "}
              <a href="mailto:legal@gocyn.com" style={{ color: "#4f46e5" }}>
                legal@gocyn.com
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}