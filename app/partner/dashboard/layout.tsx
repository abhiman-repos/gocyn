"use client";

import { useEffect, useState } from "react";
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
  LogOut,
  X,
} from "lucide-react";
import { Metadata } from "next";








const navigation = [
  {
    name: "Overview",
    href: "/partner/dashboard",
    icon: Home,
  },
  {
    name: "Programs",
    href: "/partner/dashboard/programs",
    icon: FolderKanban,
  },
  {
    name: "Enrollments",
    href: "/partner/dashboard/enrollments",
    icon: Users,
  },
  {
    name: "Certificates",
    href: "/partner/dashboard/certificates",
    icon: FileBadge,
  },
  {
    name: "Earnings",
    href: "/partner/dashboard/earnings",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/partner/dashboard/settings",
    icon: Settings,
  },
];

const getHeaderContent = (pathname: string) => {
  switch (pathname) {
    case "/partner/dashboard":
      return {
        title: "Welcome Back",
        description: "Manage your dashboard and analytics.",
      };

    case "/partner/dashboard/programs":
      return {
        title: "Programs",
        description: "Manage your courses and internships.",
      };

    case "/partner/dashboard/enrollments":
      return {
        title: "Enrollments",
        description: "Track student enrollments.",
      };

    case "/partner/dashboard/certificates":
      return {
        title: "Certificates",
        description: "Manage certificates and verifications.",
      };

    case "/partner/dashboard/earnings":
      return {
        title: "Earnings",
        description: "Monitor revenue and payouts.",
      };

    case "/partner/dashboard/settings":
      return {
        title: "Settings",
        description: "Update preferences and account settings.",
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

  useEffect(() => {
    const saved = localStorage.getItem("partner-sidebar");

    if (saved) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;

    setCollapsed(newState);

    localStorage.setItem("partner-sidebar", String(newState));
  };

  const { title, description } = getHeaderContent(pathname);

  return (
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
                <div className="relative w-12 h-12 rounded-xl ">
                  <Image
                    src="/public/logo.png"
                    alt="logo"
                    fill
                    className="object-cover"
                  />
                  {/* Optional decorative ring */}
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-sm -z-10" />
                </div>

                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tight text-gray-800 leading-tight">
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
                onClick={() => setSidebarOpen(false)}
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
        </nav>

        {/* MOBILE CLOSE */}

        {/* LOGOUT */}
        <div className="absolute bottom-4 left-0 w-full px-3">
          <button
            onClick={() => router.push("/partner/login")}
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
    flex h-16 items-center justify-center
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

            {/* Spacer */}
            <div className="w-10" />
          </div>
        </header>

        {/* PAGE CONTENT */}

      </div>
    </div>
  );
}
