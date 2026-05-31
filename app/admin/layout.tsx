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
    // sessionStorage is only available client-side, so this belongs in useEffect.
    const isAdmin = sessionStorage.getItem("isAdmin") === "true";
    setAuthState(isAdmin);

    if (!isAdmin && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
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