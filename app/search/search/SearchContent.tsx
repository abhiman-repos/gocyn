"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const API = process.env.APP_URL;
type ContentType = "all" | "course" | "mentor";
type SearchItem = {
  id: string;
  type: "course" | "mentor";
  title: string;
  description: string;
  image: string;
  category: string;
  level?: string;
  duration?: string;
  price?: number;
  instructor?: string;
  lessons?: number;
  outcomes: string[];
  email?: string;
  expertise?: string[];
  currentRole?: string;
  experience?: number;
  score: number;
};

function strings(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string")
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  return [];
}

function mapSearchResults(data: any): SearchItem[] {
  const courses: SearchItem[] = (
    Array.isArray(data.courses) ? data.courses : []
  ).map((course: any) => ({
    id: String(course.id || course._id),
    type: "course",
    title: course.title || "Untitled course",
    description:
      course.description ||
      "Explore the course curriculum and learning outcomes.",
    image: course.thumbnail_url || course.imageUrl || "/placeholder.jpg",
    category: course.category || "Course",
    level: course.level || "All levels",
    duration: course.duration,
    price: Number(course.price) || 0,
    instructor: course.instructor,
    lessons: Number(course.lessons) || 0,
    outcomes: strings(course.learning_outcomes),
    score: Number(course.search_score) || 0,
  }));
  const mentors: SearchItem[] = (
    Array.isArray(data.mentors) ? data.mentors : []
  ).map((mentor: any) => ({
    id: String(mentor._id),
    type: "mentor",
    title: mentor.name || "Gocyn mentor",
    description:
      mentor.bio ||
      "Connect with this approved mentor to explore their experience.",
    image: mentor.imageUrl || "/placeholder.jpg",
    category: "Mentor",
    instructor: mentor.company,
    currentRole: mentor.currentRole,
    experience: Number(mentor.experience) || 0,
    email: mentor.email,
    expertise: [...strings(mentor.expertise), ...strings(mentor.skills)].filter(
      (item, index, all) => all.indexOf(item) === index,
    ),
    outcomes: [],
    score: Number(mentor.search_score) || 0,
  }));
  return [...courses, ...mentors];
}

