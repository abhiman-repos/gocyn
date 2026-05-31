"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "react-icons/md";
import { HiDocument } from "react-icons/hi";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/auth/certificates/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      const data = await res.json();
      setCerts(data.certificates || data || []);
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

  // Filtered data based on search
  const filteredCerts = certs.filter((cert) => {
    const term = searchTerm.toLowerCase();
    return (
      cert.user_name?.toLowerCase().includes(term) ||
      cert.user_email?.toLowerCase().includes(term) ||
      cert.internship_title?.toLowerCase().includes(term)
    );
  });

  // Open custom delete modal
  const openDeleteModal = (id: string, userName: string) => {
    setCertToDelete({ id, name: userName });
    setShowDeleteModal(true);
  };

  // Confirm deletion
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

      setCerts((prev) => prev.filter((c) => c.certificate_id !== id));
      toast.success(`Certificate for ${name} has been deleted`, {
        id: toastId,
        duration: 4000,
      });
    } catch (err) {
      toast.error("Failed to delete certificate", { id: toastId });
      console.error(err);
    } finally {
      setDeletingId(null);
      setCertToDelete(null);
    }
  };

  // Client‑side CSV export
  const handleExportCSV = useCallback(() => {
    if (certs.length === 0) {
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
    const rows = certs.map((cert) => [
      cert.certificate_id,
      `"${cert.user_name}"`,
      cert.user_email,
      `"${cert.internship_title}"`,
      `"${new Date(cert.issued_at).toLocaleDateString("en-IN")}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `certificates_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  }, [certs]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Certificates Management
            </h1>
            <p className="text-black-500 mt-.1">
              Manage and monitor all issued certificates
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="group flex items-center gap-3 bg-white 
             text-gray-700 hover:text-red-700 
             px-6 py-2 font-medium transition-all duration-200 
            "
          >
            <div className="w-8 h-8 flex items-center justify-center  transition-colors">
              <MdDownload size={24} className="text-black-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Export</p>
            </div>
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MdSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email or internship..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 bg-gray-200 animate-pulse rounded-3xl"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && certs.length === 0 && (
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

        {/* Certificates Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => (
              <motion.div
                key={cert.certificate_id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-5">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <MdVerified /> VERIFIED
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {cert.certificate_id}
                  </span>
                </div>

                {/* Internship Title */}
                <h2 className="text-lg font-semibold text-gray-900 leading-tight mb-4 line-clamp-2">
                  {cert.internship_title}
                </h2>

                {/* Details */}
                <div className="space-y-3 text-sm flex-1">
                  <div className="flex items-start gap-3">
                    <MdAssignment
                      className="text-indigo-500 mt-0.5 shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="text-gray-500 text-xs">Recipient</p>
                      <p className="font-medium text-gray-800">
                        {cert.user_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MdEmail
                      className="text-indigo-500 mt-0.5 shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="font-medium text-gray-700 break-all">
                        {cert.user_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MdCalendarToday
                      className="text-indigo-500 mt-0.5 shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="text-gray-500 text-xs">Issued On</p>
                      <p className="font-medium">
                        {new Date(cert.issued_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() =>
                    openDeleteModal(cert.certificate_id, cert.user_name)
                  }
                  disabled={deletingId === cert.certificate_id}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 py-3 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
                >
                  <MdDelete size={18} />
                  {deletingId === cert.certificate_id
                    ? "Deleting..."
                    : "Delete Certificate"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
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
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                  <MdWarning size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Delete Certificate
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-700">
                    You are about to permanently delete the certificate for:
                  </p>
                  <p className="font-semibold text-red-900 mt-1">
                    {certToDelete.name}
                  </p>
                </div>
              </div>

              {/* Actions */}
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
                  {deletingId === certToDelete.id
                    ? "Deleting..."
                    : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
