import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { cn } from "@/lib/utils";
import MentorPromoModal from "@/src/components/MentorPromo";
import { GoogleOAuthProvider } from "@react-oauth/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const inter = Inter({ subsets: ["latin"] });
const officialSocialProfiles = [
  process.env.NEXT_PUBLIC_GOCYN_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_GOCYN_YOUTUBE_URL,
  process.env.NEXT_PUBLIC_GOCYN_LINKEDIN_URL,
  process.env.NEXT_PUBLIC_GOCYN_FACEBOOK_URL,
].filter((url): url is string => Boolean(url));

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gocyn.com"),
  title: {
    default: "Gocyn — Explore more, Grow more!",
    template: "%s | Gocyn",
  },
  description:
    "Build practical skills with online courses, expert instructors, mentorship, internships, and certificates on Gocyn.",
  keywords: [
    "Gocyn",
    "online courses",
    "expert instructors",
    "online internships",
    "mentorship",
  ],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://www.gocyn.com",
    siteName: "Gocyn",
    title: "Gocyn — Explore more, Grow more!",
    description: "Build practical skills with online courses, expert instructors, mentorship, internships, and certificates on Gocyn.",
    images: [{ url: "/logo.png", alt: "Gocyn" }],
  },
  twitter: {
    card: "summary",
    title: "Gocyn — Explore more, Grow more!",
    description: "Build practical skills with online courses, expert instructors, mentorship, internships, and certificates on Gocyn.",
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.className} min-h-screen bg-[#F9FAFB] text-[#111827]`}
      >
        <GoogleOAuthProvider
          clientId={process.env.GOOGLE_CLIENT_ID!}
        >
          <AuthProvider>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>

            <main>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify([
                    {
                      "@context": "https://schema.org",
                      "@type": "Organization",
                      "@id": "https://www.gocyn.com/#organization",
                      name: "Gocyn",
                      alternateName: ["Gocyn Official", "Gocyn"],
                      url: "https://www.gocyn.com",
                      logo: "https://www.gocyn.com/logo.png",
                      description: "Online courses, instructors, mentorship, internships, and verifiable certificates.",
                      ...(officialSocialProfiles.length ? { sameAs: officialSocialProfiles } : {}),
                    },
                    {
                      "@context": "https://schema.org",
                      "@type": "WebSite",
                      "@id": "https://www.gocyn.com/#website",
                      url: "https://www.gocyn.com",
                      name: "Gocyn",
                      alternateName: "Gocyn Official",
                      publisher: { "@id": "https://www.gocyn.com/#organization" },
                    },
                  ]).replace(/</g, "\\u003c"),
                }}
              />
              {children}
              <Footer />
            </main>
            
            <MentorPromoModal />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
