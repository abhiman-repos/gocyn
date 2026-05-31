"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

interface User {
  id: string;
  name: string;
  email: string;
}

interface Internship {
  id: string;
  title: string;
  company: string;
}

interface Enrollment {
  _id: string;
  created_at: string;
  user: User;
  internship: Internship;
  certificate_issued: boolean;
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "recent" | "older">(
    "all",
  );
  const [companyFilter, setCompanyFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    dir: "asc" | "desc";
  }>({
    key: "created_at",
    dir: "desc",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] =
    useState<Enrollment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Enrollments
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/upload/enrollments/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = json.enrollments || json.data || json || [];
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load enrollments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendCertificate = async (enr: Enrollment) => {
    try {
      // 🔥 Optimistic UI (instant disable)
      setEnrollments((prev) =>
        prev.map((e) =>
          e._id === enr._id ? { ...e, certificate_issued: true } : e,
        ),
      );

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/upload/send-certificate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: enr.user.id,
          internship_id: enr.internship.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Handlers
  const openDeleteDialog = (enrollment: Enrollment) => {
    setEnrollmentToDelete(enrollment);
    setShowDeleteDialog(true);
  };

  const handleRemove = async () => {
    if (!enrollmentToDelete) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/upload/remove-enrollment/${enrollmentToDelete._id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove enrollment");
      }

      setEnrollments((prev) =>
        prev.filter((e) => e._id !== enrollmentToDelete._id),
      );

      setShowDeleteDialog(false);
      setEnrollmentToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to remove enrollment");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper Functions
  const uniqueCompanies = useMemo(() => {
    return [
      ...new Set(
        enrollments
          .map((e) => e.internship?.company) // ✅ safe
          .filter(Boolean), // ✅ remove null/undefined
      ),
    ].sort();
  }, [enrollments]);

  const getUniqueKey = (enr: Enrollment) => enr._id;

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

  // Filtered & Sorted Data
  const filteredEnrollments = useMemo(() => {
    let list = enrollments.filter((item) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.user.name.toLowerCase().includes(term) ||
        item.user.email.toLowerCase().includes(term) ||
        item.internship.title.toLowerCase().includes(term) ||
        item.internship.company.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "recent" && isRecent(item.created_at)) ||
        (statusFilter === "older" && !isRecent(item.created_at));

      const matchesCompany =
        !companyFilter || item.internship.company === companyFilter;

      return matchesSearch && matchesStatus && matchesCompany;
    });

    return [...list].sort((a, b) => {
      let valA: any, valB: any;
      if (sortConfig.key === "user.name") {
        valA = a.user.name.toLowerCase();
        valB = b.user.name.toLowerCase();
      } else if (sortConfig.key === "internship.title") {
        valA = a.internship.title.toLowerCase();
        valB = b.internship.title.toLowerCase();
      } else {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      }

      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [enrollments, search, statusFilter, companyFilter, sortConfig]);

  const exportToCSV = (items: Enrollment[]) => {
    if (items.length === 0) return;
    const headers = ["Name", "Email", "Internship", "Company", "Enrolled At"];
    const csvRows = items.map((item) => [
      `"${item.user.name}"`,
      item.user.email,
      `"${item.internship.title}"`,
      `"${item.internship.company}"`,
      `"${formatDate(item.created_at)}"`,
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

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredEnrollments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredEnrollments.map(getUniqueKey)));
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCompanyFilter("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-black-600 mt-1 ">
            {" "}
            Manage internship applications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 bg-white  hover:bg-gray-100 transition disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => exportToCSV(filteredEnrollments)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-green-700 text-white  transition"
          >
            <Download className="w-6 h-6" />
            Export
          </button>

          <div className="flex border  overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("table")}
              className={`px-5 py-2 text-sm font-medium transition ${viewMode === "table" ? "bg-green-900 text-white" : "hover:bg-green-100"}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-5 py-2.5 text-sm font-medium transition ${viewMode === "cards" ? "bg-red-900 text-white" : "hover:bg-red-100"}`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex gap-3 items-center">
          <div className="flex-1 min-w-[360px] relative">
            <input
              type="text"
              placeholder="Search by name, email, title ..."
              className="w-full px-5 py-3 border  focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Optional: clear icon inside input when search is not empty */}
            {search && (
              <button
                onClick={clearFilters}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-black-400 hover:text-red-900"
              >
                ✕
              </button>
            )}
          </div>
        {/* <button
          onClick={clearFilters}
          className="px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2 border rounded-lg"
        >
          Clear
        </button> */}
        </div>

        <div>
          <label className="block text-xs font-medium text-black-500 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="recent">Recent (24h)</option>
            <option value="older">Older</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-black-500 mb-1">
            Company
          </label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>{selected.size} selected</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                exportToCSV(
                  filteredEnrollments.filter((e) =>
                    selected.has(getUniqueKey(e)),
                  ),
                )
              }
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700"
            >
              <Download className="w-4 h-4" /> Export Selected
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          {error}{" "}
          <button onClick={fetchData} className="underline ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Card View */}
      {viewMode === "cards" && !loading && filteredEnrollments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnrollments.map((enr) => {
            const recent = isRecent(enr.created_at);
            return (
              <div
                key={enr._id}
                className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative"
              >
                <div className="absolute top-5 right-5">
                  {recent ? (
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
                      {enr.user?.name}
                    </h3>
                    <p className="text-gray-500 text-sm truncate">
                      {enr.user?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {enr.internship?.title}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Building2 className="w-4 h-4" />{" "}
                        {enr.internship?.company}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Enrolled on {formatDate(enr.created_at)}
                </div>
                <div className="mt-8 flex gap-3">
                  {enr.certificate_issued ? (
                    <span className="flex-1 flex items-center justify-center bg-green-100 text-green-700 py-3 rounded-2xl text-sm font-medium">
                      Issued <CheckCircle className="w-4 h-4 text-green-600" />
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
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white  overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-400">
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
                  onClick={() => handleSort("user.name")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Applicant
                </th>
                <th className="px-6 py-4 text-left">Email</th>
                <th
                  onClick={() => handleSort("internship.title")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Internship
                </th>
                <th className="px-6 py-4 text-left">Company</th>
                <th
                  onClick={() => handleSort("created_at")}
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                >
                  Enrolled At
                </th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEnrollments.map((enr) => (
                <tr key={enr._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(enr._id)}
                      onChange={() => toggleSelect(enr._id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">{enr.user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{enr.user.email}</td>
                  <td className="px-6 py-4">{enr.internship.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {enr.internship.company}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(enr.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {isRecent(enr.created_at) ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Recent
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">
                        Older
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openDeleteDialog(enr)}
                        className=" px-3 py-1  hover:text-red-600"
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
                  <AlertTriangle />
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
                <p className="font-semibold">{enrollmentToDelete.user?.name}</p>
                <p className="text-xs text-gray-500 mt-3">Internship:</p>
                <p className="font-medium">
                  {enrollmentToDelete.internship?.title}
                </p>
                <p className="text-sm text-gray-500">
                  {enrollmentToDelete.internship?.company}
                </p>
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

      {/* Loading & Empty States */}
      {loading && (
        <div className="text-center py-20 text-gray-500">
          Loading enrollments...
        </div>
      )}
      {!loading && filteredEnrollments.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No enrollments found
        </div>
      )}
    </div>
  );
}
