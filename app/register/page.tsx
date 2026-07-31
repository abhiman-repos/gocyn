"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  User,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false); // ← New state for Terms & Conditions

  const router = useRouter();

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim())
      return (setError("Full name required"), setLoading(false));
    if (!email.trim()) return (setError("Email required"), setLoading(false));
    if (!isValidEmail(email))
      return (setError("Invalid email"), setLoading(false));
    if (!password || password.length < 6)
      return (setError("Password must be 6+ chars"), setLoading(false));
    if (!agreed)
      return (setError("Accept terms & conditions"), setLoading(false));

    try {
      const res = await fetch(`${API}/partner/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          college: "Not Provided", // 🔥 you can add input later
          course: "General",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // ✅ Save token
      localStorage.setItem("token", data.token);

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Success screen (same as before)
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-950 transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f630_1px,transparent_1px)] bg-[length:40px_40px] opacity-30 pointer-events-none dark:opacity-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl shadow-slate-200/70 dark:shadow-black/40 border border-slate-100 dark:border-zinc-700 p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="mt-8 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Account Created!
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Welcome to Gocyn. Redirecting you to login...
          </p>

          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Redirecting...</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white transition-colors">
      {/* Illustration Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center text-white"
        >
          <div className="relative flex flex-col items-center mb-20 pointer-events-none">
            {/* Logo Image */}
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Gocyn Logo"
                width={260}
                height={260}
                className="drop-shadow-xl "
                priority
              />

              {/* Company Name Overlay */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.04em] text-white text-center drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                  GOCYN
                </h1>
              </div>
            </div>
          </div>

          <h2 className="text-5xl font-bold tracking-tighter mb-3">
            Learn smarter.
          </h2>
          <p className="text-2xl font-medium text-blue-100 max-w-xs">
            Join 10,000+ students mastering the future at Gocyn
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full bg-white p-8 md:p-12 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Get started
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Create your Gocyn account
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400"
            >
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Full name
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-12 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-12 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-12 py-4 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* NEW: Terms & Conditions Checkbox (Mandatory) */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer dark:accent-blue-500 dark:bg-zinc-800 dark:border-zinc-600"
              />
              <label
                htmlFor="terms"
                className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none leading-tight"
              >
                I agree to the{" "}
                <Link
                  href="/terms-and-conditions"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !agreed}
              className="group relative w-full flex items-center justify-center gap-2 overflow-hidden bg-blue-600 px-8 py-2 text-lg font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  Create account
                  <ChevronRight
                    size={22}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
