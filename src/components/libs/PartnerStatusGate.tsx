"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PartnerReviewStatus from "../partner/PartnerReviewStatus";
import {
  AuthError,
  clearInstructorSession,
  fetchInstructorMe,
  type InstructorMe,
  type InstructorStatus,
} from "../libs/instructors";

type GateState = "loading" | "approved" | "review" | "error";

export default function PartnerStatusGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("loading");
  const [profile, setProfile] = useState<InstructorMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const me = await fetchInstructorMe();
      setProfile(me);
      if (me.status === "approved") {
        setState("approved");
      } else {
        setState("review");
      }
    } catch (err: any) {
      if (err instanceof AuthError || err?.name === "AuthError") {
        router.replace("/instructors/login");
        return;
      }
      setError(err?.message || "Failed to load your profile.");
      setState("error");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while pending, so the screen flips to "approved" without a manual refresh
  useEffect(() => {
    if (state !== "review" || profile?.status !== "pending") return;
    const id = setInterval(() => {
      load();
    }, 60_000);
    return () => clearInterval(id);
  }, [state, profile?.status, load]);

  const handleLogout = () => {
    clearInstructorSession();
    router.replace("/instructors/login");
  };

  if (state === "loading") {
    return <LoadingScreen />;
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white border border-red-200 max-w-md w-full p-6 text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state === "approved") {
    return <>{children}</>;
  }

  // state === "review"
  const status = (profile?.status ?? "pending") as Exclude<InstructorStatus, "approved">;

  return (
    <PartnerReviewStatus
      status={status}
      reviewNote={profile?.review_note}
      reviewedAt={profile?.reviewed_at}
      submittedAt={profile?.submitted_at}
      credentialScore={profile?.credential_score}
      onLogout={handleLogout}
      onRefresh={load}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-6 h-6 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-gray-500">Loading your account…</p>
      </div>
    </div>
  );
}
