"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FAQ {
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
}

// ── SVG Icon Components ────────────────────────────────────────────────────────
const Icons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
  ),
  Award: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  BookOpen: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Target: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Tag: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  Grid: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  MessageCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="1" /><path d="M9 22V12h6v10" /><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  ),
  GraduationCap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Frown: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
    </svg>
  ),
};

// ── SEO-optimized FAQ data ─────────────────────────────────────────────────────
const faqs: FAQ[] = [
  {
    category: "Internships",
    keywords: ["free internship with certificate", "online internship for freshers", "internship without experience"],
    question: "Can I get a free online internship with a certificate as a fresher?",
    answer:
      "Yes! Gocyn offers free online internships with verifiable certificates for freshers and students with no prior experience. Our entry-level programs are specifically designed for beginners — you learn by doing real projects under expert mentors from top companies. Upon completion, you receive an industry-recognized digital certificate you can add to LinkedIn and your resume instantly.",
  },
  {
    category: "Internships",
    keywords: ["internship for students", "part time internship work from home", "stipend internship"],
    question: "Are Gocyn internships work-from-home and suitable for college students?",
    answer:
      "Absolutely. All Gocyn internships are 100% remote and work-from-home. Programs are structured around your college schedule — flexible hours, weekend-friendly, and available in part-time formats. Whether you're in your 1st year or final semester, you can enrol and complete an internship without disrupting your studies.",
  },
  {
    category: "Internships",
    keywords: ["internship duration weeks", "how long is an internship", "short term internship certificate"],
    question: "How long is the internship program and when does it start?",
    answer:
      "Gocyn internships range from 4 weeks (short-term crash programs) to 12 weeks (deep-skill tracks). New batches start every month, so there's no waiting. After enrolling, you get immediate access to your project dashboard and mentor introduction within 24 hours.",
  },
  {
    category: "Internships",
    keywords: ["internship for placement", "internship to get job", "internship experience for resume"],
    question: "Will this internship help me get a job or campus placement?",
    answer:
      "Yes — it's one of the most effective ways to strengthen your placement profile. Recruiters specifically look for candidates with real project experience. Gocyn's internships give you a working project portfolio, an industry-recognized certificate, and a LinkedIn-shareable profile. Past interns have received placement offers from companies like TCS, Infosys, Wipro, Deloitte, and several funded startups.",
  },
  {
    category: "Certificates",
    keywords: ["industry recognized certificate", "certificate better than udemy", "certificate recognized by companies"],
    question: "Are Gocyn certificates recognized by companies and better than Udemy certificates?",
    answer:
      "Gocyn certificates are jointly issued with partner companies and professionals from Google, Microsoft, Amazon, and other top firms — making them significantly more credible than auto-generated course-completion certificates. Employers can verify your certificate in seconds on our Verify Certificate page. Unlike MOOCs, Gocyn certificates validate hands-on project work, not just video-watching.",
  },
  {
    category: "Certificates",
    keywords: ["how to verify certificate online", "fake certificate check", "certificate verification"],
    question: "How can I verify a Gocyn certificate — is it genuine?",
    answer:
      "Every certificate is assigned a unique Certificate ID and is permanently stored on our verification server. Anyone — a recruiter, college, or employer — can instantly verify authenticity at gocyn.com/verify by entering the certificate ID. Verification is free and takes under 10 seconds. This makes Gocyn certificates tamper-proof and far more trusted than printed or PDF-only certificates.",
  },
  {
    category: "Certificates",
    keywords: ["certificate for linkedin", "add certificate to linkedin", "digital certificate download"],
    question: "Can I add my Gocyn certificate to LinkedIn and share it digitally?",
    answer:
      "Yes. Your digital certificate comes with a shareable URL, a QR code, and a one-click 'Add to LinkedIn' button. Once you click it, LinkedIn pre-fills the certification details — issuer, date, and credential ID. Recruiters browsing your profile can verify the credential directly from LinkedIn without leaving the page.",
  },
  {
    category: "Courses",
    keywords: ["free online courses with certificate india", "best free courses for students", "courses for placement preparation"],
    question: "Does Gocyn offer free online courses with certificates for Indian students?",
    answer:
      "Yes. Gocyn provides free and paid courses across technology (Python, Web Development, Data Science, AI/ML), business (Digital Marketing, Finance), and design (UI/UX, Graphic Design). All free courses include a completion certificate. Premium tracks include live mentorship, project reviews, and placement assistance.",
  },
  {
    category: "Courses",
    keywords: ["courses better than coursera", "alternative to udemy india", "affordable online courses"],
    question: "How are Gocyn courses different from Udemy or Coursera?",
    answer:
      "Unlike Udemy or Coursera, Gocyn combines coursework with a real internship — you apply what you learn on live projects. This means you graduate with both a certificate AND work experience. Our mentors are active industry practitioners, not just content creators. Courses are priced affordably for Indian students, with free tracks and easy EMI options on premium plans.",
  },
  {
    category: "Courses",
    keywords: ["learn programming online free certificate", "coding courses for beginners", "web development internship"],
    question: "Can a complete beginner with no coding background join a tech internship or course?",
    answer:
      "Yes — many of our learners start with zero coding experience. We have beginner-friendly tracks in Web Development, Python, and Digital Marketing that assume no prior background. Each program starts with fundamentals and gradually moves to project work. Our mentors provide 1:1 guidance so no one gets left behind.",
  },
  {
    category: "Mentorship",
    keywords: ["1 on 1 mentorship online", "mentorship for students free", "career guidance for freshers"],
    question: "What kind of mentorship and career support does Gocyn provide?",
    answer:
      "Every enrolled student gets access to a dedicated industry mentor — a working professional from a relevant field. You get weekly 1:1 check-ins, project feedback, code/design reviews, and career advice. Our career support team also helps with resume building, LinkedIn optimization, interview preparation, and job referrals through our hiring partner network.",
  },
  {
    category: "Mentorship",
    keywords: ["what is selection process internship", "how to apply for internship online", "internship interview questions"],
    question: "What is the selection process to join a Gocyn internship?",
    answer:
      "The selection process is simple and merit-based: (1) Submit your profile and basic details, (2) Take a short online skill assessment (20–30 minutes), and (3) Attend a brief intro call with your assigned mentor. There's no prior experience required — we evaluate your enthusiasm and learning potential. Most applicants receive a decision within 48–72 hours of applying.",
  },
  {
    category: "Pricing",
    keywords: ["free internship no fees", "internship scam check", "paid internship certificate"],
    question: "Is there any registration fee? Is Gocyn legitimate and not a scam?",
    answer:
      "Registration on Gocyn is completely free — no hidden charges to apply or browse programs. Some premium programs have fees, which are clearly listed upfront. Gocyn is a registered company with verified mentor profiles and 10,000+ students certified. All payments are secured via Razorpay/Stripe. If you're ever unsure, email us at support@gocyn.com before paying anything.",
  },
  {
    category: "Pricing",
    keywords: ["stipend internship india", "paid internship work from home", "internship stipend amount"],
    question: "Do interns receive a stipend at Gocyn?",
    answer:
      "Select partner-company internships on Gocyn are paid and come with a stipend ranging from ₹2,000 to ₹10,000/month depending on the role and duration. These are clearly marked as 'Stipend Internship' in the listings. Free certificate internships are unpaid but provide all the learning benefits, certifications, and career support.",
  },
];

