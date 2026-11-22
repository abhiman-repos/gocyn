"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { 
  Plus, RefreshCw, Search, Copy, Trash2, Pencil,
  Shield, Clock, UserCheck, UserX, AlertTriangle 
} from "lucide-react";

interface Admin {
  grant_id: string;
  email: string;
  full_name: string;
  expires_at: string | null;
  is_active: boolean;
  is_default_admin: boolean;
  access_status: "owner" | "active" | "expired" | "blocked" | "unmanaged" | "disabled";
  has_grant: boolean;
  revoked_at: string | null;
  created_at: string;
  created_by_email?: string;
  revoked_by_email?: string | null;
  updated_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL;
function adminHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Admin session is missing. Please sign in again.");
  return { Authorization: "Bearer " + token };
}

export default function AdminAccessControl() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "blocked" | "owner" | "unmanaged" | "disabled">("all");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingGrant, setEditingGrant] = useState<{ id: string; email: string } | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string } | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_BASE + "/api/admin/access/", { headers: adminHeaders(), cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to fetch access grants.");
      setAdmins(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load admin access.");
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
    if (password.length < 8) return toast.error("Use a password with at least 8 characters");
    if (!expiry || new Date(expiry) <= new Date()) return toast.error("Expiry must be in the future");
    setIsSubmitting(true);
    try {
      const res = await fetch(API_BASE + "/api/admin/access/", {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, expires_at: new Date(expiry).toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data) || "Failed to add admin");
      toast.success("Admin account created or access renewed");
      setEmail(""); setPassword(""); setExpiry("");
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

  const handleEditExpiry = (admin: Admin) => {
    if (!admin.has_grant || !admin.expires_at) return;
    const localDate = new Date(admin.expires_at);
    localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
    setEditExpiry(localDate.toISOString().slice(0, 16));
    setEditingGrant({ id: admin.grant_id, email: admin.email });
  };

  const saveExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrant || !editExpiry) return;
    const expiresAt = new Date(editExpiry);
    if (expiresAt <= new Date()) return toast.error("Expiry must be in the future");
    setIsUpdatingExpiry(true);
    try {
      const res = await fetch(API_BASE + "/api/admin/access/" + editingGrant.id + "/", {
        method: "PATCH",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ expires_at: expiresAt.toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data) || "Failed to update expiry");
      toast.success("Admin access expiry updated");
      setEditingGrant(null);
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Failed to update expiry");
    } finally {
      setIsUpdatingExpiry(false);
    }
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;
    setDeletingId(adminToDelete.id);
    setShowDeleteDialog(false);
    try {
      const res = await fetch(API_BASE + "/api/admin/access/" + adminToDelete.id + "/", {
        method: "DELETE", headers: adminHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to revoke access");
      }
      toast.success("Access blocked for " + adminToDelete.email);
      await fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke admin access");
    } finally {
      setDeletingId(null); setAdminToDelete(null);
    }
  };

  const accessStatus = (admin: Admin) => admin.access_status;

  const formatDate = (dateString: string | null | undefined) => {
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
      const state = accessStatus(admin);
      const matchesFilter = statusFilter === "all" || statusFilter === state;
      return matchesSearch && matchesFilter;
    });
  }, [admins, searchTerm, statusFilter]);

  const activeCount = admins.filter((a) => ["active", "owner"].includes(accessStatus(a))).length;
  const expiredCount = admins.filter((a) => accessStatus(a) === "expired").length;
  const blockedCount = admins.filter((a) => accessStatus(a) === "blocked").length;

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

      <section className="bg-slate-50 border border-slate-200 p-4 sm:p-6 mb-8 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admin password</h2>
            <p className="mt-1 text-sm text-gray-600">Change the password used to sign in to this admin account.</p>
          </div>
          <Link href="/admin/accessControl/change-password" className="inline-flex items-center justify-center bg-slate-900 text-white px-5 py-3 rounded-lg hover:bg-slate-800">
            Change password
          </Link>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
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

        <div className="bg-white p-4 sm:p-6 flex items-center gap-4">
          <UserX className="w-7 h-7 text-orange-600" />
          <div><p className="text-sm font-medium text-gray-500">Blocked</p>
            <p className="text-2xl sm:text-4xl font-bold text-orange-600">{blockedCount}</p></div>
        </div>
      </div>

      {/* Add Admin Form */}
      <div className="bg-white  p-4 sm:p-8 mb-8 sm:mb-10 ">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
          Grant New Admin Access
        </h2>

        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-end">
          <div className="md:col-span-4">
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

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Password</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-4 py-2 sm:px-5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" required minLength={8} />
          </div>
          <div className="md:col-span-3">
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
              disabled={isSubmitting || !email.trim() || !password || !expiry}
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
              Default admin controls all temporary accounts
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
              <option value="blocked">Blocked</option>
              <option value="owner">Default owner</option>
              <option value="unmanaged">Legacy admin (no grant)</option>
              <option value="disabled">Disabled</option>
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
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Full Name</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Granted By</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Expires At</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Account Created</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 sm:px-8 py-3 sm:py-5 text-right font-medium text-gray-600 w-32 sm:w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredAdmins.map((admin) => {
                  const grantStatus = accessStatus(admin);
                  return (
                    <tr key={admin.grant_id} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-700">{admin.full_name || "—"}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-600">{admin.created_by_email}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-600 whitespace-nowrap">{formatDate(admin.expires_at)}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-gray-600 whitespace-nowrap">{formatDate(admin.created_at)}</td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6">
                        <span
                          className={`inline-flex items-center px-3 sm:px-4 py-1 rounded-3xl text-xs font-semibold whitespace-nowrap ${grantStatus === "active" ? "bg-emerald-100 text-emerald-700" : grantStatus === "owner" ? "bg-indigo-100 text-indigo-700" : grantStatus === "blocked" ? "bg-red-100 text-red-700" : grantStatus === "expired" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {grantStatus === "active" ? <><UserCheck className="w-3 h-3 mr-1" /> Active</> : grantStatus === "owner" ? <><Shield className="w-3 h-3 mr-1" /> Default owner</> : grantStatus === "blocked" ? <><UserX className="w-3 h-3 mr-1" /> Blocked</> : grantStatus === "expired" ? <><Clock className="w-3 h-3 mr-1" /> Expired</> : grantStatus === "disabled" ? "Disabled" : "No grant"}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {grantStatus === "owner" ? (
                            <span className="text-xs text-indigo-700">Permanent owner</span>
                          ) : grantStatus === "blocked" ? (
                            <span className="text-xs text-gray-500">Blocked{admin.revoked_by_email ? " by " + admin.revoked_by_email : ""}</span>
                          ) : (
                            <>
                              {admin.has_grant && (
                                <button onClick={() => handleEditExpiry(admin)} className="flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-700 font-medium transition">
                                  <Pencil className="w-4 h-4" /><span>Change expiry</span>
                                </button>
                              )}
                              <button onClick={() => handleDeleteClick(admin.grant_id, admin.email)} disabled={deletingId === admin.grant_id} className="flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition">
                                <Trash2 className="w-4 h-4" /><span>Block access</span>
                              </button>
                            </>
                          )}
                        </div>
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
      {editingGrant && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form onSubmit={saveExpiry} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Change access expiry</h3>
            <p className="mt-1 text-sm text-gray-600">{editingGrant.email}</p>
            <label className="block mt-5 text-sm font-medium text-gray-700">New expiry date and time</label>
            <input
              type="datetime-local"
              value={editExpiry}
              onChange={(event) => setEditExpiry(event.target.value)}
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              className="mt-2 w-full border border-gray-300 px-4 py-3 rounded-lg"
              required
            />
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingGrant(null)} className="flex-1 border border-gray-300 py-3 rounded-lg" disabled={isUpdatingExpiry}>Cancel</button>
              <button type="submit" disabled={isUpdatingExpiry || !editExpiry} className="flex-1 bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50">
                {isUpdatingExpiry ? "Saving..." : "Save expiry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteDialog && adminToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl">
            <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold">Block Admin Access?</h3>
                  <p className="text-sm sm:text-base text-gray-600">This immediately blocks future admin API access. The grant remains listed for audit.</p>
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
                {deletingId === adminToDelete.id ? "Revoking..." : "Yes, Block Access"}
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
