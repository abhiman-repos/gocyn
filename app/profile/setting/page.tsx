"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Shield,
  X,
  AlertTriangle,
  Trash2,
  Mail,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

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

  const tabs = [
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    { id: "account", label: "Account", icon: <Shield className="w-5 h-5" /> },
  ];

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

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const res = await fetch(`${API}/api/users/profile/delete/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      // Clear all auth data after successful deletion
      localStorage.clear();
      sessionStorage.clear();

      setDeleteStatus("success");
    } catch (err: any) {
      setDeleteStatus("error");
      setErrorMsg(err.message || "Something went wrong");
    }
  };

  return (
    <>
      <div className="pt-14 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Sidebar – horizontal scroll on mobile */}
            <div className="w-full lg:w-64 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-3 h-fit lg:sticky top-20">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 px-3 sm:px-4 py-2 sm:py-3">
                Settings
              </h1>
              <div className="mt-2 flex lg:flex-col gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-left transition-all text-sm sm:text-base ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 w-full max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">
                Account Settings
              </h2>
              <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
                Manage your notifications and account security
              </p>

              {activeTab === "notifications" && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-5 sm:p-8">
                  <div className="flex items-center justify-center flex-col py-8 sm:py-12 text-center">
                    <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mb-4" />
                    <h3 className="text-xl sm:text-2xl font-semibold">
                      Notification Preferences
                    </h3>
                    <p className="text-gray-500 mt-2 sm:mt-3 max-w-md text-sm sm:text-base">
                      You will continue to receive important updates about
                      internships and applications.
                    </p>
                    <button className="mt-6 sm:mt-8 bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl text-sm sm:text-base font-medium">
                      Manage Email &amp; Push Notifications
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-5 sm:p-8">
                  {deleteStatus === "success" ? (
                    <div className="text-center py-10 sm:py-16">
                      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6">
                        <Trash2 className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-green-600">
                        Account Deleted Successfully
                      </h3>
                      <p className="text-gray-600 mt-3 sm:mt-4 max-w-md mx-auto text-sm sm:text-base">
                        Your Gocyn account has been permanently deleted.
                        <br />
                        Thank you for being part of our community.
                      </p>
                      <button
                        onClick={resetDelete}
                        className="mt-8 sm:mt-10 px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-800 text-white rounded-2xl sm:rounded-3xl text-sm sm:text-base font-medium"
                      >
                        Back to Settings
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-red-600 mb-4 sm:mb-6">
                        <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
                        <h3 className="text-xl sm:text-2xl font-bold">
                          Delete Account
                        </h3>
                      </div>

                      <p className="text-gray-600 text-base sm:text-lg">
                        This action is{" "}
                        <span className="font-semibold text-red-600">
                          permanent and cannot be undo
                        </span>
                        .
                      </p>

                      <div className="mt-6 sm:mt-10 space-y-6 sm:space-y-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your password
                          </label>
                          <input
                            type="password"
                            placeholder="Your account password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl sm:rounded-2xl focus:border-red-500 outline-none text-base sm:text-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm password
                          </label>
                          <input
                            type="password"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl sm:rounded-2xl focus:border-red-500 outline-none text-base sm:text-lg"
                          />
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="confirm"
                            checked={confirmChecked}
                            onChange={(e) =>
                              setConfirmChecked(e.target.checked)
                            }
                            className="mt-1 w-5 h-5 accent-red-600 shrink-0"
                          />
                          <label
                            htmlFor="confirm"
                            className="text-sm text-gray-700 leading-tight cursor-pointer"
                          >
                            I understand that deleting my account is permanent
                            and I will lose all my data, internships,
                            connections and profile on Gocyn.
                          </label>
                        </div>

                        {errorMsg && (
                          <p className="text-red-600 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-xl sm:rounded-2xl">
                            <X className="w-4 h-4 shrink-0" /> {errorMsg}
                          </p>
                        )}

                        <button
                          onClick={handleDeleteAccount}
                          disabled={
                            deleteStatus === "verifying" || !confirmChecked
                          }
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 sm:py-4 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-1 text-sm sm:text-base"
                        >
                          {deleteStatus === "verifying" ? (
                            <>Verifying &amp; Deleting Account...</>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              Permanently Delete My Account
                            </>
                          )}
                        </button>
                      </div>

                      {/* Contact & Terms with React Icons */}
                      <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                        <p className="text-gray-500 text-sm mb-4 sm:mb-6">
                          Before deleting your account, you may want to:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {/* Contact Us */}
                          <Link
                            href="/contactus"
                            className="group flex items-center justify-between bg-white border border-gray-200 hover:border-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div>
                                <p className="font-semibold text-base sm:text-lg text-gray-900">
                                  Contact Us
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Talk to support before deleting
                                </p>
                              </div>
                            </div>
                            <span className="text-blue-600 group-hover:translate-x-1 transition-transform text-lg sm:text-xl">
                              →
                            </span>
                          </Link>

                          {/* Terms & Conditions */}
                          <Link
                            href="/auth/terms-and-conditions"
                            className="group flex items-center justify-between bg-white border border-gray-200 hover:border-blue-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 bg-amber-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div>
                                <p className="font-semibold text-base sm:text-lg text-gray-900">
                                  Terms &amp; Conditions
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Read full terms before deleting
                                </p>
                              </div>
                            </div>
                            <span className="text-blue-600 group-hover:translate-x-1 transition-transform text-lg sm:text-xl">
                              →
                            </span>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}