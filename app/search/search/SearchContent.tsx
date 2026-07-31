"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FiSearch, FiSliders, FiX, FiStar, FiClock, FiTrendingUp, FiBook, FiBriefcase, FiChevronDown, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type ContentType = "all" | "internship" | "course";
type SortOption = "relevance" | "newest" | "rating" | "popular";
type Category = {
  id: string;
  name: string;
  icon: string;
};

interface SearchResult {
  id: string;
  type: "internship" | "course";
  title: string;
  company?: string; // for internships
  instructor?: string; // for courses
  thumbnail: string;
  rating: number;
  reviews: number;
  duration?: string; // e.g., "6 months", "12 weeks"
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  category: string;
  skills: string[];
  stipend?: string; // for internships
  price?: number; // for courses (0 = free)
  originalPrice?: number;
  description: string;
  createdAt: string; // ISO date
}

// ──────────────────────────────────────────────
// Mock Data – replace with API / Elasticsearch later
// ──────────────────────────────────────────────
const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "course",
    title: "Full-Stack Web Development Bootcamp 2026",
    instructor: "Angela Yu",
    thumbnail: "/course-thumb-1.jpg",
    rating: 4.7,
    reviews: 23500,
    duration: "12 weeks",
    level: "Beginner",
    category: "development",
    skills: ["React", "Node.js", "MongoDB"],
    price: 499,
    originalPrice: 3499,
    description: "Become a full-stack developer with this comprehensive bootcamp. Build 16+ projects.",
    createdAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "2",
    type: "internship",
    title: "Frontend Developer Intern",
    company: "TechCorp",
    thumbnail: "/intern-thumb-1.jpg",
    rating: 4.4,
    reviews: 120,
    duration: "6 months",
    level: "Intermediate",
    category: "development",
    skills: ["React", "TypeScript", "CSS"],
    stipend: "₹25,000/month",
    description: "Work on live projects with a dynamic team. Remote friendly.",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    id: "3",
    type: "course",
    title: "Machine Learning A-Z™: Hands-On Python & R",
    instructor: "Kirill Eremenko",
    thumbnail: "/course-thumb-2.jpg",
    rating: 4.6,
    reviews: 18000,
    duration: "8 weeks",
    level: "Intermediate",
    category: "data-science",
    skills: ["Python", "ML", "Deep Learning"],
    price: 599,
    originalPrice: 3999,
    description: "Learn Machine Learning using Python & R. Build models and deploy them.",
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "4",
    type: "internship",
    title: "Data Analyst Intern",
    company: "DataGenix",
    thumbnail: "/intern-thumb-2.jpg",
    rating: 4.8,
    reviews: 89,
    duration: "3 months",
    level: "Beginner",
    category: "data-science",
    skills: ["SQL", "Excel", "Tableau"],
    stipend: "₹20,000/month",
    description: "Analyze real-world datasets and deliver insights to stakeholders.",
    createdAt: "2026-06-05T10:00:00Z",
  },
  {
    id: "5",
    type: "course",
    title: "UI/UX Design Mastery: From Beginner to Pro",
    instructor: "Daniel Scott",
    thumbnail: "/course-thumb-3.jpg",
    rating: 4.9,
    reviews: 8700,
    duration: "6 weeks",
    level: "All Levels",
    category: "design",
    skills: ["Figma", "User Research", "Prototyping"],
    price: 449,
    originalPrice: 2499,
    description: "Master UI/UX design with Figma. Create stunning interfaces & prototypes.",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "6",
    type: "internship",
    title: "Graphic Design Intern",
    company: "CreativeMinds",
    thumbnail: "/intern-thumb-3.jpg",
    rating: 4.3,
    reviews: 45,
    duration: "4 months",
    level: "Intermediate",
    category: "design",
    skills: ["Photoshop", "Illustrator", "Branding"],
    stipend: "₹18,000/month",
    description: "Design marketing collateral for clients across industries.",
    createdAt: "2026-05-25T10:00:00Z",
  },
];

const categories: Category[] = [
  { id: "all", name: "All", icon: "🌟" },
  { id: "development", name: "Development", icon: "💻" },
  { id: "data-science", name: "Data Science", icon: "📊" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "business", name: "Business", icon: "📈" },
  { id: "marketing", name: "Marketing", icon: "📣" },
  { id: "personal-development", name: "Personal Development", icon: "🌱" },
];

