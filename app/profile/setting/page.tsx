"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Shield,
  LogOut,
  Mail,
  Smartphone,
  AlertTriangle,
  Trash2,
  ChevronRight,
  Check,
  X,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext"; // adjust path if needed

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "account">(
    "notifications"
  );

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [internshipAlerts, setInternshipAlerts] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Delete account states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const { logout } = useAuth(); // use your auth context

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const resetDelete = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    setDeleteStatus("idle");
    setPassword("");
    setConfirmPassword("");
    setConfirmChecked(false);
    setErrorMsg("");
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirmChecked) return;

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password and Confirm Password do not match.");
      return;
    }

    try {
      setDeleteStatus("verifying");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired. Please login again.");

      const res = await fetch(`${API}/api/users/profile/delete/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      localStorage.clear();
      sessionStorage.clear();
      setDeleteStatus("success");
    } catch (err: any) {
      setDeleteStatus("error");
      setErrorMsg(err.message || "Something went wrong");
    }
  };

  const tabs = [
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
      description: "Email & push preferences",
    },
    {
      id: "account" as const,
      label: "Account",
      icon: Shield,
      description: "Security & deletion",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-gray-500 text-base sm:text-lg">
            Manage your notifications and account preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* ─── Sidebar ─── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isActive ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? "text-blue-600" : "text-gray-500"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tab.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all"
                >
                  <div className="p-2 rounded-lg bg-red-50">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Log out</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Sign out of your account
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </aside>

          {/* ─── Main Content ─── */}
          <main className="flex-1 min-w-0">
            {/* ==================== NOTIFICATIONS TAB ==================== */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                {/* Email Notifications */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Email Notifications
                        </h2>
                        <p className="text-sm text-gray-500">
                          Choose what we send to your inbox
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <ToggleRow
                      title="Internship & Job Alerts"
                      description="Get notified when new internships matching your profile are posted"
                      checked={internshipAlerts}
                      onChange={setInternshipAlerts}
                    />
                    <ToggleRow
                      title="Course Updates"
                      description="Updates about courses you’re enrolled in or following"
                      checked={courseUpdates}
                      onChange={setCourseUpdates}
                    />
                    <ToggleRow
                      title="Marketing & Promotions"
                      description="Occasional offers, tips and product news"
                      checked={marketingEmails}
                      onChange={setMarketingEmails}
                    />
                  </div>
                </section>

                {/* Push Notifications */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-50 rounded-lg">
                        <Smartphone className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Push Notifications
                        </h2>
                        <p className="text-sm text-gray-500">
                          Alerts on your device
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <ToggleRow
                      title="Enable Push Notifications"
                      description="Receive real-time alerts on this device"
                      checked={pushNotifs}
                      onChange={setPushNotifs}
                    />
                    <ToggleRow
                      title="Email Digest"
                      description="Weekly summary of activity and opportunities"
                      checked={emailNotifs}
                      onChange={setEmailNotifs}
                    />
                  </div>
                </section>

                <p className="text-sm text-gray-500 px-1">
                  You will always receive important security and account-related
                  emails.
                </p>
              </div>
            )}

            {/* ==================== ACCOUNT TAB ==================== */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {deleteStatus === "success" ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 sm:p-16 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Account Deleted
                    </h3>
                    <p className="text-gray-500 mt-3 max-w-md mx-auto">
                      Your account has been permanently deleted. We’re sorry to
                      see you go.
                    </p>
                    <button
                      onClick={resetDelete}
                      className="mt-8 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                    >
                      Go to Login
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Danger Zone */}
                    <section className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-red-700">
                              Delete Account
                            </h2>
                            <p className="text-sm text-red-600/80">
                              This action is permanent and cannot be undone
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          In-app Notifications
                        </h2>
                        <p className="text-sm text-gray-500">
                          Course approvals and course recommendations
                        </p>
                      </div>

                      <div className="p-6 space-y-6">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Deleting your account will permanently remove all your
                          data, applications, saved internships, and profile
                          information from Gocyn.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Password
                            </label>
                            <input
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition text-sm"
                            />
                          </div>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={confirmChecked}
                              onChange={(e) =>
                                setConfirmChecked(e.target.checked)
                              }
                              className="mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-600 leading-relaxed">
                              I understand that deleting my account is permanent
                              and I will lose all my data, applications, and
                              connections on Gocyn.
                            </span>
                          </label>

                          {errorMsg && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                              <X className="w-4 h-4 shrink-0" />
                              {errorMsg}
                            </div>
                          )}

                          <button
                            onClick={handleDeleteAccount}
                            disabled={
                              deleteStatus === "verifying" || !confirmChecked
                            }
                            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm"
                          >
                            {deleteStatus === "verifying" ? (
                              "Deleting account..."
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Permanently Delete Account
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Helpful Links */}
                    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Need help first?
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Consider these options before deleting
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100">
                        <Link
                          href="/contactus"
                          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                Contact Support
                              </p>
                              <p className="text-xs text-gray-500">
                                Talk to us before you leave
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" />
                        </Link>

                        <Link
                          href="/auth/terms-and-conditions"
                          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                              <FileText className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                Terms & Conditions
                              </p>
                              <p className="text-xs text-gray-500">
                                Review our terms before deleting
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" />
                        </Link>
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Reusable Toggle Row Component
// ──────────────────────────────────────────────
function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="pr-4">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
