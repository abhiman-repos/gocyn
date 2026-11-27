"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const API = process.env.APP_URL;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [tokenFromUrl, emailFromUrl]);

  /* Live password strength criteria */
  const criteria = [
    { label: "Minimum 8 characters", passed: password.length >= 8 },
    { label: "At least one uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "At least one numeric digit", passed: /[0-9]/.test(password) },
    {
      label: "At least one special symbol (!@#$%^&*)",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const allPassed = criteria.every((c) => c.passed);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token.trim()) {
      setErrorMessage("Authentication token is missing or has expired. Please request a new link.");
      return;
    }

    if (!allPassed) {
      setErrorMessage("Please ensure your new password satisfies all security criteria.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("The confirmation password does not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/instructors/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update password. Your token may have expired.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while resetting your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Mobile Logo Header */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <Image
          src="/logo.png"
          alt="Gocyn logo"
          width={80}
          height={80}
        />
        <span className="text-4xl font-bold tracking-tighter text-gray-900">
          Go<span className="text-blue-600">cyn</span>
        </span>
      </div>

      {!isSuccess ? (
        <div>
          <div className="mb-8">
            <div className="inline-block mb-3 px-2.5 py-1 bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 uppercase tracking-widest">
              Credential Renewal
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Create New Password
            </h2>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              Your new password must be distinct from previous passwords to ensure your instructor account remains secure.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* Display token input only if token was missing from URL */}
            {!tokenFromUrl && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                  Reset Verification Token <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Paste security token from email"
                  className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all font-mono"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                New Secure Password <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Live Criteria Indicators */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Security Requirements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {criteria.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className={`w-3.5 h-3.5 flex items-center justify-center border transition-all ${
                        item.passed
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <span
                      className={
                        item.passed
                          ? "text-gray-900 font-medium"
                          : "text-gray-400"
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                Confirm New Password <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className={`w-full bg-white border px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all pr-12 ${
                    confirmPassword && !passwordsMatch
                      ? "border-red-400 ring-1 ring-red-300 bg-red-50"
                      : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> Passwords do
                  not match
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allPassed || !passwordsMatch}
              className="w-full py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Updating Credentials…
                </>
              ) : (
                "Update Password & Access Account →"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Link expired or invalid?</span>
            <Link
              href="/instructors/forgot-password"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Request new link
            </Link>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="border border-blue-200 bg-white p-8 space-y-6">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Password successfully changed
            </h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Your instructor credentials have been updated. All previous active sessions have been securely terminated.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/instructors/login")}
            className="w-full py-3 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Sign in to Mentor Portal <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function MentorResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1588fa; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex w-[620px] flex-shrink-0 flex-col relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(211, 16, 16, 0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
          <div>
            <div className="inline-block mb-4 px-3 py-1 bg-white/100 border border-white/20 text-xs text-blue-900 font-semibold tracking-wider uppercase">
              Security Protocol
            </div>
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/logo.png"
                alt="logo"
                height={120}
                width={120}
              />
              <span className="text-6xl font-bold tracking-tighter text-white">
                Go<span className="text-blue-100">cyn</span>
              </span>
            </div>
          </div>

          <div className="my-auto">
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Fortifying your
              <br />
              mentor profile
              <br />
              and content.
            </h1>
            <p className="mt-4 text-blue-50 text-base leading-relaxed max-w-md">
              Secure authentication ensures that your proprietary course modules, mentee communications, and financial payout routes remain protected.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Instant invalidation of stale authorization tokens",
                "Password strength checks aligned with enterprise standards",
                "Continuous encryption over transport and storage layers",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 text-sm text-blue-50"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 text-xs text-blue-100 border-t border-white/20">
            Protected under Gocyn Instructor Authentication Shield • 2026
          </div>
        </div>
      </div>

      {/* ── Right Action Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              Initializing secure session…
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