// ── Schema ─────────────────────────────────────────────────────────────────────
const buildSchemas = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Online Internships and Courses with Certificates — Gocyn",
    description:
      "Free and paid online internships with industry-recognized certificates for students and freshers. Real project experience, 1:1 mentorship, and placement support.",
    url: "https://www.gocyn.com",
    numberOfItems: 3,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Course",
          name: "Web Development Internship with Certificate",
          description:
            "Hands-on web development internship for beginners. Build real projects, earn an industry-recognized certificate, and get placement support.",
          provider: { "@type": "Organization", name: "Gocyn", sameAs: "https://www.gocyn.com" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          educationalLevel: "Beginner",
          teaches: ["HTML", "CSS", "JavaScript", "React"],
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Course",
          name: "Data Science & Python Internship with Certificate",
          description:
            "Learn Python and data science fundamentals through a real internship. Receive a verifiable certificate recognized by top companies.",
          provider: { "@type": "Organization", name: "Gocyn", sameAs: "https://www.gocyn.com" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          educationalLevel: "Beginner to Intermediate",
          teaches: ["Python", "Pandas", "Machine Learning", "Data Visualization"],
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Course",
          name: "Digital Marketing Internship with Certificate",
          description:
            "Work-from-home digital marketing internship. Master SEO, social media, and paid ads while earning an industry-recognized certificate.",
          provider: { "@type": "Organization", name: "Gocyn", sameAs: "https://www.gocyn.com" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
          educationalLevel: "Beginner",
          teaches: ["SEO", "Google Ads", "Social Media Marketing", "Content Marketing"],
        },
      },
    ],
  };

  return { faqSchema, courseSchema };
};

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Internships", "Certificates", "Courses", "Mentorship", "Pricing"] as const;