const trendingSearches = [
  "React",
  "Full Stack",
  "Machine Learning",
  "UI/UX Design",
  "Data Science",
  "Python",
  "Digital Marketing",
  "Frontend Internship",
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const getSortFunction = (sort: SortOption) => {
  switch (sort) {
    case "newest":
      return (a: SearchResult, b: SearchResult) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "rating":
      return (a: SearchResult, b: SearchResult) => b.rating - a.rating;
    case "popular":
      return (a: SearchResult, b: SearchResult) => b.reviews - a.reviews;
    default: // relevance – for mock we'll just do a simple title match or keep order
      return undefined;
  }
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State from URL / internal
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState<ContentType>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<string[]>([]); // e.g., "free", "paid"
  const [durationFilter, setDurationFilter] = useState<string[]>([]);

  // Derived data – filtered and sorted results
  const results = useMemo(() => {
    let filtered = [...mockResults];

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.skills.some((s) => s.toLowerCase().includes(q)) ||
          item.description.toLowerCase().includes(q)
      );
    }

    // Content type
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Level filter
    if (levelFilter.length > 0) {
      filtered = filtered.filter((item) => levelFilter.includes(item.level));
    }

    // Price filter (only applies to courses)
    if (priceFilter.length > 0) {
      filtered = filtered.filter((item) => {
        if (item.type !== "course") return true; // keep internships unchanged
        if (priceFilter.includes("free") && item.price === 0) return true;
        if (priceFilter.includes("paid") && item.price && item.price > 0) return true;
        return false;
      });
    }

    // Duration filter (simplified; real implementation would parse)
    if (durationFilter.length > 0) {
      filtered = filtered.filter((item) => {
        if (!item.duration) return true;
        const weeks = extractWeeks(item.duration);
        if (durationFilter.includes("short") && weeks <= 12) return true;
        if (durationFilter.includes("medium") && weeks > 12 && weeks <= 24) return true;
        if (durationFilter.includes("long") && weeks > 24) return true;
        return false;
      });
    }

    // Sort
    const sortFn = getSortFunction(sortBy);
    if (sortFn) {
      filtered.sort(sortFn);
    }

    return filtered;
  }, [query, typeFilter, selectedCategory, sortBy, levelFilter, priceFilter, durationFilter]);

  // Event handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with query
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setSelectedCategory("all");
    setLevelFilter([]);
    setPriceFilter([]);
    setDurationFilter([]);
    setSortBy("relevance");
  };

  const toggleLevelFilter = (level: string) => {
    setLevelFilter((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const togglePriceFilter = (price: string) => {
    setPriceFilter((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const toggleDurationFilter = (dur: string) => {
    setDurationFilter((prev) =>
      prev.includes(dur) ? prev.filter((d) => d !== dur) : [...prev, dur]
    );
  };

  // Sync URL query param on mount
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo back to home */}
          <Link href="/" className="hidden sm:block">
            <Image src="/logo.png" alt="Logo" width={80} height={60} className="h-8 w-auto" />
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex-1 relative max-w-3xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for courses, internships, skills..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={18} />
              </button>
            )}
          </form>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-gray-600 relative"
          >
            <FiSliders size={22} />
            {(levelFilter.length > 0 || priceFilter.length > 0 || durationFilter.length > 0) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {levelFilter.length + priceFilter.length + durationFilter.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile category scroll */}
        <div className="lg:hidden px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* ─── Sidebar Filters (Desktop) ─── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Content Type</h3>
                <div className="space-y-2">
                  {["all", "course", "internship"].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="typeFilter"
                        checked={typeFilter === type}
                        onChange={() => setTypeFilter(type as ContentType)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type === "all" ? "All" : type + "s"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Level</h3>
                <div className="space-y-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={levelFilter.includes(level)}
                        onChange={() => toggleLevelFilter(level)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Price</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceFilter.includes("free")}
                      onChange={() => togglePriceFilter("free")}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Free</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceFilter.includes("paid")}
                      onChange={() => togglePriceFilter("paid")}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Paid</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Duration</h3>
                <div className="space-y-2">
                  {[
                    { value: "short", label: "0-12 Weeks" },
                    { value: "medium", label: "12-24 Weeks" },
                    { value: "long", label: "24+ Weeks" },
                  ].map((d) => (
                    <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={durationFilter.includes(d.value)}
                        onChange={() => toggleDurationFilter(d.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(levelFilter.length > 0 || priceFilter.length > 0 || durationFilter.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {/* Desktop category bar and sort */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border-gray-200 rounded-md py-1 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Trending searches when no query and no filters active */}
            {!query && results.length === mockResults.length && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Trending Searches</h2>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        router.push(`/search?q=${encodeURIComponent(term)}`);
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {results.length} result{results.length !== 1 ? "s" : ""}
                {query && ` for "${query}"`}
              </p>
              {/* Mobile sort */}
              <div className="lg:hidden">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border-gray-200 rounded-md py-1 pl-2 pr-8"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image
                  src="/empty-search.svg"
                  alt="No results"
                  width={200}
                  height={200}
                  className="mx-auto mb-4 opacity-50"
                />
                <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                <p className="text-gray-500 mt-1">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination placeholder (can be implemented with real data) */}
            {results.length > 6 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex gap-1">
                  {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      className={`w-10 h-10 rounded-full text-sm font-medium ${
                        page === 1
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Type */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Content Type</h3>
                  {["all", "course", "internship"].map((type) => (
                    <label key={type} className="flex items-center gap-2 py-1">
                      <input
                        type="radio"
                        name="mobileType"
                        checked={typeFilter === type}
                        onChange={() => setTypeFilter(type as ContentType)}
                      />
                      <span className="text-sm capitalize">{type === "all" ? "All" : type + "s"}</span>
                    </label>
                  ))}
                </div>

                {/* Level */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Level</h3>
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <label key={level} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={levelFilter.includes(level)}
                        onChange={() => toggleLevelFilter(level)}
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>

                {/* Price */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Price</h3>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={priceFilter.includes("free")}
                      onChange={() => togglePriceFilter("free")}
                    />
                    <span className="text-sm">Free</span>
                  </label>
                  <label className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={priceFilter.includes("paid")}
                      onChange={() => togglePriceFilter("paid")}
                    />
                    <span className="text-sm">Paid</span>
                  </label>
                </div>

                {/* Duration */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Duration</h3>
                  {[
                    { value: "short", label: "0-12 Weeks" },
                    { value: "medium", label: "12-24 Weeks" },
                    { value: "long", label: "24+ Weeks" },
                  ].map((d) => (
                    <label key={d.value} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={durationFilter.includes(d.value)}
                        onChange={() => toggleDurationFilter(d.value)}
                      />
                      <span className="text-sm">{d.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-2 border border-gray-300 rounded-full text-sm"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-full text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ──────────────────────────────────────────────
// Helper: extract weeks from duration string
// ──────────────────────────────────────────────
function extractWeeks(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (!match) return 0;
  let weeks = parseInt(match[0]);
  if (duration.toLowerCase().includes("month")) weeks *= 4;
  return weeks;
}

// ──────────────────────────────────────────────
// Result Card Component
// ──────────────────────────────────────────────
function ResultCard({ item }: { item: SearchResult }) {
  return (
    <Link
      href={item.type === "internship" ? `/internships/${item.id}` : `/course/${item.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            item.type === "course" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            {item.type === "course" ? "Course" : "Internship"}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
          {item.title}
        </h3>
        {item.type === "course" && item.instructor && (
          <p className="text-xs text-gray-500 mb-1">{item.instructor}</p>
        )}
        {item.type === "internship" && item.company && (
          <p className="text-xs text-gray-500 mb-1">{item.company}</p>
        )}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-amber-500 font-bold text-sm">{item.rating}</span>
          <FiStar className="fill-amber-500 text-amber-500" size={14} />
          <span className="text-xs text-gray-500">({item.reviews.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          {item.duration && (
            <span className="flex items-center gap-1">
              <FiClock size={12} /> {item.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            • {item.level}
          </span>
        </div>
        {item.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {skill}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          {item.type === "course" ? (
            <div>
              {item.price === 0 ? (
                <span className="font-bold text-green-600">Free</span>
              ) : (
                <div>
                  <span className="font-bold text-gray-900">₹{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-gray-400 line-through ml-1">₹{item.originalPrice}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            item.stipend && (
              <span className="font-medium text-emerald-600 text-sm">{item.stipend}</span>
            )
          )}
        </div>
      </div>
    </Link>
  );
}