export default function SearchContent({
  scope = "all",
  initialCatalog,
}: {
  scope?: ContentType;
  initialCatalog?: { courses?: any[]; mentors?: any[] };
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const mode = searchParams.get("mode") === "keyword" ? "keyword" : "semantic";
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<ContentType>(scope);
  const [category, setCategory] = useState("all");
  const [levels, setLevels] = useState<string[]>([]);
  const [price, setPrice] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState<
    "relevance" | "name" | "price-low" | "price-high"
  >("relevance");
  const [items, setItems] = useState<SearchItem[]>(() =>
    initialCatalog ? mapSearchResults(initialCatalog) : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMode, setSearchMode] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expertise, setExpertise] = useState("all");

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      if (cleanQuery.length > 0) {
        setItems([]);
        setError("");
        setLoading(false);
        setSearchMode("");
        return;
      }
      if (initialCatalog) {
        setItems(mapSearchResults(initialCatalog));
        setError("");
        setLoading(false);
        setSearchMode("");
        return;
      }
      const controller = new AbortController();
      setLoading(true);
      setError("");
      const loadCatalog = async () => {
        try {
          const catalogType = scope === "all" ? "all" : scope;
          const endpoints: Promise<{ kind: string; data: any }>[] = [];
          if (catalogType !== "mentor")
            endpoints.push(
              fetch(`${API}/api/courses/list/`, {
                signal: controller.signal,
                cache: "no-store",
              }).then(async (response) => {
                if (!response.ok)
                  throw new Error("Courses are temporarily unavailable.");
                return { kind: "course", data: await response.json() };
              }),
            );
          if (catalogType !== "course")
            endpoints.push(
              fetch(`${API}/api/mentors/list/`, {
                signal: controller.signal,
                cache: "no-store",
              }).then(async (response) => {
                if (!response.ok)
                  throw new Error("Mentors are temporarily unavailable.");
                return { kind: "mentor", data: await response.json() };
              }),
            );
          const responses = await Promise.all(endpoints);
          setItems(
            mapSearchResults({
              courses:
                responses.find((response) => response.kind === "course")
                  ?.data || [],
              mentors:
                responses.find((response) => response.kind === "mentor")
                  ?.data || [],
            }),
          );
          setSearchMode("");
        } catch (cause) {
          if (cause instanceof Error && cause.name === "AbortError") return;
          setItems([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Catalog is temporarily unavailable.",
          );
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      };
      void loadCatalog();
      return () => controller.abort();
    }
    if (cleanQuery.length > 160) {
      setItems([]);
      setError("Search queries must be 160 characters or fewer.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        if (mode === "semantic") {
          const params = new URLSearchParams({
            q: cleanQuery,
            type: scope === "all" ? type : scope,
            limit: "30",
          });
          const response = await fetch(
            `${API}/api/search/semantic/?${params}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok)
            throw new Error(
              data.detail || "Semantic search is temporarily unavailable.",
            );
          setItems(mapSearchResults(data));
          setSearchMode("meaning-aware");
        } else {
          const endpoints: Promise<{ kind: string; data: any }>[] = [];
          const catalogType = scope === "all" ? type : scope;
          if (catalogType !== "mentor")
            endpoints.push(
              fetch(`${API}/api/courses/list/`, {
                signal: controller.signal,
                cache: "no-store",
              }).then(async (response) => {
                if (!response.ok)
                  throw new Error("Courses are temporarily unavailable.");
                return { kind: "course", data: await response.json() };
              }),
            );
          if (catalogType !== "course")
            endpoints.push(
              fetch(`${API}/api/mentors/list/`, {
                signal: controller.signal,
                cache: "no-store",
              }).then(async (response) => {
                if (!response.ok)
                  throw new Error("Mentors are temporarily unavailable.");
                return { kind: "mentor", data: await response.json() };
              }),
            );
          const responses = await Promise.all(endpoints);
          const source = {
            courses:
              responses.find((response) => response.kind === "course")?.data ||
              [],
            mentors:
              responses.find((response) => response.kind === "mentor")?.data ||
              [],
          };
          const ignoredTerms = new Set([
            "a",
            "an",
            "and",
            "are",
            "for",
            "from",
            "i",
            "in",
            "is",
            "it",
            "learn",
            "me",
            "my",
            "of",
            "on",
            "or",
            "please",
            "the",
            "to",
            "want",
            "with",
          ]);
          const terms =
            cleanQuery
              .toLocaleLowerCase()
              .match(/[a-z0-9+#]+/g)
              ?.filter((term) => !ignoredTerms.has(term)) || [];
          const matches = mapSearchResults(source)
            .map((item) => {
              const searchable = [
                item.title,
                item.description,
                item.category,
                item.level,
                item.instructor,
                item.currentRole,
                ...(item.outcomes || []),
                ...(item.expertise || []),
              ]
                .join(" ")
                .toLocaleLowerCase();
              const score = terms.reduce(
                (total, term) => total + (searchable.includes(term) ? 1 : 0),
                0,
              );
              return { ...item, score };
            })
            .filter((item) => item.score > 0);
          setItems(matches);
          setSearchMode("keyword");
        }
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setItems([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Semantic search is temporarily unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, type, mode, scope, initialCatalog]);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter((item) => item.type === "course")
            .map((item) => item.category)
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const expertiseOptions = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter((item) => item.type === "mentor")
            .flatMap((item) => item.expertise || []),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (
        expertise !== "all" &&
        item.type === "mentor" &&
        !(item.expertise || []).includes(expertise)
      )
        return false;
      if (
        item.type === "course" &&
        levels.length &&
        !levels.includes(item.level || "")
      )
        return false;
      if (item.type === "course" && price === "free" && (item.price || 0) > 0)
        return false;
      if (item.type === "course" && price === "paid" && (item.price || 0) <= 0)
        return false;
      return true;
    });
    if (sort === "relevance")
      result = [...result].sort((a, b) => b.score - a.score);
    if (sort === "name")
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "price-low")
      result = [...result].sort(
        (a, b) =>
          (a.type === "course" ? a.price || 0 : Number.MAX_SAFE_INTEGER) -
          (b.type === "course" ? b.price || 0 : Number.MAX_SAFE_INTEGER),
      );
    if (sort === "price-high")
      result = [...result].sort(
        (a, b) =>
          (b.type === "course" ? b.price || 0 : -1) -
          (a.type === "course" ? a.price || 0 : -1),
      );
    return result;
  }, [items, category, expertise, levels, price, sort]);

  const clearFilters = useCallback(() => {
    setCategory("all");
    setExpertise("all");
    setLevels([]);
    setPrice("all");
    setSort("relevance");
  }, []);
  const toggleLevel = (level: string) =>
    setLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
  const activeFilters =
    (category !== "all" ? 1 : 0) +
    (expertise !== "all" ? 1 : 0) +
    levels.length +
    (price !== "all" ? 1 : 0);

  const Filters = () => (
    <div className="space-y-6">
      {scope !== "mentor" && (
        <>
          <div>
            <label
              htmlFor="search-category"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Course category
            </label>
            <div className="relative">
              <select
                id="search-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full appearance-none border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-3 text-slate-400"
              />
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Course level
            </h3>
            <div className="space-y-2">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <label
                  key={level}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={levels.includes(level)}
                    onChange={() => toggleLevel(level)}
                    className="accent-indigo-600"
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="search-price"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Course price
            </label>
            <select
              id="search-price"
              value={price}
              onChange={(event) => setPrice(event.target.value as typeof price)}
              className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">Free and paid</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </>
      )}
      {scope !== "course" && (
        <div>
          <label
            htmlFor="search-expertise"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Mentor expertise
          </label>
          <select
            id="search-expertise"
            value={expertise}
            onChange={(event) => setExpertise(event.target.value)}
            className="w-full border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All expertise</option>
            {expertiseOptions.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}
      {activeFilters > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-semibold text-indigo-700 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-indigo-50 text-indigo-700">
              <Sparkles size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                {query
                  ? mode === "keyword"
                    ? "Keyword search"
                    : "Semantic search"
                  : "Explore"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {scope === "course"
                  ? "Explore courses"
                  : scope === "mentor"
                    ? "Approved mentors"
                    : "Search courses and mentors"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {scope === "course"
                  ? "Browse published courses and filter by category, level, and price."
                  : scope === "mentor"
                    ? "Explore approved mentors and filter by their expertise."
                    : "Use the header search bar to search. Refine the matching courses and approved mentors below."}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-indigo-700" />
                <h2 className="font-semibold">Refine results</h2>
              </div>
              <Filters />
            </div>
          </aside>
          <section className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-3 sm:px-4">
              {scope === "all" && (
                <div
                  className="flex flex-wrap items-center gap-2"
                  role="tablist"
                  aria-label="Search result type"
                >
                  {(["all", "course", "mentor"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={type === item}
                      onClick={() => setType(item)}
                      className={`border px-3 py-2 text-sm font-semibold capitalize ${type === item ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {item === "all" ? "All results" : `${item}s`}
                    </button>
                  ))}
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="inline-flex items-center gap-2 border border-slate-200 px-3 py-2 text-sm lg:hidden"
                >
                  <SlidersHorizontal size={15} /> Filters
                  {activeFilters > 0 ? ` (${activeFilters})` : ""}
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="hidden sm:inline">Sort</span>
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as typeof sort)
                    }
                    className="border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"
                  >
                    <option value="relevance">Best match</option>
                    <option value="name">Name</option>
                    {scope !== "mentor" && (
                      <>
                        <option value="price-low">Price: low to high</option>
                        <option value="price-high">Price: high to low</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                {query.trim().length >= 2
                  ? loading
                    ? `Searching ${mode === "keyword" ? "by keyword" : "by meaning"}…`
                    : `${filtered.length} ${filtered.length === 1 ? "result" : "results"} for “${query.trim()}”`
                  : loading
                    ? "Loading catalog…"
                    : `${filtered.length} ${filtered.length === 1 ? "listing" : "listings"}`}
              </span>
              {searchMode && !loading && (
                <span className="inline-flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {mode === "keyword" ? (
                    "Keyword match"
                  ) : (
                    <>
                      <Sparkles size={13} /> Semantic relevance
                    </>
                  )}
                </span>
              )}
            </div>
            {error && (
              <div
                role="alert"
                className="mb-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              >
                {error}
              </div>
            )}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-80 animate-pulse border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <ResultCard item={item} key={`${item.type}-${item.id}`} />
                ))}
              </div>
            ) : !error ? (
              <div className="border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center bg-slate-100 text-slate-500">
                  <Search size={21} />
                </div>
                <h2 className="mt-4 font-semibold text-slate-900">
                  {query.trim().length >= 2
                    ? "No relevant results found"
                    : scope === "course"
                      ? "No published courses yet"
                      : scope === "mentor"
                        ? "No approved mentors yet"
                        : "No catalog results yet"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {query.trim().length >= 2
                    ? "Try describing a skill or learning goal another way."
                    : "Check back soon for new listings."}
                </p>
                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-bold">Refine results</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <Filters />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-7 w-full bg-indigo-700 py-3 text-sm font-semibold text-white"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ResultCard({ item }: { item: SearchItem }) {
  const course = item.type === "course";
  const router = useRouter();
  return (
    <article
      role={course ? undefined : "link"}
      tabIndex={course ? undefined : 0}
      onClick={event => {
        if (course || (event.target as HTMLElement).closest("a, button")) return;
        router.push(`/instructors/${item.id}`);
      }}
      onKeyDown={event => {
        if (!course && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          router.push(`/instructors/${item.id}`);
        }
      }}
      className={`flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-lg ${course ? "" : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"}`}
    >
      <div className="relative aspect-video bg-slate-100">
        <Image
          src={item.image}
          alt={item.title}
          fill
          unoptimized
          sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw"
          className="object-cover"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {course ? <BookOpen size={13} /> : <BriefcaseBusiness size={13} />}{" "}
          {course ? "Course" : "Approved mentor"}
        </span>
        {item.score > 0 && (
          <span className="absolute right-3 top-3 bg-slate-950/75 px-2 py-1 text-[11px] font-semibold text-white">
            {item.score.toFixed(2)} match
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
          {course ? item.category : item.currentRole || item.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-6 text-slate-900">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">
          {item.description}
        </p>
        {course ? (
          <>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {item.level && (
                <span className="border border-slate-200 px-2 py-1">
                  {item.level}
                </span>
              )}
              {item.duration && (
                <span className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1">
                  <Clock3 size={12} />
                  {item.duration}
                </span>
              )}
              {item.lessons ? (
                <span className="border border-slate-200 px-2 py-1">
                  {item.lessons} lessons
                </span>
              ) : null}
            </div>
            {item.outcomes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.outcomes.slice(0, 3).map((value) => (
                  <span
                    key={value}
                    className="bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                  >
                    {value}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {item.instructor}
              {item.experience ? ` · ${item.experience} years experience` : ""}
            </p>
            {item.expertise && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.expertise.slice(0, 4).map((value) => (
                  <span
                    key={value}
                    className="bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                  >
                    {value}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-4">
          {course ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900">
              <CircleDollarSign size={15} className="text-emerald-600" />
              {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "Free"}
            </span>
          ) : (
            <span className="text-xs text-emerald-700">
              Approved instructor
            </span>
          )}
          {course ? (
            <Link
              href={`/course/${item.id}`}
              className="bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
            >
              View course
            </Link>
          ) : (
            <Link
              href={`/instructors/${item.id}`}
              className="bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
            >
              View instructor
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
