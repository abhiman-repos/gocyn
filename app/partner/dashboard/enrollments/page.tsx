"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Copy,
  RefreshCw,
  User,
  Briefcase,
  Download,
  Trash2,
  CheckSquare,
  Calendar,
  Building2,
  AlertTriangle,
  Send,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";

// --- MOCK DATA (extended with certificate_issued & proper IDs) ---
const mockEnrollments = [
  {
    id: "enr_001",
    student: "Sarah Jenkins",
    email: "sarah.j@example.com",
    course: "Advanced React Patterns",
    date: "Oct 25, 2026",
    status: "Active",
    progress: 65,
    certificateIssued: false,
  },
  {
    id: "enr_002",
    student: "Marcus Johnson",
    email: "marcus.dev@example.com",
    course: "System Design Interview",
    date: "Oct 24, 2026",
    status: "Active",
    progress: 32,
    certificateIssued: false,
  },
  {
    id: "enr_003",
    student: "Elena Rodriguez",
    email: "elena.r@example.com",
    course: "Full-Stack Next.js",
    date: "Oct 15, 2026",
    status: "Completed",
    progress: 100,
    certificateIssued: true,
  },
  {
    id: "enr_004",
    student: "David Chen",
    email: "d.chen99@example.com",
    course: "Advanced React Patterns",
    date: "Oct 10, 2026",
    status: "At Risk",
    progress: 12,
    certificateIssued: false,
  },
  {
    id: "enr_005",
    student: "Priya Sharma",
    email: "priya.s@example.com",
    course: "System Design Interview",
    date: "Sep 28, 2026",
    status: "Completed",
    progress: 100,
    certificateIssued: true,
  },
];
// ----------------------------------------------------------------

type Enrollment = (typeof mockEnrollments)[0];

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "recent" | "older">(
    "all"
  );
  const [courseFilter, setCourseFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    dir: "asc" | "desc";
  }>({ key: "date", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper: check if a date string is within last 24h
  const isRecent = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Unique courses for filter
  const uniqueCourses = useMemo(
    () => [...new Set(enrollments.map((e) => e.course))].sort(),
    [enrollments]
  );

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
        (statusFilter === "older" && !isRecent(item.date));

      const matchesCourse = !courseFilter || item.course === courseFilter;

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
  }, [enrollments, search, statusFilter, courseFilter, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("");
  };

  // CSV Export
  const exportToCSV = (items: Enrollment[]) => {
    if (items.length === 0) return;
    const headers = ["Student", "Email", "Course", "Status", "Progress", "Enrolled At"];
    const csvRows = items.map((item) => [
      `"${item.student}"`,
      item.email,
      `"${item.course}"`,
      item.status,
      item.progress,
      `"${formatDate(item.date)}"`,
    ]);
    const csvContent = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
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
  const handleSendCertificate = (enrollment: Enrollment) => {
    // Optimistic update
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === enrollment.id ? { ...e, certificateIssued: true } : e
      )
    );
    // In a real app, you'd call an API here
    alert(`Certificate sent to ${enrollment.student} (mock)`);
  };

  // Delete handlers
  const openDeleteDialog = (enrollment: Enrollment) => {
    setEnrollmentToDelete(enrollment);
    setShowDeleteDialog(true);
  };

  const handleRemove = () => {
    if (!enrollmentToDelete) return;
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setEnrollments((prev) =>
        prev.filter((e) => e.id !== enrollmentToDelete.id)
      );
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentToDelete.id);
        return next;
      });
      setShowDeleteDialog(false);
      setEnrollmentToDelete(null);
      setIsDeleting(false);
    }, 500);
  };

  // Refresh (mock)
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setEnrollments(mockEnrollments);
      setLoading(false);
    }, 500);
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
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-600 mt-1">
            {filteredEnrollments.length} application
            {filteredEnrollments.length !== 1 ? "s" : ""} • Manage student enrollments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => exportToCSV(filteredEnrollments)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            Export All CSV
          </button>

          <div className="flex border rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("table")}
              className={`px-5 py-2.5 text-sm font-medium transition ${
                viewMode === "table" ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-5 py-2.5 text-sm font-medium transition ${
                viewMode === "cards" ? "bg-gray-900 text-white" : "hover:bg-gray-100"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex-1 min-w-[260px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or course..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Enrolled Date
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All time</option>
            <option value="recent">Recent (last 24h)</option>
            <option value="older">Older</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Course
          </label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <Filter size={16} /> Clear Filters
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{selected.size} selected</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                exportToCSV(
                  filteredEnrollments.filter((e) => selected.has(e.id))
                )
              }
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading / Empty */}
      {loading && <div className="text-center py-20 text-gray-500">Loading enrollments...</div>}
      {!loading && filteredEnrollments.length === 0 && (
        <div className="text-center py-20 text-gray-400">No enrollments found</div>
      )}

      {/* Card View */}
      {!loading && viewMode === "cards" && filteredEnrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enr) => (
            <div
              key={enr.id}
              className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative"
            >
              <div className="absolute top-5 right-5">
                {isRecent(enr.date) ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    RECENT
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold">
                    OLDER
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {enr.student}
                  </h3>
                  <p className="text-gray-500 text-sm truncate">{enr.email}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{enr.course}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(enr.status)}`}>
                        {enr.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{enr.progress}%</span>
                  </div>
                  <div className="w-full rounded-full bg-gray-200 h-2">
                    <div
                      className={`h-2 rounded-full ${enr.progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                      style={{ width: `${enr.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                Enrolled on {formatDate(enr.date)}
              </div>

              <div className="mt-8 flex gap-3">
                {enr.certificateIssued ? (
                  <span className="flex-1 flex items-center justify-center gap-2 bg-green-100 text-green-700 py-3 rounded-2xl text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Issued
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendCertificate(enr)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-medium"
                  >
                    <Send className="w-4 h-4" /> Send Certificate
                  </button>
                )}
                <button
                  onClick={() => openDeleteDialog(enr)}
                  className="flex items-center justify-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === "table" && filteredEnrollments.length > 0 && (
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === filteredEnrollments.length && filteredEnrollments.length > 0
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
                <th className="px-6 py-4 text-left">Progress</th>
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
                  <td className="px-6 py-4 font-medium">{enr.student}</td>
                  <td className="px-6 py-4 text-gray-600">{enr.email}</td>
                  <td className="px-6 py-4">{enr.course}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 rounded-full bg-gray-200 h-2">
                        <div
                          className={`h-2 rounded-full ${enr.progress === 100 ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${enr.progress}%` }}
                        />
                      </div>
                      <span className="text-xs">{enr.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(enr.status)}`}>
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(enr.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!enr.certificateIssued && (
                        <button
                          onClick={() => handleSendCertificate(enr)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Send Certificate"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteDialog(enr)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && enrollmentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-3xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Remove Enrollment?
                  </h3>
                  <p className="text-gray-600 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-sm text-gray-600">Student:</p>
                <p className="font-semibold">{enrollmentToDelete.student}</p>
                <p className="text-xs text-gray-500 mt-3">Course:</p>
                <p className="font-medium">{enrollmentToDelete.course}</p>
              </div>
            </div>

            <div className="border-t px-8 py-6 flex gap-3 bg-gray-50 rounded-b-3xl">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setEnrollmentToDelete(null);
                }}
                className="flex-1 py-4 text-gray-700 font-medium border border-gray-300 rounded-2xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white font-medium rounded-2xl hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center gap-2"
              >
                {isDeleting ? "Removing..." : "Yes, Remove Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}