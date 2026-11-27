"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import {
  Menu,
  Home,
  FolderKanban,
  Users,
  FileBadge,
  BarChart3,
  Settings,
  UserRound,
  ChevronDown,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Bell,
  LogOut,
  X,
  Megaphone,
} from "lucide-react";
import { Metadata } from "next";
import PartnerStatusGate from "@/src/components/libs/PartnerStatusGate";
import { clearInstructorSession } from "@/src/components/libs/instructors";
import InstructorNotificationBell from "@/src/components/notifications/InstructorNotificationBell";








const navigation = [
  {
    name: "Dashboard",
    href: "/instructors/dashboard",
    icon: Home,
  },
  {
    name: "Programs",
    href: "/instructors/dashboard/programs",
    icon: FolderKanban,
  },
  {
    name: "Enrollments",
    href: "/instructors/dashboard/enrollments",
    icon: Users,
  },
  {
    name: "Coupons",
    href: "/instructors/dashboard/coupons",
    icon: BarChart3,
  },
  {
    name: "Earnings",
    href: "/instructors/dashboard/earnings",
    icon: BarChart3,
  },
  {
    name: "Campaigns",
    href: "/instructors/dashboard/campaigns",
    icon: Megaphone,
  },
];

const settingsLinks = [
  { name: "Profile", href: "/instructors/dashboard/profile", icon: UserRound },
  { name: "Terms & Conditions", href: "/terms-and-conditions", icon: FileText },
  { name: "Privacy Policy", href: "/privacy-policy", icon: ShieldCheck },
  { name: "Help & Support", href: "/contactus", icon: LifeBuoy },
  { name: "Notifications", href: "/instructors/dashboard/notifications", icon: Bell },
];

