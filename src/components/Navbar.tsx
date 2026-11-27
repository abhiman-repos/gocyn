"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FiUsers,
  FiUser,
  FiSettings,
  FiLogOut,
  FiSearch,
  FiLogIn,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiBook,
  FiHome,
  FiXCircle,
  FiArrowLeft,
  FiSliders,
} from "react-icons/fi";
import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import NotificationBell from "./notifications/NotificationBell";

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

const PLACEHOLDER_WORDS = [
  "frontend",
  "backend",
  "AI & ML",
  "React",
  "Node.js",
  "Full Stack",
  "DevOps",
  "UI/UX",
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"semantic" | "keyword">("semantic");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMounted, setIsMounted] = useState(false);

  const [placeholderWord, setPlaceholderWord] = useState(PLACEHOLDER_WORDS[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const pathname = usePathname() || "";
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Refs ──────────────────────────────────────────────────────────────
  // Home page (desktop only)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // /search page (desktop & mobile)
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSuggestionsRef = useRef<HTMLDivElement>(null);
  const mobileSuggestionsRef = useRef<HTMLDivElement>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const protectedRoutes = useMemo(() => ["/admin"], []);
  const isAdmin = user?.role === "admin";
  const isHomePage = pathname === "/";
  const isSearchPage = pathname === "/search";

  // ─── Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  // ─── Animated placeholder ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPlaceholderWord(PLACEHOLDER_WORDS[placeholderIndex]);
  }, [placeholderIndex]);

  // ─── Sync search with URL query on /search ────────────────────────────
  useEffect(() => {
    if (isSearchPage) {
      setSearch(searchParams.get("q") || "");
      setSearchMode(searchParams.get("mode") === "keyword" ? "keyword" : "semantic");
    }
  }, [isSearchPage, searchParams]);

  // ─── Auto-focus on /search (visible input only) ───────────────────────
  useEffect(() => {
    if (isSearchPage) {
      const timer = setTimeout(() => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        if (isDesktop) {
          desktopSearchInputRef.current?.focus();
        } else {
          mobileSearchInputRef.current?.focus();
        }
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [isSearchPage]);

  // ─── Click outside to close suggestions ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        searchInputRef.current,
        suggestionsRef.current,
        desktopSearchInputRef.current,
        mobileSearchInputRef.current,
        desktopSuggestionsRef.current,
        mobileSuggestionsRef.current,
      ].filter(Boolean) as (HTMLElement | null)[];

      const isInside = refs.some(
        (el) => el && el.contains(event.target as Node)
      );

      if (!isInside) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Close search on route change (except when staying on /search) ───
  useEffect(() => {
    if (!isSearchPage) {
      setShowSuggestions(false);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setSearch("");
    }
  }, [pathname, isSearchPage]);

  // ─── Helpers ────────────────────────────────────────────────────────────
  const getActiveSearchInputRef = useCallback(() => {
    if (typeof window === "undefined") return searchInputRef;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isSearchPage) {
      return isDesktop ? desktopSearchInputRef : mobileSearchInputRef;
    }
    return searchInputRef;
  }, [isSearchPage]);

  const closeSearchState = useCallback(() => {
    setShowSuggestions(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    getActiveSearchInputRef().current?.blur();
  }, [getActiveSearchInputRef]);

  const closeMenu = () => setIsOpen(false);

  const safeNavigate = (path: string) => {
    if (protectedRoutes.includes(path) && !isAdmin) {
      router.push("/login");
      return;
    }
    router.push(path);
  };

  // ─── Search handlers ──────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setShowSuggestions(true);

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (value.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        setResults(getSuggestions(value));
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

    if (isSearchPage) {
      router.push(`/search?q=${encodeURIComponent(query)}&mode=${searchMode}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}&mode=${searchMode}`);
    }
    closeSearchState();
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === "route" && suggestion.path) {
      safeNavigate(suggestion.path);
    } else {
      const query = suggestion.label;
      if (isSearchPage) {
        router.push(`/search?q=${encodeURIComponent(query)}&mode=${searchMode}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}&mode=${searchMode}`);
      }
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
        if (search) {
          setSearch("");
          setResults([]);
          setHighlightedIndex(-1);
        } else {
          closeSearchState();
        }
        break;
    }
  };

  const clearSearch = () => {
    setSearch("");
    setResults([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    if (isSearchPage) router.push(`/search?mode=${searchMode}`);
    getActiveSearchInputRef().current?.focus();
  };

  // ─── Filter toggle ─────────────────────────────────────────────────────
  const toggleFilters = () => {
    window.dispatchEvent(new CustomEvent("toggleFilters"));
  };

  // ─── Render search input ───────────────────────────────────────────────
  // Home page → original style
  // /search page → YouTube style
  const renderSearchInput = (
    isYouTubeStyle = false,
    inputRef = searchInputRef,
    suggestionsRefProp = suggestionsRef
  ) => {
    const inputClass = isYouTubeStyle
      ? "w-full pl-11 max-w-6xl pr-36 py-2.5 bg-gray-100 border border-transparent focus:bg-white focus:border-gray-300 focus:ring-0 outline-none text-base pl-12 transition-all"
      : "w-half pl-10 pr-36 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all duration-200";

    return (
      <form
        onSubmit={handleSearchSubmit}
        className="relative w-full"
        role="search"
      >
        <div className="relative">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            onClick={() => {
              if (!isSearchPage) router.push("/search");
            }}
            placeholder={`Search ${placeholderWord}...`}
            aria-label="Search"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            role="combobox"
            className={inputClass}
            autoComplete="off"
          />

          {(isHomePage || isSearchPage) && <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {search && <button type="button" onClick={clearSearch} className="p-1 text-gray-400 transition hover:text-gray-600" aria-label="Clear search"><FiXCircle size={17} /></button>}
            <label className="sr-only" htmlFor="header-search-mode">Search mode</label>
            <select id="header-search-mode" value={searchMode} onChange={event => setSearchMode(event.target.value as "semantic" | "keyword")} className="max-w-28 cursor-pointer border-0 bg-transparent py-1 pl-1 pr-5 text-[11px] font-medium text-gray-600 outline-none focus:ring-0" aria-label="Search mode">
              <option value="semantic">Meaning-based</option>
              <option value="keyword">Keyword</option>
            </select>
          </div>}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (results.length > 0 || search.trim()) && (
            <motion.div
              ref={suggestionsRefProp}
              id="search-suggestions"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute w-full mt-2 bg-white shadow-xl py-1 z-50 overflow-hidden"
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
                        <FiSearch
                          className="text-gray-400 shrink-0"
                          size={18}
                        />
                      ) : (
                        <FiTrendingUp
                          className="text-gray-400 shrink-0"
                          size={18}
                        />
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
                      <span className="truncate">
                        {search}
                      </span>
                    </div>
                  )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    );
  };

  // ─── Early return for hidden routes ──────────────────────────────────
  const hideNavbarRouters = [
    "/login",
    "/register",
    "/admin",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/internships/[id]",
    "/onboarding"
  ];

  const shouldHide =
    hideNavbarRouters.includes(pathname) ||
    pathname.startsWith("/course/") ||
    pathname.startsWith("/mentors/") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith("/instructors/") ||
    pathname.startsWith("/admin/");

  if (!isMounted || shouldHide) return null;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* ─── Logo (hidden on search page) ─── */}
          {!isSearchPage && (
            <Link
              href="/"
              className="flex items-center shrink-0"
              aria-label="Home"
            >
              <Image
                src="/logo.png"
                alt="Company Logo"
                height={90}
                width={80}
                className="object-contain"
                priority
              />
            </Link>
          )}

          {/* ─── DESKTOP ─── */}
          <div className="hidden md:flex items-center gap-3 flex-1">
            {isSearchPage ? (
              // YouTube-style layout on /search
              <>
                <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 shrink-0"
                  aria-label="Go back"
                >
                  <FiArrowLeft size={22} />
                </button>


                <div className="flex-1 max-w-2xl">
                  {renderSearchInput(true, desktopSearchInputRef, desktopSuggestionsRef)}
                </div>
              </>
            ) : (
              // Normal home layout
              <>

                <div className="flex-1 max-w-2xl">
                  {renderSearchInput(false)}
                </div>

                <div className="flex items-center gap-6 shrink-0">

                  <Link
                    href="/"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Home
                  </Link>
                  <Link
                    href="/courses"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Courses
                  </Link>
                  <Link
                    href="/mentors"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Mentors
                  </Link>
                  <Link href="/verify" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                    Verify certificate
                  </Link>

                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        className="text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/profile/setting"
                        className="text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        Setting
                      </Link>
                      {pathname !== "/notifications" && <NotificationBell />}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="text-sm font-semibold bg-blue-500 text-white px-5 py-2.5 rounded-full hover:bg-blue-600"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── MOBILE ─── */}
          <div className="flex items-center gap-2 md:hidden flex-1">
            {isSearchPage ? (
              // YouTube-style mobile search page
              <>
                <button
                  onClick={() => router.back()}
                  className="p-2 -ml-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 shrink-0"
                  aria-label="Go back"
                >
                  <FiArrowLeft size={22} />
                </button>

                <div className="flex-1">
                  {renderSearchInput(true, mobileSearchInputRef, mobileSuggestionsRef)}
                </div>

                <button
                  onClick={toggleFilters}
                  className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 shrink-0"
                  aria-label="Open filters"
                >
                  <FiSliders size={22} />
                </button>
              </>
            ) : (
              // Default mobile: search icon + hamburger
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => router. push("/search")}
                  aria-label="Search"
                  className="p-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <FiSearch size={22} />
                </button>
                {user && pathname !== "/notifications" && <NotificationBell />}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label={isOpen ? "Close Menu" : "Open Menu"}
                  aria-expanded={isOpen}
                  className="p-2 text-gray-700 hover:text-gray-900 transition"
                >
                  {isOpen ? <FiX size={26} /> : <FiMenu size={26} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Menu (only on non-search pages) ─── */}
      {!isSearchPage && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-b shadow-lg md:hidden z-50"
            >
              <div className="px-6 py-6 space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                  onClick={closeMenu}
                >
                  <FiHome size={20} className="text-gray-500" />
                  Home
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                  onClick={closeMenu}
                >
                  <FiBook size={20} className="text-gray-500" />
                  Courses
                </Link>
                <Link
                  href="/mentors"
                  className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                  onClick={closeMenu}
                >
                  <FiUsers size={20} className="text-gray-500" />
                  Mentors
                </Link>
                <Link href="/verify" className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all" onClick={closeMenu}>
                  <FiBook size={20} className="text-gray-500" />
                  Verify certificate
                </Link>

                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                      onClick={closeMenu}
                    >
                      <FiUser size={20} className="text-gray-500" />
                      Profile
                    </Link>
                    <Link
                      href="/profile/setting"
                      className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                      onClick={closeMenu}
                    >
                      <FiSettings size={20} className="text-gray-500" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3.5 text-red-500 hover:bg-red-50 font-medium transition-all"
                    >
                      <FiLogOut size={20} className="text-red-500" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-200 font-medium transition-all"
                      onClick={closeMenu}
                    >
                      <FiLogIn size={20} className="text-gray-500" />
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMenu}
                      className="block mt-4 bg-blue-500 text-white px-6 py-2.5 text-center font-semibold rounded-full hover:bg-blue-700 transition"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </nav>
  );
}
