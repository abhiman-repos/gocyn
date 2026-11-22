"use client";

import React, { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL = (
  process.env.APP_URL || "http://localhost:8000"
).replace(/\/+$/, "");

function ResetPasswordForm() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkReady, setLinkReady] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setUid(searchParams.get("uid") || "");
    setToken(searchParams.get("token") || "");
    setLinkReady(true);
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!uid || !token) {
      setError("This password reset link is incomplete. Request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError(
        "Choose a password containing at least one letter and one number.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // This payload must match the fields accepted by your Django
        // ResetPasswordSerializer.
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
        }),
      });

      let data: Record<string, unknown> = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const detail = data.detail;
        const message =
          typeof detail === "string"
            ? detail
            : `Password reset failed (${response.status}).`;

        setError(message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => router.push("/login"), 2200);
    return () => window.clearTimeout(timer);
  }, [success, router]);

  return (
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#f7f8f5] px-5 py-12 text-[#17251f] sm:px-8">
      {/* Subtle ambient colour; no decorative frames or outer card borders. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-[#dcebe2]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#e9eee2]/80 blur-3xl"
      />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="rounded-[28px] bg-white/90 px-6 py-8 shadow-[0_24px_80px_-42px_rgba(23,60,44,0.28)] backdrop-blur-sm sm:px-10 sm:py-10">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-5 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2e8] text-[#267348]">
                <CheckCircle2 size={28} strokeWidth={1.8} />
              </div>
              <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#17251f]">
                Password updated
              </h1>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#68766e]">
                Your Gocyn account is secure with your new password. Taking you
                back to sign in…
              </p>
              <Loader2
                className="mx-auto mt-6 animate-spin text-[#397a54]"
                size={18}
                aria-label="Redirecting"
              />
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf2eb] text-[#285d40]">
                  <LockKeyhole size={21} strokeWidth={1.8} />
                </div>
                <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.055em] text-[#17251f]">
                  Create a new password
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#6b786f]">
                  Choose a strong password to get back into your Gocyn account.
                </p>
              </div>

              {linkReady && (!uid || !token) && (
                <div
                  className="mb-6 flex items-start gap-3 rounded-xl bg-[#fff5e9] px-4 py-3.5 text-sm leading-5 text-[#89551b]"
                  role="alert"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Invalid reset link</p>
                    <p className="mt-1 text-[#946b3c]">
                      This link is missing its security token. Request a new
                      password reset link to continue.
                    </p>
                    <Link
                      href="/forgot-password"
                      className="mt-2 inline-flex font-semibold text-[#285d40] underline-offset-4 hover:underline"
                    >
                      Request a new link
                    </Link>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-start gap-3 rounded-xl bg-[#fff0ef] px-4 py-3.5 text-sm leading-5 text-[#a43e38]"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-[13px] font-semibold text-[#33443a]"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      disabled={loading}
                      className="h-[52px] w-full rounded-xl bg-[#f7f9f6] px-4 pr-12 text-sm text-[#17251f] outline-none ring-1 ring-inset ring-[#e3e9e2] transition placeholder:text-[#9aa59d] focus:bg-white focus:ring-2 focus:ring-[#5d8a6b] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#7c8980] transition hover:text-[#285d40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5d8a6b]"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-[13px] font-semibold text-[#33443a]"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Enter your password again"
                      disabled={loading}
                      className="h-[52px] w-full rounded-xl bg-[#f7f9f6] px-4 pr-12 text-sm text-[#17251f] outline-none ring-1 ring-inset ring-[#e3e9e2] transition placeholder:text-[#9aa59d] focus:bg-white focus:ring-2 focus:ring-[#5d8a6b] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#7c8980] transition hover:text-[#285d40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5d8a6b]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-0.5 text-xs leading-5 text-[#78847b]">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-[#548364]"
                  />
                  <p>
                    Use at least 8 characters, including a letter and a number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !linkReady || !uid || !token}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#204c35] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-[#173c2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8a6b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>
              </form>

              <div className="mt-7 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#69776e] transition hover:text-[#204c35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8a6b] focus-visible:ring-offset-4"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#8a958d]">
          Secure account recovery · Gocyn
        </p>
      </motion.section>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div role="status" className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">Loading password reset…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