type CategoryKey = typeof CATEGORIES[number];

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  All:          <Icons.Grid />,
  Internships:  <Icons.Briefcase />,
  Certificates: <Icons.Award />,
  Courses:      <Icons.BookOpen />,
  Mentorship:   <Icons.Target />,
  Pricing:      <Icons.Tag />,
};

// ── Stats config ───────────────────────────────────────────────────────────────
const STATS = [
  { label: "Students Certified", value: "10,000+", icon: <Icons.Users /> },
  { label: "Hiring Partners",    value: "200+",    icon: <Icons.Building /> },
  { label: "Industry Mentors",   value: "500+",    icon: <Icons.GraduationCap /> },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function FAQPage() {
  const [openIndex, setOpenIndex]       = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery]   = useState("");

  const { faqSchema, courseSchema } = buildSchemas();

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggle = (index: number) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: faqs.length };
    faqs.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />

      <div className="min-h-screen bg-[#fcfcfc] from-slate-50 via-blue-50/30 to-indigo-50/20">

        {/* ── Hero Header ────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
            {/* Badge */}


            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Frequently Asked{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Questions
              </span>
            </h1>

            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Everything about Gocyn internships, courses, and certificates — answered.
              Can't find your answer?{" "}
              <Link href="/contactus" className="text-blue-600 hover:underline font-medium">
                Ask us directly →
              </Link>
            </p>
          </div>
        </div>

        {/* ── Main Content ───────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                  setSearchQuery("");
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <span className={activeCategory === cat ? "text-white" : "text-gray-400"}>
                  {CATEGORY_ICONS[cat]}
                </span>
                {cat}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeCategory === cat ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Stats Bar */}

          {/* FAQ Accordion */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4 text-gray-300">
                <Icons.Frown />
              </div>
              <p className="text-gray-500 text-lg">No questions found for that search.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-blue-600 hover:underline text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {filteredFaqs.map((faq) => {
                const originalIndex = faqs.indexOf(faq);
                const isOpen = openIndex === originalIndex;

                return (
                  <div
                    key={originalIndex}
                    role="listitem"
                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "border-blue-200 shadow-md shadow-blue-50"
                        : "border-gray-100 shadow-sm hover:border-blue-100 hover:shadow-md"
                    }`}
                  >
                    <button
                      onClick={() => toggle(originalIndex)}
                      aria-expanded={isOpen}
                      className="w-full px-6 py-5 text-left flex justify-between items-start gap-4 group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full transition-colors ${
                            isOpen ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-300"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-semibold text-base leading-snug transition-colors ${
                              isOpen ? "text-blue-700" : "text-gray-800 group-hover:text-gray-900"
                            }`}
                          >
                            {faq.question}
                          </span>
                          {/* Category tag with icon */}
                          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                            <span className="opacity-60">{CATEGORY_ICONS[faq.category as CategoryKey]}</span>
                            {faq.category}
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isOpen
                            ? "bg-blue-600 text-white rotate-180"
                            : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
                        }`}
                        aria-hidden="true"
                      >
                        <Icons.ChevronDown />
                      </span>
                    </button>

                    {/* Answer panel */}
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                      } overflow-hidden`}
                    >
                      <div className="px-6 pb-6 pt-0 ml-5">
                        <div className="pl-3 border-l-2 border-blue-100">
                          <p className="text-gray-600 leading-relaxed text-[15px]">{faq.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white overflow-hidden relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 bg-white"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -left-8 w-64 h-64 rounded-full opacity-10 bg-white"
            />
            <h2 className="text-2xl font-bold mb-3 relative z-10">Still have questions?</h2>
            <p className="text-blue-100 mb-6 relative z-10 max-w-md mx-auto">
              Our team responds within 2 hours on business days. Or browse all programs and apply for free right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
              <Link
                href="/contactus"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 hover:bg-blue-50 transition-colors"
              >
                <Icons.MessageCircle />
                Contact Support
              </Link>
              <Link
                href="/internships"
                className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur text-white border border-white/20 font-semibold px-6 py-3  hover:bg-blue-500/50 transition-colors"
              >
                Browse Internships
                <Icons.ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
