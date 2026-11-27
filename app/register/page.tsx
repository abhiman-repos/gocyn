"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import Image from "next/image";

const API = process.env.APP_URL;

const TERMS_VERSION = "1.0";
const PRIVACY_POLICY_VERSION = "1.0";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const router = useRouter();

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim())
      return (setError("Full name is required."), setLoading(false));
    if (!email.trim())
      return (setError("Email address is required."), setLoading(false));
    if (!isValidEmail(email))
      return (
        setError("Please enter a valid email address."),
        setLoading(false)
      );
    if (!password || password.length < 6)
      return (
        setError("Password must be at least 6 characters."),
        setLoading(false)
      );
    if (!agreed)
      return (
        setError("Please accept the Terms & Conditions to continue."),
        setLoading(false)
      );
    if (!privacyConsent)
      return (
        setError(
          "Explicit consent to the Privacy Policy is required to register."
        ),
        setLoading(false)
      );

    try {
      const res = await fetch(`${API}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          // ✅ Sent from the actual state — will be `true` only because
          // the early-return gate above already verified privacyConsent.
          privacy_consent: privacyConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Success screen ---------------- */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm border border-slate-200 bg-white p-10"
        >
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            Account created
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Your account is ready. Sign in to continue.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Loader2 className="animate-spin h-3.5 w-3.5" />
            Redirecting
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------------- Main page ---------------- */
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* ─────────── LEFT: brand panel (blue → indigo) ─────────── */}
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 relative overflow-hidden">
        {/* Subtle radial texture — kept from original */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Gocyn"
            width={36}
            height={36}
            className="drop-shadow-md"
            priority
          />
          <span className="text-sm font-semibold tracking-widest uppercase">
            Gocyn
          </span>
        </div>

        <div className="relative z-10 space-y-8 max-w-sm">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Learn smarter.
            <br />
            Ship faster.
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Join 10,000+ students mastering the future at Gocyn. Structured
            curriculum, real-world projects, and mentorship from practitioners.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              "Industry-aligned curriculum",
              "Mentorship from practitioners",
              "Portfolio-grade projects",
              "Placement support",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-blue-50"
              >
                <span className="w-4 h-4 border border-white/40 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-blue-100/70 tracking-wide">
          © {new Date().getFullYear()} Gocyn. All rights reserved.
        </p>
      </aside>

      {/* ─────────── RIGHT: form ─────────── */}
      <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image
              src="/logo.png"
              alt="Gocyn"
              width={28}
              height={28}
              priority
            />
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-900">
              Gocyn
            </span>
          </div>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Get started — it only takes a minute.
            </p>
          </header>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* ── Full name ── */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700"
              >
                <User size={12} />
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>

            {/* ── Email ── */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700"
              >
                <Mail size={12} />
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-11 px-3 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>

            {/* ── Password ── */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-700"
              >
                <Lock size={12} />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-3 pr-11 border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* ── CONSENT BLOCK ── */}
            <div className="border border-slate-300">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-slate-300">
                <ShieldCheck size={14} className="text-blue-700" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                  Consent
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* T&C */}
                <label
                  htmlFor="terms"
                  className="flex items-start gap-3 cursor-pointer select-none"
                >
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm leading-snug text-slate-700">
                    I have read and agree to the{" "}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
                    >
                      Terms &amp; Conditions
                    </Link>
                    . <span className="text-red-600">*</span>
                  </span>
                </label>

                {/* Privacy */}
                <label
                  htmlFor="privacy-consent"
                  className="flex items-start gap-3 cursor-pointer select-none pt-3 border-t border-slate-200"
                >
                  <input
                    id="privacy-consent"
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm leading-snug text-slate-700">
                    I give my <strong>explicit consent</strong> to the collection
                    and processing of my personal data per the{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
                    >
                      Privacy Policy
                    </Link>{" "}
                    under the DPDP Act, 2023.{" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>

                {/* Marketing — optional */}
                <label
                  htmlFor="marketing-consent"
                  className="flex items-start gap-3 cursor-pointer select-none pt-3 border-t border-slate-200"
                >
                  <input
                    id="marketing-consent"
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm leading-snug text-slate-500">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                      Optional
                    </span>
                    Send me product updates and marketing emails. I can
                    unsubscribe anytime.
                  </span>
                </label>
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading || !agreed || !privacyConsent}
              className="w-full h-11 bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}