"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

const API_URL = (
  process.env.APP_URL || "http://localhost:8000"
).replace(/\/$/, "");

function getErrorMessage(data: any, status: number): string {
  const detail =
    data?.detail ?? data?.email?.[0] ?? data?.non_field_errors?.[0];

  if (Array.isArray(detail)) return detail.filter(Boolean).join(" ");
  if (typeof detail === "string" && detail.trim()) return detail;

  if (status === 400) return "Please check the email address and try again.";
  if (status === 404) return "No account was found with this email address.";
  if (status === 429)
    return "Too many attempts. Please wait a little before trying again.";
  if (status >= 500)
    return "We couldn't send the reset email right now. Please try again later.";
  return "Something went wrong. Please try again.";
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid email address, such as name@example.com.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getErrorMessage(data, response.status));
      }

      setSentTo(normalizedEmail);
      setSent(true);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "We couldn't connect to Gocyn. Check your connection and try again.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to send the reset email. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#f8f9fc] px-5 py-12 text-slate-950 dark:bg-[#090b10] dark:text-white sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/10" />
      </div>

      <div className="relative w-full max-w-[440px]">
        <Link
          href="/"
          className="mb-9 inline-flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            g.
          </span>
          <span>
            gocyn<span className="text-violet-600">.</span>
          </span>
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-3xl bg-white p-7 shadow-[0_20px_70px_-32px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/80 dark:bg-[#11141b] dark:ring-white/10 sm:p-9"
        >
          {!sent ? (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
                <Mail size={22} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Forgot your password?
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Enter the email address associated with your Gocyn account. If
                it matches an account, we’ll send you a secure password-reset
                link.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error ? "forgot-password-error" : undefined
                    }
                    className={`h-12 w-full rounded-xl bg-white px-4 text-sm outline-none ring-1 transition placeholder:text-slate-400 focus:ring-2 dark:bg-white/[0.04] dark:text-white ${
                      error
                        ? "ring-rose-400 focus:ring-rose-400"
                        : "ring-slate-200 focus:ring-violet-500 dark:ring-white/10"
                    }`}
                  />
                </div>

                {error && (
                  <div
                    id="forgot-password-error"
                    role="alert"
                    className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-200"
                >
                  {loading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : null}
                  {loading ? "Sending reset link…" : "Send reset link"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                <CheckCircle2 size={23} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Check your inbox
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Your request was accepted for{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {sentTo}
                </span>
                .
              </p>
              <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <p>
                    If this email is registered, a password-reset link will
                    arrive shortly. Check your spam folder too. The link will
                    let you set a new password—no OTP is required.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Try another email
              </button>
            </motion.div>
          )}

          <div className="mt-7 border-t border-slate-100 pt-5 dark:border-white/10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        </motion.section>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-600">
          For your security, never share a password-reset link with anyone.
        </p>
      </div>
    </main>
  );
}