const getHeaderContent = (pathname: string) => {
  switch (pathname) {
    case "/instructors/dashboard":
      return {
        title: "Welcome Back",
        description: "Manage your dashboard and analytics.",
      };

    case "/instructors/dashboard/programs":
      return {
        title: "Programs",
        description: "Manage your courses and internships.",
      };

    case "/instructors/dashboard/enrollments":
      return {
        title: "Enrollments",
        description: "Track student enrollments.",
      };

    case "/instructors/dashboard/certificates":
      return {
        title: "Certificates",
        description: "Manage certificates and verifications.",
      };

    case "/instructors/dashboard/earnings":
      return {
        title: "Earnings",
        description: "Monitor revenue and payouts.",
      };

    case "/instructors/dashboard/campaigns":
      return {
        title: "Sponsored Campaigns",
        description: "Promote published courses and track learner engagement.",
      };

    case "/instructors/dashboard/settings":
      return {
        title: "Profile & Settings",
        description: "View your instructor profile and manage account preferences.",
      };

    case "/instructors/dashboard/profile":
      return {
        title: "Instructor Profile",
        description: "Review and update your instructor profile.",
      };

    case "/instructors/dashboard/notifications":
      return {
        title: "Instructor Notifications",
        description: "Review course and account updates for your instructor account.",
      };

    default:
      return {
        title: "Dashboard",
        description: "Welcome to your dashboard.",
      };
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/instructors/dashboard/settings") || pathname.startsWith("/instructors/dashboard/profile") || pathname.startsWith("/instructors/dashboard/notifications"),
  );

  useEffect(() => {
    const saved = localStorage.getItem("instructors-sidebar");

    if (saved) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    const closeSettingsMenu = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeSettingsMenu);
    return () => document.removeEventListener("mousedown", closeSettingsMenu);
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;

    setCollapsed(newState);

    localStorage.setItem("instructors-sidebar", String(newState));
  };

  const { title, description } = getHeaderContent(pathname);
  const settingsActive = pathname.startsWith("/instructors/dashboard/settings") || pathname === "/instructors/dashboard/profile" || pathname.startsWith("/instructors/dashboard/notifications");

  return (
    <PartnerStatusGate>
    <div className="h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          border-r border-gray-200 dark:border-white/10
          bg-white dark:bg-[#0f0f0f]
          transition-all duration-300 ease-in-out
          
          ${collapsed ? "w-[80px]" : "w-[260px]"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
lg:translate-x-0
        `}
      >
        {/* TOP */}
        <div className="flex h-16 items-center gap-3 px-4">
          {/* MENU BUTTON */}
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) {
                toggleSidebar();
              } else {
                setSidebarOpen(false);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>

          {/* LOGO */}
          <Link
            href=""
            className={`flex items-center gap-2  transition-all ${
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            }`}
          >
            <div className="flex flex-col items-start gap-1.5 w-full">
              {/* Logo + App Name */}
              <div className="flex items-center gap-2 mt-1">
                <div className="relative w-12 h-12 rounded-xl -left-3">
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
                  <span className="text-[14px] font-black tracking-tight text-gray-800 leading-tight">
                    WELCOME BACK
                  </span>
                  <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider -mt-0.5">
                    Manage your Assets
                  </span>
                </div>
              </div>

              {/* Divider + welcome line – adds premium feel */}
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { setSidebarOpen(false); setSettingsOpen(false); }}
                className={`
                  group flex items-center gap-4
                   px-4 py-3
                  text-sm font-medium
                  transition-all
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  }
                `}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    active ? "text-white" : "text-gray-500 dark:text-gray-400"
                  }`}
                />

                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
          <div
            className="relative"
            ref={settingsMenuRef}
            onMouseEnter={() => {
              if (window.matchMedia("(hover: hover)").matches) setSettingsOpen(true);
            }}
            onMouseLeave={() => {
              if (window.matchMedia("(hover: hover)").matches) setSettingsOpen(false);
            }}
          >
            <button
              type="button"
              aria-expanded={settingsOpen}
              aria-controls="instructor-settings-submenu"
              onClick={() => setSettingsOpen((open) => !open)}
              className={`group flex w-full items-center gap-4 px-4 py-3 text-left text-sm font-medium transition-all ${
                settingsActive || settingsOpen
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              }`}
            >
              <Settings className={`h-5 w-5 flex-shrink-0 ${settingsActive || settingsOpen ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
              {!collapsed && <><span className="flex-1 truncate">Settings</span><ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} /></>}
            </button>
            {settingsOpen && (
              <div
                id="instructor-settings-submenu"
                className={`z-[60] mt-1 border border-gray-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#171717] ${
                  collapsed ? "absolute left-full top-0 ml-2 w-56" : "ml-4"
                }`}
              >
                {settingsLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* MOBILE CLOSE */}

        {/* LOGOUT */}
        <div className="absolute bottom-4 left-0 w-full px-3">
          <button
            onClick={() => {
              clearInstructorSession();
              router.replace("/instructors/login");
            }}
            className="
              flex w-full items-center gap-4
              rounded-2xl px-4 py-3
              text-red-500
              hover:bg-red-50
              dark:hover:bg-red-500/10
              transition-all
            "
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div
        className={`
          flex h-full flex-col transition-all duration-300
          ${collapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"}
        `}
      >
        {/* HEADER */}
        {/* HEADER */}
        <header
          className="
    sticky top-0 z-30
    relative flex h-16 items-center justify-center
    border-b border-gray-200 dark:border-white/10
    bg-white/90 dark:bg-[#0f0f0f]/90
    px-4 backdrop-blur-xl
  "
        >
          {/* Desktop Center Content */}
          <div className="hidden lg:flex flex-col items-center justify-center text-center">
            <h1
              className="
        text-lg font-bold tracking-tight
        text-gray-900 dark:text-white
      "
            >
              {title}
            </h1>

            <p
              className="
        text-sm text-gray-500 dark:text-gray-400
        max-w-xl truncate
      "
            >
              {description}
            </p>
          </div>

          <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 lg:block">
            {pathname !== "/instructors/dashboard/notifications" && <InstructorNotificationBell />}
          </div>

          {/* Mobile Layout */}
          <div className="flex w-full items-center justify-between lg:hidden">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="
        flex h-10 w-10 items-center justify-center
        rounded-full
        hover:bg-gray-100
        dark:hover:bg-white/10
        transition
      "
            >
              <Menu className="h-5 w-5 text-gray-700 dark:text-white" />
            </button>

            {/* Mobile Title */}
            <div className="flex-1 text-center px-2">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {description}
              </p>
            </div>

            <div className="flex w-10 justify-end">
              {pathname !== "/instructors/dashboard/notifications" && <InstructorNotificationBell />}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
       <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
    </PartnerStatusGate>
  );
}
