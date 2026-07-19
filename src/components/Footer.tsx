"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const pathname = usePathname();

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
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Section */}
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

            {/* Social Icons */}
            <div className="flex gap-4 mt-8">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <FaTwitter size={22} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
              >
                <FaLinkedin size={22} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all"
              >
                <FaInstagram size={22} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {/* Platform */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">Platform</h4>
              <ul className="space-y-3 text-[15px] text-gray-600">
                <li><Link href="/internships" className="hover:text-blue-600 transition-colors">All Internships</Link></li>
                <li><Link href="/mentors" className="hover:text-blue-600 transition-colors">Our Mentors</Link></li>
                <li><Link href="/verify" className="hover:text-blue-600 transition-colors">Verify Certificate</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">Company</h4>
              <ul className="space-y-3 text-[15px] text-gray-600">
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="/contactus" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="/auth/terms-and-conditions" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Legal / Resources */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-5 text-sm tracking-widest uppercase">Resources</h4>
              <ul className="space-y-3 text-[15px] text-gray-600">
                <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>
            © 2026 <span className="font-medium text-gray-700">Gocyn</span>. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 mt-4 md:mt-0 text-xs">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/auth/terms-and-conditions" className="hover:text-gray-700 transition-colors">Terms</Link>
            <span>Made with ❤️ for future leaders</span>
          </div>
        </div>
      </div>
    </footer>
  );
}