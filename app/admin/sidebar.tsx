"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MdDashboard,
  MdWork,
  MdPerson,
  MdControlCamera,
  MdAdminPanelSettings,
  MdAppRegistration,
  MdMenu,
  MdClose,
  MdLogout,
} from "react-icons/md";
import { HiDocument } from "react-icons/hi";
import Image from "next/image";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: MdDashboard },
  { path: "/admin/internships", label: "Internships", icon: MdWork },
  { path: "/admin/mentors", label: "Mentors", icon: MdAdminPanelSettings },
  { path: "/admin/accessControl", label: "Controls", icon: MdControlCamera },
  { path: "/admin/enrollments", label: "Enrollments", icon: MdPerson },
  { path: "/admin/certificates", label: "Certificates", icon: HiDocument },
  { path: "/admin/partners", label: "Registration", icon: MdAppRegistration },
] as const;

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 72;

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({
  path,
  label,
  icon: Icon,
  active,
  showLabel,
  onClick,
}: {
  path: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  showLabel: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={path}
      onClick={onClick}
      title={!showLabel ? label : undefined}
      className={[
        "relative flex items-center rounded-xl transition-colors duration-150 select-none",
        showLabel ? "gap-3 px-3 py-2.5" : "justify-center py-2.5",
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      ].join(" ")}
    >
      {!showLabel && active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-600" />
      )}

      <Icon
        size={22}
        className={[
          "flex-shrink-0",
          active ? "text-blue-600" : "text-gray-500",
        ].join(" ")}
      />

      {showLabel && (
        <span
          className={[
            "text-sm font-medium whitespace-nowrap",
            active ? "text-blue-600" : "",
          ].join(" ")}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

function SidebarContents({
  showLabels,
  isMobile,
  isPinned,
  pathname,
  onHeaderButtonClick,
  onNavClick,
  onLogout,
}: {
  showLabels: boolean;
  isMobile: boolean;
  isPinned: boolean;
  pathname: string;
  onHeaderButtonClick: () => void;
  onNavClick: () => void;
  onLogout: () => void;
}) {
  const isActive = (p: string) =>
    p === "/admin" ? pathname === "/admin" : pathname.startsWith(p);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-gray-100 shrink-0 ">
        <button
          onClick={onHeaderButtonClick}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0"
          aria-label={
            isMobile ? "Close menu" : isPinned ? "Unpin sidebar" : "Pin sidebar"
          }
        >
          {isMobile ? <MdClose size={26} /> : <MdMenu size={26} />}
        </button>

        {showLabels && (
          <div className="flex flex-col items-start gap-1.5 w-full">

            {/* Logo + App Name */}
            <div className="flex items-center gap-2 mt-1">
              <div className="relative w-12 h-12 rounded-xl ">
                <Image
                  src="/logo.png"
                  alt="logo"
                  fill
                  className="object-cover"
                />
                {/* Optional decorative ring */}
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-sm -z-10" />
              </div>

              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-gray-800 leading-tight">
                  GOCYN
                </span>
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider -mt-0.5">
                  Manage your Assets
                </span>
              </div>
            </div>

            {/* Divider + welcome line – adds premium feel */}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <li key={path}>
              <NavItem
                path={path}
                label={label}
                icon={icon}
                active={isActive(path)}
                showLabel={showLabels}
                onClick={onNavClick}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-gray-100 shrink-0">
        <button
          onClick={onLogout}
          title={!showLabels ? "Logout" : undefined}
          className={[
            "w-full flex items-center rounded-xl transition-colors duration-150",
            "text-gray-600 hover:bg-red-50 hover:text-red-600",
            showLabels ? "gap-3 px-3 py-2.5" : "justify-center py-2.5",
          ].join(" ")}
        >
          <MdLogout size={22} className="flex-shrink-0" />
          {showLabels && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const [pinned, setPinned] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Breakpoint detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setDrawerOpen(false);
    };
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Load pinned state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarPinned");
    if (saved !== null) setPinned(saved === "true");
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobile && drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, drawerOpen]);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarPinned", String(next));
      return next;
    });
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/admin/login");
  }, [router]);

  const handleNavClick = useCallback(() => {
    if (isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Desktop sidebar width (no hover, only pinned)
  const sidebarWidth = !isMobile && pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  // MOBILE
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed top-3 left-3 z-40 p-2 rounded-xl bg-white shadow-md border border-gray-200 text-gray-700 "
          aria-label="Open navigation menu"
        >
          <MdMenu size={22} />
        </button>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={[
            "fixed top-0 left-0 h-screen w-72 bg-white z-[60]",
            "flex flex-col shadow-2xl",
            "transform transition-transform duration-300 ease-in-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          aria-label="Mobile navigation"
        >
          <SidebarContents
            showLabels={true}
            isMobile={true}
            isPinned={false}
            pathname={pathname}
            onHeaderButtonClick={() => setDrawerOpen(false)}
            onNavClick={handleNavClick}
            onLogout={handleLogout}
          />
        </aside>
      </>
    );
  }

  // DESKTOP
  return (
    <>
      {/* Spacer – matches sidebar width so content doesn’t shift awkwardly */}
      <div
        aria-hidden="true"
        className="hidden lg:block flex-shrink-0 transition-[width] duration-300 ease-in-out "
        style={{ width: pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      />

      <aside
        style={{ width: sidebarWidth }}
        className={[
          "hidden lg:flex flex-col",
          "fixed top-0 left-0 h-screen",
          "bg-white border-r border-gray-200",
          "z-30 overflow-hidden",
          "transition-[width] duration-300 ease-in-out",
        ].join(" ")}
        aria-label="Desktop navigation"
      >
        <SidebarContents
          showLabels={pinned}
          isMobile={false}
          isPinned={pinned}
          pathname={pathname}
          onHeaderButtonClick={togglePin}
          onNavClick={handleNavClick}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}
