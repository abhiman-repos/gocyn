"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import {
  MdDelete,
  MdVerified,
  MdEmail,
  MdCalendarToday,
  MdAssignment,
  MdDownload,
  MdSearch,
  MdClose,
  MdWarning,
  MdRefresh,
  MdFilterList,
  MdGridOn,
  MdTableRows,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from "react-icons/md";
import { HiDocument } from "react-icons/hi";

const API = process.env.NEXT_PUBLIC_APP_URL;

interface Certificate {
  certificate_id: string;
  user_name: string;
  user_email: string;
  internship_title: string;
  issued_at: string;
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "recent" | "older">("all");
  const [internshipFilter, setInternshipFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Certificate; dir: "asc" | "desc" }>({
    key: "issued_at",
    dir: "desc",
  });
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch certificates
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/auth/certificates/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      const data = await res.json();
      setCertificates(data.certificates || data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Derived unique internships for filter dropdown
  const uniqueInternships = useMemo(
    () => [...new Set(certificates.map((c) => c.internship_title))].sort(),
    [certificates]
  );

  // Helper: check if date is within last 7 days (recent)
  const isRecent = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  // Filtering & sorting
  const filteredCertificates = useMemo(() => {
    let filtered = certificates.filter((cert) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        cert.user_name.toLowerCase().includes(term) ||
        cert.user_email.toLowerCase().includes(term) ||
        cert.internship_title.toLowerCase().includes(term);

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "recent" && isRecent(cert.issued_at)) ||
        (dateFilter === "older" && !isRecent(cert.issued_at));

      const matchesInternship = !internshipFilter || cert.internship_title === internshipFilter;

      return matchesSearch && matchesDate && matchesInternship;
    });

    // Sort
    filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];
      if (sortConfig.key === "issued_at") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortConfig.dir === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [certificates, searchTerm, dateFilter, internshipFilter, sortConfig]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setInternshipFilter("");
  };

  // CSV Export (all or selected)
  const exportToCSV = useCallback(
    (items: Certificate[], filename?: string) => {
      if (items.length === 0) {
        toast.error("No certificates to export");
        return;
      }
      const headers = [
        "Certificate ID",
        "Recipient Name",
        "Email",
        "Internship Title",
        "Issued At",
      ];
      const rows = items.map((cert) => [
        cert.certificate_id,
        `"${cert.user_name}"`,
        cert.user_email,
        `"${cert.internship_title}"`,
        `"${new Date(cert.issued_at).toLocaleDateString("en-IN")}"`,
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `certificates_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    },
    []
  );

  // Bulk selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredCertificates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCertificates.map((c) => c.certificate_id)));
    }
  };

  // Delete modal handlers
  const openDeleteModal = (id: string, name: string) => {
    setCertToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!certToDelete) return;
    const { id, name } = certToDelete;

    setDeletingId(id);
    setShowDeleteModal(false);

    const toastId = toast.loading("Deleting certificate...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/auth/certificates/delete/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Delete failed");

      setCertificates((prev) => prev.filter((c) => c.certificate_id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(`Certificate for ${name} has been deleted`, { id: toastId });
    } catch (err) {
      toast.error("Failed to delete certificate", { id: toastId });
      console.error(err);
    } finally {
      setDeletingId(null);
      setCertToDelete(null);
    }
  };

  // Sorting handler
  const handleSort = (key: keyof Certificate) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  // Render helpers
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Certificates Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage and monitor all issued certificates
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCertificates}
              disabled={loading}
              className="group flex items-center gap-2 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-5 py-2.5 rounded-xl font-medium transition-all"
            >
              <MdRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={() => exportToCSV(filteredCertificates)}
              className="group flex items-center gap-3 bg-white border border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 px-6 py-2.5 rounded-2xl font-medium transition-all"
            >
              <MdDownload size={18} />
              Export All CSV
            </button>

            <div className="flex border rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setViewMode("table")}
                className={`px-5 py-2.5 text-sm font-medium transition flex items-center gap-1 ${
                  viewMode === "table"
                    ? "bg-gray-900 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <MdTableRows size={16} /> Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-5 py-2.5 text-sm font-medium transition flex items-center gap-1 ${
                  viewMode === "cards"
                    ? "bg-gray-900 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <MdGridOn size={16} /> Cards
              </button>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email or internship..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Issue Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All time</option>
              <option value="recent">Last 7 days</option>
              <option value="older">Older</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Internship</label>
            <select
              value={internshipFilter}
              onChange={(e) => setInternshipFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Internships</option>
              {uniqueInternships.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <MdFilterList /> Clear Filters
          </button>
        </div>

        {/* Stats and bulk actions bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="bg-white rounded-2xl px-5 py-3 border shadow-sm flex items-center gap-2 text-sm text-gray-600">
            <MdVerified className="text-indigo-500" />
            <span>
              Total: <strong>{certificates.length}</strong>
            </span>
            {searchTerm || dateFilter !== "all" || internshipFilter ? (
              <span className="text-gray-400">(showing {filteredCertificates.length})</span>
            ) : null}
          </div>

          {selected.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selected.size} selected
              </span>
              <button
                onClick={() => exportToCSV(filteredCertificates.filter((c) => selected.has(c.certificate_id)))}
                className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-xl hover:bg-green-700"
              >
                <MdDownload size={14} /> Export Selected
              </button>
              <button
                onClick={() => {
                  const first = filteredCertificates.find((c) => selected.has(c.certificate_id));
                  if (first) openDeleteModal(first.certificate_id, first.user_name);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && certificates.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 px-6 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <HiDocument className="w-14 h-14 text-gray-300" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">
              No certificates found
            </h3>
            <p className="text-gray-500">
              Certificates will appear here once they are issued.
            </p>
          </div>
        )}

        {/* CARD VIEW */}
        {!loading && viewMode === "cards" && filteredCertificates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((cert) => (
              <motion.div
                key={cert.certificate_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col relative"
              >
                {/* Selection checkbox (cards) */}
                <div className="absolute top-4 left-4">
                  <button
                    onClick={() => toggleSelect(cert.certificate_id)}
                    className="text-gray-400 hover:text-indigo-500"
                  >
                    {selected.has(cert.certificate_id) ? (
                      <MdCheckBox size={20} className="text-indigo-600" />
                    ) : (
                      <MdCheckBoxOutlineBlank size={20} />
                    )}
                  </button>
                </div>

                <div className="flex justify-end items-start mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <MdVerified /> VERIFIED
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 leading-tight mb-4 line-clamp-2 pr-6">
                  {cert.internship_title}
                </h2>
                <div className="space-y-3 text-sm flex-1">
                  <div className="flex items-start gap-3">
                    <MdAssignment className="text-indigo-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-gray-500 text-xs">Recipient</p>
                      <p className="font-medium text-gray-800">{cert.user_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdEmail className="text-indigo-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="font-medium text-gray-700 break-all">{cert.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCalendarToday className="text-indigo-500 mt-0.5 shrink-0" size={20} />
                    <div>
                      <p className="text-gray-500 text-xs">Issued On</p>
                      <p className="font-medium">{formatDate(cert.issued_at)}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openDeleteModal(cert.certificate_id, cert.user_name)}
                  disabled={deletingId === cert.certificate_id}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 py-3 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
                >
                  <MdDelete size={18} />
                  {deletingId === cert.certificate_id ? "Deleting..." : "Delete Certificate"}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && viewMode === "table" && filteredCertificates.length > 0 && (
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <button onClick={toggleSelectAll} className="text-gray-500 hover:text-indigo-600">
                        {selected.size === filteredCertificates.length ? (
                          <MdCheckBox size={18} className="text-indigo-600" />
                        ) : (
                          <MdCheckBoxOutlineBlank size={18} />
                        )}
                      </button>
                    </th>
                    <th
                      onClick={() => handleSort("user_name")}
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                    >
                      Recipient
                    </th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th
                      onClick={() => handleSort("internship_title")}
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                    >
                      Internship
                    </th>
                    <th
                      onClick={() => handleSort("issued_at")}
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100"
                    >
                      Issued On
                    </th>
                    <th className="px-6 py-4 text-left">Certificate ID</th>
                    <th className="px-6 py-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.certificate_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(cert.certificate_id)}>
                          {selected.has(cert.certificate_id) ? (
                            <MdCheckBox className="text-indigo-600" size={18} />
                          ) : (
                            <MdCheckBoxOutlineBlank size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium">{cert.user_name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{cert.user_email}</td>
                      <td className="px-6 py-4">{cert.internship_title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(cert.issued_at)}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {cert.certificate_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDeleteModal(cert.certificate_id, cert.user_name)}
                          className="text-red-600 hover:text-red-800"
                          disabled={deletingId === cert.certificate_id}
                        >
                          <MdDelete size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (same as original, with motion) */}
      <AnimatePresence>
        {showDeleteModal && certToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                  <MdWarning size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Delete Certificate</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-700">You are about to permanently delete the certificate for:</p>
                  <p className="font-semibold text-red-900 mt-1">{certToDelete.name}</p>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex gap-3 bg-gray-50">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 text-gray-700 font-medium border border-gray-300 rounded-2xl hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingId === certToDelete.id}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-2xl hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center gap-2 transition"
                >
                  {deletingId === certToDelete.id ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}