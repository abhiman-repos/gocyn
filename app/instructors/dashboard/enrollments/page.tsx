"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Copy,
  RefreshCw,
  User,
  Briefcase,
  Download,
  CheckSquare,
  Calendar,
  Building2,
  Send,
  CheckCircle,
  Search,
  Filter,
  X,
} from "lucide-react";

type Enrollment = {
  id: string;
  student: string;
  email: string;
  course: string;
  course_id: string;
  date: string;
  status: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  amount_paid: string;
  certificateIssued: boolean;
  certificate_id?: string | null;
  certificate_delivery: "automatic" | "manual";
};
const API = process.env.APP_URL;

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "recent" | "older" | "custom"
  >("all");
  // Remove: const [courseFilter, setCourseFilter] = useState("");
  const [courseFilters, setCourseFilters] = useState<Set<string>>(new Set());
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    dir: "asc" | "desc";
  }>({ key: "date", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [loading, setLoading] = useState(true);
  const [certificateBusy, setCertificateBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [customStart, setCustomStart] = useState<string>(""); // datetime-local value
  const [customEnd, setCustomEnd] = useState<string>("");

  useEffect(() => {
    setSelectedCourseId(new URLSearchParams(window.location.search).get("course_id") || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("mentorToken");
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/instructors/courses/enrollments/`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Could not load course enrollments.");
        return data.results || [];
      })
      .then((rows: any[]) => { if (!cancelled) setEnrollments(rows.map(row => ({ ...row, date: row.date, certificateIssued: Boolean(row.certificate_issued), certificate_id: row.certificate_id, certificate_delivery: row.certificate_delivery === "automatic" ? "automatic" : "manual" }))); })
      .catch(error => { if (!cancelled) { console.error("Enrollment load failed:", error); setLoadError(error instanceof Error ? error.message : "Could not load enrollments."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  type StatusFilter = "all" | "recent" | "older" | "custom";

  // Helper: check if a date string is within last 24h
  const isRecent = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  const isWithinCustomRange = (dateStr: string) => {
    if (!customStart || !customEnd) return true; // no range selected yet — don't filter everything out
    const itemTime = new Date(dateStr).getTime();
    const startTime = new Date(customStart).getTime();
    const endTime = new Date(customEnd).getTime();
    return itemTime >= startTime && itemTime <= endTime;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Unique courses for filter
  const courseCounts = useMemo(() => {
    const map = new Map<string, number>();
    enrollments.forEach((e) => map.set(e.course, (map.get(e.course) ?? 0) + 1));
    return map;
  }, [enrollments]);

  const uniqueCourses = useMemo(
    () => [...courseCounts.keys()].sort(),
    [courseCounts],
  );

  const toggleCourseFilter = (course: string) => {
    setCourseFilters((prev) => {
      const next = new Set(prev);
      next.has(course) ? next.delete(course) : next.add(course);
      return next;
    });
  };

  // Filtering + Sorting
  const filteredEnrollments = useMemo(() => {
    let list = enrollments.filter((item) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.student.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.course.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "recent" && isRecent(item.date)) ||
        (statusFilter === "older" && !isRecent(item.date)) ||
        (statusFilter === "custom" && isWithinCustomRange(item.date));

      const matchesCourse =
        (courseFilters.size === 0 || courseFilters.has(item.course)) &&
        (!selectedCourseId || item.course_id === selectedCourseId);

      return matchesSearch && matchesStatus && matchesCourse;
    });

    // Sorting
    return [...list].sort((a, b) => {
      let valA: any, valB: any;
      if (sortConfig.key === "student") {
        valA = a.student.toLowerCase();
        valB = b.student.toLowerCase();
      } else if (sortConfig.key === "course") {
        valA = a.course.toLowerCase();
        valB = b.course.toLowerCase();
      } else {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }
      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    enrollments,
    search,
    statusFilter,
    courseFilters,
    sortConfig,
    customStart,
    customEnd,
    selectedCourseId,
  ]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCourseFilters(new Set());
    setCustomStart("");
    setCustomEnd("");
    setSelectedCourseId("");
    window.history.replaceState({}, "", window.location.pathname);
  };

  // CSV Export
  const exportToCSV = (items: Enrollment[]) => {
    if (items.length === 0) return;
    const headers = [
      "Student",
      "Email",
      "Course",
      "Status",
      "Progress",
      "Enrolled At",
    ];
    const csvRows = items.map((item) => [
      `"${item.student}"`,
      item.email,
      `"${item.course}"`,
      item.status,
      item.progress,
      `"${formatDate(item.date)}"`,
    ]);
    const csvContent = [headers, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enrollments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Bulk selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredEnrollments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredEnrollments.map((e) => e.id)));
    }
  };

  // Certificate sending
  const handleSendCertificate = async (enrollment: Enrollment) => {
    if (enrollment.progress < 100 || enrollment.total_lessons === 0) return;
    const token = localStorage.getItem("mentorToken");
    if (!token) { alert("Please sign in again to issue a certificate."); return; }
    setCertificateBusy(enrollment.id);
    try {
      const response = await fetch(`${API}/api/instructors/courses/enrollments/${enrollment.id}/certificate/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not issue the certificate.");
      setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, certificateIssued: true, certificate_id: data.certificate_id } : e));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not issue the certificate.");
    } finally { setCertificateBusy(null); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Export Button */}
          <button
            onClick={() => exportToCSV(filteredEnrollments)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white transition"
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            Export
          </button>

          {/* Table / Cards Toggle */}
          <div className="flex border overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 sm:px-5 py-2.5 text-sm font-medium transition ${
                viewMode === "table"
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Table
            </button>

            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 sm:px-5 py-2.5 text-sm font-medium transition ${
                viewMode === "cards"
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {selectedCourseId && <div className="mb-4 flex items-center justify-between border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"><span>Showing students enrolled in {enrollments.find(item => item.course_id === selectedCourseId)?.course || "selected course"}</span><button type="button" onClick={clearFilters} className="font-semibold underline">Show all courses</button></div>}
      <div className="flex flex-wrap gap-4 mb-6 items-end ">
        <div className="flex-1 min-w-[260px]">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email or course..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={clearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={30} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col-3 sm:flex-row gap-4 sm:items-end">
          {/* Enrolled Date Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Enrolled Date
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All time</option>
              <option value="recent">Recent (last 24h)</option>
              <option value="older">Older</option>
              <option value="custom">Custom range</option>
            </select>

            {statusFilter === "custom" && (
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    From
                  </label>
                  <input
                    type="datetime-local"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd || undefined}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    To
                  </label>
                  <input
                    type="datetime-local"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart || undefined}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Course Filter */}
          {/* Course Filter */}
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Courses
            </label>
            <button
              type="button"
              onClick={() => setCourseDropdownOpen((o) => !o)}
              className="w-full px-4 py-3 border border-gray-300 bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="truncate">
                {courseFilters.size === 0
                  ? "All Courses"
                  : `${courseFilters.size} course${courseFilters.size > 1 ? "s" : ""} selected`}
              </span>
            </button>


            {courseDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
                {uniqueCourses.map((c) => (
                  <label
                    key={c}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={courseFilters.has(c)}
                        onChange={() => toggleCourseFilter(c)}
                        className="w-4 h-4 accent-blue-600 flex-shrink-0"
                      />
                      <span className="truncate">{c}</span>
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {courseCounts.get(c)}
                    </span>
                  </label>
                ))}
                {courseFilters.size > 0 && (
                  <button
                    onClick={() => setCourseFilters(new Set())}
                    className="w-full text-center text-xs text-red-600 py-2 border-t hover:bg-red-50"
                  >
                    Clear courses
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200  p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{selected.size} selected</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                exportToCSV(
                  filteredEnrollments.filter((e) => selected.has(e.id)),
                )
              }
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white  hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading / Empty */}
      {loading && (
        <div className="text-center py-20 text-gray-500">
          Loading enrollments...
        </div>
      )}
      {!loading && filteredEnrollments.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          {loadError || "No enrollments found"}
        </div>
      )}

      {/* Card View */}
      {!loading && viewMode === "cards" && filteredEnrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enr) => (
            <div
              key={enr.id}
              className="bg-white border border-gray-200 p-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-100 group relative"
            >
              <div className="absolute top-5 right-5">
                {isRecent(enr.date) ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1  text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500  animate-pulse"></span>
                    RECENT
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 px-3 py-1  text-xs font-semibold">
                    OLDER
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600  flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/instructors/dashboard/enrollments/${enr.id}`} className="block font-semibold text-lg text-gray-900 underline decoration-transparent hover:text-blue-700 hover:decoration-current truncate">
                    {enr.student}
                  </Link>
                  <p className="text-gray-500 text-sm truncate">{enr.email}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100  flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{enr.course}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span
                        className={`inline-flex  px-2 py-0.5 text-xs font-medium ${getStatusBadge(enr.status)}`}
                      >
                        {enr.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Course progress · {enr.completed_lessons}/{enr.total_lessons} lessons</span>
                    <span>{enr.progress}%</span>
                  </div>
                  <div className="w-full  bg-gray-200 h-2">
                    <div
                      className={`h-2  ${enr.progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                      style={{ width: `${enr.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                Enrolled on {formatDate(enr.date)}
              </div>
              <p className="mt-2 text-xs text-gray-500">Paid: {Number(enr.amount_paid) > 0 ? `₹${Number(enr.amount_paid).toLocaleString("en-IN")}` : "Free"}</p>

              <div className="mt-8 flex gap-3">
                {enr.certificateIssued ? (
                  <span className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 py-3  text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Sent to learner
                  </span>
                ) : enr.certificate_delivery === "automatic" ? (
                  <span className="flex-1 flex items-center justify-center border border-blue-200 bg-blue-50 px-3 py-3 text-center text-sm font-medium text-blue-800">
                    {enr.progress === 100 ? "Certificate emailed automatically on completion" : "Certificate emails automatically when course is complete"}
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendCertificate(enr)}
                    disabled={enr.progress < 100 || enr.total_lessons === 0 || certificateBusy === enr.id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" /> {certificateBusy === enr.id ? "Sending…" : enr.progress < 100 ? "Complete course to send" : "Send certificate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === "table" && filteredEnrollments.length > 0 && (
        <div className="bg-white  shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-500">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === filteredEnrollments.length &&
                      filteredEnrollments.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-blue-600"
                  />
                </th>
                <th
                  onClick={() => handleSort("student")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Student
                </th>
                <th className="px-6 py-4 text-left">Email</th>
                <th
                  onClick={() => handleSort("course")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Course
                </th>
                <th className="px-6 py-4 text-left">Progress / lessons</th>
                <th className="px-6 py-4 text-left">Paid</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th
                  onClick={() => handleSort("date")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Enrolled At
                </th>
                <th className="px-6 py-4 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEnrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(enr.id)}
                      onChange={() => toggleSelect(enr.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium"><Link href={`/instructors/dashboard/enrollments/${enr.id}`} className="text-blue-700 underline hover:text-blue-900">{enr.student}</Link></td>
                  <td className="px-6 py-4 text-gray-600">{enr.email}</td>
                  <td className="px-6 py-4">{enr.course}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20  bg-gray-200 h-2">
                        <div
                          className={`h-2  ${enr.progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${enr.progress}%` }}
                        />
                      </div>
                      <span className="text-xs">{enr.progress}% · {enr.completed_lessons}/{enr.total_lessons}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{Number(enr.amount_paid) > 0 ? `₹${Number(enr.amount_paid).toLocaleString("en-IN")}` : "Free"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex  px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(enr.status)}`}
                    >
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(enr.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!enr.certificateIssued && enr.certificate_delivery === "manual" && (
                        <button
                          onClick={() => handleSendCertificate(enr)}
                          disabled={enr.progress < 100 || enr.total_lessons === 0 || certificateBusy === enr.id}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                          title={enr.progress < 100 ? "Student must complete the course first" : "Issue certificate"}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
