"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function MentorForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid institutional or personal email address.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API}/api/instructors/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to send reset instructions. Please check the email entered.");
      }

      setSubmitted(true);
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API}/api/instructors/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to resend reset email.");
      }
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to resend. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1588fa; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>

      {/* ── Left Decorative Panel ── */}
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
              Mentor Account Security
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
              Regain access to
              <br />
              your teaching
              <br />
              command center.
            </h1>
            <p className="mt-4 text-blue-50 text-base leading-relaxed max-w-md">
              Securely restore your mentor portal credentials to continue hosting mentorship sessions, tracking cohort analytics, and managing coursework.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Encrypted, single-use password renewal tokens",
                "Automated 30-minute validity link delivered to inbox",
                "Immediate session isolation upon password reset",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-blue-50">
                  <div className="w-1.5 h-1.5 bg-blue-200 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 text-xs text-blue-100 border-t border-white/20">
            For critical account recovery issues, contact mentor support at{" "}
            <span className="text-white font-medium underline">support@gocyn.com</span>
          </div>
        </div>
      </div>

      {/* ── Right Content Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
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

          <Link
            href="/instructors/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wider mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to instructions Sign In
          </Link>

          {!submitted ? (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Reset your password
                </h2>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                  Enter your registered mentor email address. We will verify your profile and dispatch an encrypted password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                    Registered Mentor Email <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      required
                      placeholder="instructor@institution.com"
                      className={`w-full bg-white border px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all pr-10 ${
                        errorMessage
                          ? "border-red-400 ring-1 ring-red-300 bg-red-50"
                          : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {errorMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Dispatching Reset Instructions…
                    </>
                  ) : (
                    "Send Password Reset Link →"
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Remember your password?</span>
                <Link
                  href="/instructors/login/"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign in to Portal
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-blue-100 bg-white p-8 space-y-6">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  Check your inbox
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  We have dispatched a password reset link to{" "}
                  <span className="font-semibold text-gray-900">{email}</span>. Please click the link within 30 minutes to set a new password.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Did not receive the email?</p>
                <p>Check your spam folder or verify if this is your registered mentor account address.</p>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend Link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setErrorMessage("");
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all text-center"
                >
                  Change Email Address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}