"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, KeyRound } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

function errorMessage(data: Record<string, any>): string {
  const value = data.detail ?? data.error ?? data.new_password ?? data.current_password ?? data.message;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : String(item)).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(" ") : String(message)}`)
      .join(" ");
  }
  return "Could not change the password. Please try again.";
}

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/admin/credentials/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const body = await response.text();
      let data: Record<string, any> = {};
      try {
        data = body ? JSON.parse(body) : {};
      } catch {
        throw new Error(`Server returned an unreadable response (HTTP ${response.status}).`);
      }
      if (!response.ok) throw new Error(errorMessage(data));

      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("isAdmin");
      sessionStorage.removeItem("isDefaultAdmin");
      toast.success("Password changed. Sign in with your new password.");
      window.location.replace("/admin/login");
    } catch (err: any) {
      const message = err?.message || "Could not change the password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <Link href="/admin/accessControl" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Access Control
      </Link>

      <section className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Change admin password</h1>
            <p className="text-sm text-gray-600 mt-1">Confirm your current password, then choose a new one.</p>
          </div>
        </div>

        {error && <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={changePassword} className="mt-7 space-y-5">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <p className="mt-2 text-xs text-gray-500">Use at least 8 characters. The server will check the password against its security rules.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword} className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300">
            {loading ? "Changing password..." : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
