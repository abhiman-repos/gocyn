
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileAllowed, setProfileAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      if (loading) return;

      // 1. Authentication check
      if (!user) {
        router.replace("/login");
        return;
      }

      // 2. Fetch latest profile status from backend
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setCheckingProfile(true);
        setProfileAllowed(false);

        const response = await fetch(`${API}/api/auth/me/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to verify profile");
        }

        const data = await response.json();

        if (cancelled) return;

        // 3. Mandatory onboarding check
        const isCompleted =
          data.profile_completed !== null &&
          data.profile_completed !== undefined;

        if (!isCompleted) {
          router.replace("/onboarding");
          return;
        }

        // 4. Update local user data
        const account = data.user ?? {};

        const authenticatedUser = {
          ...account,
          profile: data.profile ?? {},
          profile_completed: data.profile_completed,
          is_profile_completed: true,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(authenticatedUser)
        );

        // 5. Allow protected page
        setProfileAllowed(true);

      } catch (error) {
        console.error("AuthGuard error:", error);

        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [user, loading, router, pathname]);

  // Loading state
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">
            Verifying your account...
          </p>
        </div>
      </div>
    );
  }

  // Do not render protected content until verified
  if (!user || !profileAllowed) {
    return null;
  }

  return <>{children}</>;
}
