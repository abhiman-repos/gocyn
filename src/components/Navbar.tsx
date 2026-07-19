"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiBriefcase,
  FiUsers,
  FiUser,
  FiSettings,
  FiLogOut,
  FiSearch,
  FiLogIn,
  FiTrendingUp,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Fuse from "fuse.js";

type Suggestion = {
  label: string;
  type: "route" | "search";
  path?: string;
};

const suggestionsData: Suggestion[] = [
  { label: "profile", type: "route", path: "/profile" },
  { label: "home", type: "route", path: "/" },
  { label: "Settings", type: "route", path: "/settings" },
  { label: "Mentors", type: "route", path: "/mentors" },
  { label: "Contact Us", type: "route", path: "/contactus" },
  { label: "About", type: "route", path: "/about" },
  { label: "React internships", type: "search" },
  { label: "Frontend jobs", type: "search" },
  { label: "Backend internships", type: "search" },
  { label: "Full stack developer", type: "search" },
  { label: "MERN stack internship", type: "search" },
  { label: "UI/UX designer jobs", type: "search" },
];

const suggestionFuse = new Fuse(suggestionsData, {
  keys: ["label"],
  threshold: 0.3,
  includeScore: true,
});

const getSuggestions = (query: string): Suggestion[] => {
  if (!query.trim()) return [];
  const results = suggestionFuse.search(query);
  return results.slice(0, 8).map((r) => r.item);
};

export default function Navbar() {
  // ==========================================
  // 1. ALL HOOKS MUST GO HERE AT THE TOP
  // ==========================================
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMounted, setIsMounted] = useState(false); 

  const pathname = usePathname() || "";
  const router = useRouter();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const protectedRoutes = useMemo(() => ["/admin"], []);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const closeSearchState = useCallback(() => {
    setShowSuggestions(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.blur();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    closeSearchState();
    setSearch("");
  }, [pathname, closeSearchState]);

  // ==========================================
  // 2. EARLY RETURNS / CONDITIONAL RENDERS
  // ==========================================
  const hideNavbarRouters = [
    "/login",
    "/register",
    "/admin",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/internships/[id]",
    
  ];

  const shouldHide =
    hideNavbarRouters.includes(pathname) ||
    pathname.startsWith("/course/") ||
    pathname.startsWith("/mentors/") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/partner/") ||
    pathname.startsWith("/admin/");

  if (!isMounted || shouldHide) return null;

  // ==========================================
  // 3. REGULAR FUNCTIONS & RENDER
  // ==========================================
  const safeNavigate = (path: string) => {
    if (protectedRoutes.includes(path) && !isAdmin) {
      router.push("/login");
      return;
    }
    router.push(path);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setShowSuggestions(true);

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        const newResults = getSuggestions(value);
        setResults(newResults);
        setHighlightedIndex(-1);
      }, 180);
    } else {
      setResults([]);
      setHighlightedIndex(-1);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = search.trim();
    if (!query) return;

    if (highlightedIndex >= 0 && results[highlightedIndex]) {
      handleSelectSuggestion(results[highlightedIndex]);
      return;
    }

    router.push(`/internships?search=${encodeURIComponent(query)}`);
    closeSearchState();
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === "route" && suggestion.path) {
      safeNavigate(suggestion.path);
    } else {
      router.push(`/internships?search=${encodeURIComponent(suggestion.label)}`);
    }

    setSearch(suggestion.label);
    closeSearchState();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    const maxIndex = results.length > 0 ? results.length - 1 : 0; 

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
        break;

      case "Enter":
        e.preventDefault();
        handleSearchSubmit();
        break;

      case "Escape":
        e.preventDefault();
        closeSearchState();
        break;
    }
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0" aria-label="Home">
            <div className=" flex items-center justify-center ">
              <Image
                src="/logo.png"
                alt="Company Logo"
                height={90}
                width={80}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Search Bar - YouTube Style */}
          <div className="flex-1 max-w-xl mx-4 relative">
            <form onSubmit={handleSearchSubmit} className="relative" role="search">
              <div className="relative group">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search internships, skills, companies..."
                  aria-label="Search"
                  aria-expanded={showSuggestions}
                  aria-controls="search-suggestions"
                  role="combobox"
                  className="w-full pl-11 pr-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all duration-200"
                />
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (results.length > 0 || search.trim()) && (
                <motion.div
                  ref={suggestionsRef}
                  id="search-suggestions"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  role="listbox"
                >
                  {results.length > 0
                    ? results.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          onClick={() => handleSelectSuggestion(item)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          role="option"
                          aria-selected={highlightedIndex === index}
                          className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            highlightedIndex === index ? "bg-gray-100" : ""
                          }`}
                        >
                          {item.type === "search" ? (
                            <FiSearch className="text-gray-400 shrink-0" size={18} />
                          ) : (
                            <FiTrendingUp className="text-gray-400 shrink-0" size={18} />
                          )}
                          <span className="text-sm text-gray-700 truncate">
                            {item.label}
                          </span>
                        </div>
                      ))
                    : search.trim() && (
                        <div
                          onClick={handleSearchSubmit}
                          onMouseEnter={() => setHighlightedIndex(0)}
                          role="option"
                          aria-selected={highlightedIndex === 0}
                          className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer text-blue-600 ${
                            highlightedIndex === 0 ? "bg-gray-100" : ""
                          }`}
                        >
                          <FiSearch size={18} />
                          <span className="truncate">Search for &quot;{search}&quot;</span>
                        </div>
                      )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={isOpen}
            className="shrink-0 text-gray-700 hover:text-gray-900 transition"
          >
            {isOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-b shadow-lg md:shadow-xl md:absolute md:top-16 md:right-40 md:left-auto md:w-72 md:rounded-3xl md:overflow-hidden z-50"
          >
            <div className="px-6 py-6 md:py-4 space-y-1">
              
              {/* Internship */}
              <Link 
                href="/internships" 
                className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                <FiBriefcase size={20} className="text-gray-500" />
                Internship
              </Link>
              
              {/* Mentors */}
              <Link 
                href="/mentors" 
                className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                <FiUsers size={20} className="text-gray-500" />
                Mentors
              </Link>

              {user ? (
                <>
                  {/* Profile */}
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                    onClick={closeMenu}
                  >
                    <FiUser size={20} className="text-gray-500" />
                    Profile
                  </Link>

                  {/* Settings */}
                  <Link 
                    href="/profile/setting" 
                    className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                    onClick={closeMenu}
                  >
                    <FiSettings size={20} className="text-gray-500" />
                    Settings
                  </Link>

                  {/* Logout */}
                  <button 
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-red-500 hover:bg-red-50 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                  >
                    <FiLogOut size={20} className="text-red-500" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Login */}
                  <Link 
                    href="/login" 
                    className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 hover:scale-[1.02] rounded-2xl font-medium transition-all duration-200"
                    onClick={closeMenu}
                  >
                    <FiLogIn size={20} className="text-gray-500" />
                    Login
                  </Link>
                  <Link 
                    href="/register"
                    onClick={closeMenu}
                    className="block mt-4 bg-blue-600 text-white px-6 py-3.5 rounded-3xl text-center font-semibold hover:bg-blue-700 transition"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}