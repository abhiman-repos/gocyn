"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MdAdminPanelSettings, MdOutlineSecurity } from "react-icons/md";
import { FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import CircularText from "@/src/components/CircularText";

const API = process.env.NEXT_PUBLIC_APP_URL;

async function readApiResponse(response: Response): Promise<Record<string, any>> {
  const body = await response.text();
  if (!body) return {};

  try {
    const data: unknown = JSON.parse(body);
    return data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, any>)
      : { message: data };
  } catch {
    return { message: `Server returned an unreadable response (HTTP ${response.status}).` };
  }
}

function getApiError(data: Record<string, any>, fallback: string): string {
  const value = data.error ?? data.detail ?? data.message ?? data.non_field_errors;
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.map((item) => getApiError({ message: item }, "")).filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  if (value && typeof value === "object") {
    const messages = Object.entries(value).map(([field, message]) => {
      const text = getApiError({ message }, "");
      return text ? `${field}: ${text}` : "";
    }).filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return fallback;
}

export default function AdminLogin() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Reuse an existing session only after the backend confirms it is valid.
  useEffect(() => {
    const persistedToken = localStorage.getItem("adminToken");
    const legacyToken = sessionStorage.getItem("isAdmin") === "true"
      ? localStorage.getItem("token")
      : null;
    const token = persistedToken || legacyToken;
    if (!token) return;
    if (!persistedToken && legacyToken) localStorage.setItem("adminToken", legacyToken);
    fetch(API + "/api/admin/session/", {
      headers: { Authorization: "Bearer " + token }, cache: "no-store",
    }).then(async (res) => {
      if (res.ok) {
        const session = await res.json().catch(() => ({}));
        if (typeof session.token === "string" && session.token) localStorage.setItem("adminToken", session.token);
        router.replace("/admin");
      } else if (res.status === 401 || res.status === 403) localStorage.removeItem("adminToken");
    }).catch(() => {
      // Preserve the persisted token during temporary network/API failures.
    });
  }, [router]);

  // ==================== SEND OTP ====================
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/admin/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(getApiError(data, `Failed to send OTP (HTTP ${res.status}).`));
      }
      if (typeof data.challenge_id !== "string" || !data.challenge_id) {
        throw new Error("The server did not return a verification challenge. Please try again.");
      }

      setChallengeId(data.challenge_id);
      toast.success("OTP sent successfully to your email");
      setStep("otp");
    } catch (err: any) {
      const message = err.message || "Failed to send OTP";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== VERIFY OTP ====================
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/admin/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeId,
          otp: otp.trim(),
        }),
      });

      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(getApiError(data, `OTP verification failed (HTTP ${res.status}).`));
      }

      // Success
      sessionStorage.setItem("isAdmin", "true");
      if (data.token) localStorage.setItem("adminToken", data.token);

      toast.success("Welcome back, Admin");
      router.replace("/admin");
    } catch (err: any) {
      const message = err.message || "Verification failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4 overflow-hidden">
      {/* Centered circular text as background (behind card) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="scale-350 sm:scale-200 md:scale-[2.5] lg:scale-[3.8] transition-transform duration-700">
          <CircularText
            text="WELCOME*TO*GOCYN*"
            spinDuration={25}
            className="text-white/20"
          />
        </div>
      </div>

      {/* Additional background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(at_top_right,#4f46e510_0%,transparent_50%)] z-0"></div>

      {/* Card (above background) */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8 text-center border-b border-gray-100">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-inner">
              <MdAdminPanelSettings className="text-white" size={40} />
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-lg">
              Secure access for authorized personnel only
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
              <MdOutlineSecurity className="text-emerald-500" size={14} />
              <span>Enterprise Grade Security</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 sm:mx-10 mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-start gap-2 sm:gap-3">
              <div className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={sendOtp} className="px-6 sm:px-10 pt-6 sm:pt-8 pb-8 sm:pb-12 space-y-6 sm:space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@yourcompany.com"
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <label className="block text-sm font-medium text-gray-700 mt-5 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock size={18} />
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 rounded-2xl transition-all duration-300 text-base sm:text-lg shadow-lg shadow-blue-500/30 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Sending OTP..."
                ) : (
                  <>
                    Send Secure OTP <FiLock className="text-lg" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form onSubmit={verifyOtp} className="px-6 sm:px-10 pt-6 sm:pt-8 pb-8 sm:pb-12 space-y-6 sm:space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Enter verification code sent to
                </label>
                <p className="text-blue-700 font-medium text-lg sm:text-xl mb-3 sm:mb-4">{email}</p>

                <div className="relative">
                  <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiLock size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-2xl sm:text-3xl tracking-[8px] text-center font-mono"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 sm:py-4 rounded-2xl transition-all duration-300 text-base sm:text-lg shadow-lg shadow-emerald-500/30 flex items-center justify-center"
              >
                {loading ? "Verifying..." : "Verify & Access Dashboard"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setChallengeId("");
                  setError("");
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-blue-700 font-medium py-2 sm:py-3 transition-colors text-sm sm:text-base"
              >
                <FiArrowLeft className="text-lg" />
                Change Email Address
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6 sm:mt-8">
          Protected by advanced multi-factor authentication
        </p>
      </div>
    </div>
  );
}
