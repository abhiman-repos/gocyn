import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Gocyn",
  description:
    "Find answers to frequently asked questions about Gocyn internships, certifications, mentorship, and how to get started.",
  keywords: [
    "internship FAQ",
    "Gocyn questions",
    "certification verification",
    "student internship India",
  ],
  icons: {
    icon: "/icon.png",
  },
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
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <AuthProvider>
            <Navbar />

            <main>
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
