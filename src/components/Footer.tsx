"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import {
  MessageCircleQuestion,
  ShieldCheck,
  BriefcaseBusiness,
  UsersRound,
  BadgeCheck,
  Sparkles,
  FileText,
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render footer during initial hydration
  if (!mounted) return null;

  const hideRoutes = [
    "/admin",
    "/register",
    "/login",
    "/courses",
    "/profile/setting",
    "/internships",
  ];

  const shouldHide =
    hideRoutes.includes(pathname) ||
    pathname.startsWith("/course/") ||
    pathname.startsWith("/mentors/") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/partner/") ||
    pathname === "/mentors";

  if (shouldHide) return null;

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold tracking-tighter">
                Go<span className="text-blue-600">cyn</span>
              </span>
            </div>

            <p className="text-gray-600 max-w-md text-[15px] leading-relaxed">
              Empowering the next generation of professionals through expert-led
              internships and industry-recognized certifications.
            </p>

            <div className="flex gap-3 mt-8">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 shadow-sm hover:text-black hover:border-gray-300 hover:shadow-md hover:-translate-y-1 rounded-xl transition-all duration-300"
              >
                <FaTwitter size={19} />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 shadow-sm hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md hover:-translate-y-1 rounded-xl transition-all duration-300"
              >
                <FaLinkedinIn size={19} />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white border border-gray-200 shadow-sm hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 hover:shadow-md hover:-translate-y-1 rounded-xl transition-all duration-300"
              >
                <FaInstagram size={19} />
              </a>
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">

            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">
                Platform
              </h4>

              <ul className="space-y-3 text-[15px] text-gray-600">
                <li>
                  <Link href="/internships" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    <BriefcaseBusiness size={16} />
                    All Internships
                  </Link>
                </li>

                <li>
                  <Link href="/mentors" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    <UsersRound size={16} />
                    Our Mentors
                  </Link>
                </li>

                <li>
                  <Link href="/verify" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    <BadgeCheck size={16} />
                    Verify Certificate
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">
                Company
              </h4>

              <ul className="space-y-3 text-[15px] text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-blue-600 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contactus" className="hover:text-blue-600 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="hover:text-blue-600 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">
                Resources
              </h4>

              <ul className="space-y-3 text-[15px] text-gray-600">
                <li>
                  <Link href="/faq" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    <MessageCircleQuestion size={16} />
                    FAQ
                  </Link>
                </li>

                <li>
                  <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                    <ShieldCheck size={16} />
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p className="text-center md:text-left">
            © 2026 <span className="font-semibold text-gray-800">Gocyn</span>.
            All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-3 text-xs">
            <Link
              href="/privacy-policy"
              className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              Privacy
            </Link>

            <Link
              href="/auth/terms-and-conditions"
              className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} />
              Terms
            </Link>

            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles size={14} />
              Empowering Future Professionals
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}