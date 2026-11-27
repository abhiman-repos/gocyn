"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Mail,
  Lock,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/src/context/AuthContext";
import GoogleAuthButton from "@/src/components/libs/google-auth";

const API = process.env.APP_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const router = useRouter();

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!API) {
      setError("Application API URL is not configured.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate user
      const loginResponse = await fetch(`${API}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const loginData = await loginResponse.json().catch(() => ({}));

      if (!loginResponse.ok) {
        const message =
          loginData.detail ||
          loginData.error ||
          loginData.email?.[0] ||
          loginData.password?.[0] ||
          loginData.non_field_errors?.[0] ||
          "Invalid email or password.";

        throw new Error(
          typeof message === "string"
            ? message
            : "Please check your credentials."
        );
      }

      // 2. Extract JWT tokens
      const accessToken =
        loginData.access ?? loginData.token ?? loginData.access_token;

      const refreshToken = loginData.refresh;

      if (!accessToken) {
        throw new Error("Access token was not returned by the server.");
      }

      // 3. Save authentication tokens
      localStorage.setItem("token", accessToken);

      if (refreshToken) {
        localStorage.setItem("refresh", refreshToken);
      }

      // 4. Fetch the latest authenticated user/profile
      const profileResponse = await fetch(`${API}/api/auth/me/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profileData = await profileResponse.json().catch(() => ({}));

      if (!profileResponse.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        throw new Error(
          profileData.detail || "Unable to fetch your account profile."
        );
      }

      const account = profileData.user ?? profileData;
      

      // 5. Build user object that matches the User type expected by AuthContext
      //    (User requires `id`)
      const authenticatedUser = {
        id: profileData.user?.user_id ?? profileData.user?.id, // required by User type
        user_id: profileData.user?.user_id ?? profileData.user?.id,
        full_name: profileData.user?.full_name ?? "",
        email: profileData.user?.email ?? "",
        profile: profileData.profile ?? {},
        profile_completed: profileData.profile_completed ?? null,
        is_profile_completed: profileData.is_profile_completed ?? false,
      };

      localStorage.setItem("user", JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);

      // 6. Redirect based on profile completion
      if (authenticatedUser.profile_completed === null) {
        router.replace("/onboarding");
      } else {
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(next === "/notifications" ? next : "/");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border-0 border-b border-slate-300 px-0 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none rounded-none transition-colors focus:border-blue-600 focus:ring-0 dark:border-zinc-700 dark:text-white dark:focus:border-blue-400";

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 py-12 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-[390px]"
      >
        {/* Header */}
        <header className="mb-12">

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Welcome back.
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Sign in to continue your learning journey.
          </p>
        </header>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 flex items-start gap-2 border-l-2 border-red-500 py-2 pl-3 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-9" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${inputClass} pl-8 pr-10`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-blue-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-between bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </span>

            {!loading && (
              <ChevronRight
                size={19}
                className="transition-transform group-hover:translate-x-1"
              />
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
          <span className="text-xs text-slate-400">OR CONTINUE WITH</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Google authentication */}
        <GoogleAuthButton />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
          </span>

          <Link
            href="/register"
            className="font-semibold text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400"
          >
            Create an account
          </Link>
        </footer>
      </motion.div>
    </main>
  );
}
