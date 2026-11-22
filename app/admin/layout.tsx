"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  // Tracks whether we've confirmed auth on the client.
  // null  = not checked yet (show nothing to avoid flash)
  // true  = authenticated
  // false = not authenticated
  const [authState, setAuthState] = useState<null | boolean>(null);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthState(false);
      return;
    }
    let cancelled = false;
    const clearSession = () => {
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("isAdmin");
      sessionStorage.removeItem("isDefaultAdmin");
    };
    const checkSession = async () => {
      const persistedAdminToken = localStorage.getItem("adminToken");
      const legacyAdminToken = sessionStorage.getItem("isAdmin") === "true"
        ? localStorage.getItem("token")
        : null;
      const token = persistedAdminToken || legacyAdminToken;
      if (!token) {
        sessionStorage.removeItem("isAdmin");
        if (!cancelled) { setAuthState(false); router.replace("/admin/login"); }
        return;
      }
      if (!persistedAdminToken && legacyAdminToken) {
        localStorage.setItem("adminToken", legacyAdminToken);
      }
      // sessionStorage survives a refresh in the same tab. Keep the admin shell
      // mounted while the server confirms the persisted localStorage token.
      if (sessionStorage.getItem("isAdmin") === "true" && !cancelled) {
        setAuthState(true);
      }
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/admin/session/", {
          headers: { Authorization: "Bearer " + token }, cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) {
          clearSession();
          if (!cancelled) { setAuthState(false); router.replace("/admin/login"); }
          return;
        }
        if (!response.ok) {
          // A backend outage or proxy error is not proof that this token expired.
          if (!cancelled && sessionStorage.getItem("isAdmin") !== "true") setAuthState(true);
          return;
        }
        const session = await response.json();
        if (cancelled) return;
        if (typeof session.token === "string" && session.token) localStorage.setItem("adminToken", session.token);
        sessionStorage.setItem("isAdmin", "true");
        sessionStorage.setItem("isDefaultAdmin", String(session.is_default_admin === true));
        if (pathname.startsWith("/admin/accessControl") && session.is_default_admin !== true) {
          router.replace("/admin");
          return;
        }
        setAuthState(true);
      } catch {
        // Keep a previously authenticated UI session through transient network
        // failures; API authorization remains enforced by the backend.
        if (!cancelled) setAuthState(true);
      }
    };
    void checkSession();
    const interval = window.setInterval(checkSession, 60_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [pathname, router]);

  // ── Login page ─────────────────────────────────────────────────────────────
  // Render immediately — no auth check needed, no sidebar.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // ── Not yet checked ────────────────────────────────────────────────────────
  // Render nothing until we know auth status, preventing a flash of
  // authenticated UI to an unauthenticated user.
  if (authState === null || authState === false) {
    return null;
  }

  // ── Authenticated admin panel ──────────────────────────────────────────────
  // The <Sidebar> component handles:
  //   • its own spacer div (pushes content on desktop when pinned)
  //   • mobile drawer + backdrop
  //   • collapsed / expanded / hover states
  // So this layout just needs `flex` and lets Sidebar + flex-1 do the rest.
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* flex-1 fills whatever horizontal space the Sidebar spacer leaves */}
      <main className="flex-1 min-w-0 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
