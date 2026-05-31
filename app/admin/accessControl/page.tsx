"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { 
  Plus, RefreshCw, Search, Copy, Trash2, 
  Shield, Clock, UserCheck, UserX, AlertTriangle 
} from "lucide-react";

interface Admin {
  _id: string;
  email: string;
  expires_at: string;
  last_login?: string;
  created_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL;

export default function AdminAccessControl() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string } | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/auth/admins/`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch admins");
      }
      const data: Admin[] = await res.json();
      setAdmins(data);
    } catch (error: any) {
      console.error("Fetch admins error:", error);
      toast.error(error.message || "Failed to load admin list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    if (!expiry) return toast.error("Expiry date is required");
    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      return toast.error("Expiry must be in the future");
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/add-admin/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          expires_at: expiry,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already exists")) {
          toast.error("This email is already registered as an admin", { duration: 5000 });
        } else {
          throw new Error(data.error || "Failed to add admin");
        }
        return;
      }
      toast.success("Admin added successfully", { icon: "✅" });
      setEmail("");
      setExpiry("");
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Failed to add admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, email: string) => {
    setAdminToDelete({ id, email });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;
    setDeletingId(adminToDelete.id);
    setShowDeleteDialog(false);
    try {
      const res = await fetch(`${API_BASE}/auth/delete-admin/${adminToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to revoke access");
      }
      toast.success(`Access revoked for ${adminToDelete.email}`, { icon: "✅" });
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke admin access");
    } finally {
      setDeletingId(null);
      setAdminToDelete(null);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch = admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      const expired = isExpired(admin.expires_at);
      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "active" && !expired) ||
        (statusFilter === "expired" && expired);
      return matchesSearch && matchesFilter;
    });
  }, [admins, searchTerm, statusFilter]);

  const activeCount = admins.filter((a) => !isExpired(a.expires_at)).length;
  const expiredCount = admins.length - activeCount;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            
            Admin Access Control
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Securely manage temporary and permanent admin privileges
          </p>
        </div>
        <button
          onClick={fetchAdmins}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 bg-white  hover:bg-gray-100 transition disabled:opacity-50 text-sm sm:text-base"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white  p-4 sm:p-6 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12  flex items-center justify-center">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-black-500">Total Admins</p>
            <p className="text-2xl sm:text-4xl font-bold text-gray-900">{admins.length}</p>
          </div>
        </div>

        <div className="bg-white   p-4 sm:p-6 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
            <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-2xl sm:text-4xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white  p-4 sm:p-6 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12  flex items-center justify-center">
            <UserX className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Expired</p>
            <p className="text-2xl sm:text-4xl font-bold text-red-600">{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Add Admin Form */}
      <div className="bg-white  p-4 sm:p-8 mb-8 sm:mb-10 ">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
          Grant New Admin Access
        </h2>

        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-end">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border  px-4 py-2 sm:px-5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Expires At</label>
            <input
              type="datetime-local"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full border  px-4 py-2 sm:px-5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !expiry}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 sm:py-2  transition text-sm sm:text-base"
            >
              {isSubmitting ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white  overflow-hidden">
        {/* Table Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50">
          <div className="flex item-center gap-3">
            <h2 className="font-semibold text-lg sm:text-xl">All Admins</h2>
            <span className="text-xs px-3 py-1 bg-blue-200 text-red-600 rounded-full font-medium">
              Max 3 recommended
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 sm:py-20 text-center text-gray-500">Loading admin list...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-16 sm:py-20 text-center">
            <p className="text-gray-400">No admins found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b text-xs sm:text-sm">
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Expires At</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Last Login</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-right font-medium text-gray-600 w-32 sm:w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredAdmins.map((admin) => {
                  const expired = isExpired(admin.expires_at);
                  return (
                    <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-8 py-4 sm:py-6 font-medium flex items-center gap-2 sm:gap-3">
                        <span className="truncate max-w-[200px]">{admin.email}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(admin.email);
                            toast.success("Email copied");
                          }}
                          className="text-gray-400 hover:text-blue-600 transition shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-600 whitespace-nowrap">{formatDate(admin.expires_at)}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-600 whitespace-nowrap">{formatDate(admin.last_login)}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6">
                        <span
                          className={`inline-flex items-center px-3 sm:px-4 py-1 rounded-3xl text-xs font-semibold whitespace-nowrap ${
                            expired
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {expired ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" /> Expired
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" /> Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                        <button
                          onClick={() => handleDeleteClick(admin._id, admin.email)}
                          disabled={deletingId === admin._id}
                          className="flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Revoke</span>
                          <span className="sm:hidden">Del</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal – fully responsive */}
      {showDeleteDialog && adminToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold">Revoke Access?</h3>
                  <p className="text-sm sm:text-base text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-red-700">You are about to revoke access for:</p>
                <p className="font-semibold text-red-900 mt-1 break-all">{adminToDelete.email}</p>
              </div>
            </div>

            <div className="border-t px-4 sm:px-8 py-4 sm:py-6 flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 py-3 sm:py-4 text-gray-700 font-medium border border-gray-300 rounded-2xl hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === adminToDelete.id}
                className="flex-1 py-3 sm:py-4 bg-red-600 text-white font-medium rounded-2xl hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {deletingId === adminToDelete.id ? "Revoking..." : "Yes, Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-green-500 mt-6 sm:mt-8">
        Note: Expired admins are automatically blocked from logging in. Expiry includes minutes for precise control.
      </p>
    </div>
  );
}