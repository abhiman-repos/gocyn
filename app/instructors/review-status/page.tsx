"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PartnerReviewStatus from "@/src/components/partner/PartnerReviewStatus";
import {
  AuthError,
  clearInstructorSession,
  fetchInstructorMe,
  type InstructorMe,
} from "@/src/components/libs/instructors";

export default function PartnerReviewStatusPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InstructorMe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await fetchInstructorMe();
      setProfile(me);
      // If already approved (e.g. admin approved while the user was on this page),
      // bounce them to the dashboard.
      if (me.status === "approved") {
        router.replace("/instructors/dashboard");
      }
    } catch (err) {
      if (err instanceof AuthError || (err as any)?.name === "AuthError") {
        router.replace("/instructors/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <PartnerReviewStatus
      status={
        profile.status === "approved" ? "pending" : profile.status
      }
      reviewNote={profile.review_note}
      reviewedAt={profile.reviewed_at}
      submittedAt={profile.submitted_at}
      credentialScore={profile.credential_score}
      onLogout={() => {
        clearInstructorSession();
        router.replace("/instructors/login");
      }}
      onRefresh={load}
    />
  );
}