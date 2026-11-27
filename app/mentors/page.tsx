import type { Metadata } from "next";
import { Suspense } from "react";
import SearchContent from "@/app/search/search/SearchContent";

const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Meet instructors and mentors",
  description: "Explore instructor profiles, learn about their experience, and find courses that match your goals.",
  alternates: { canonical: "/mentors" },
  openGraph: { type: "website", url: "/mentors", title: "Instructors and mentors | Gocyn", description: "Meet instructors, explore their experience, and find a course." },
};

async function getMentors() {
  if (!API) return [];
  try {
    const response = await fetch(`${API}/api/mentors/list/`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload) ? payload : Array.isArray(payload.mentors) ? payload.mentors : [];
  } catch {
    return [];
  }
}

export default async function Mentors() {
  const mentors = await getMentors();
  return (
    <Suspense
      fallback={
        <div role="status" className="flex min-h-[60vh] items-center justify-center bg-[#fcfcfc] px-4 text-sm text-slate-500">
          Loading mentors…
        </div>
      }
    >
      <SearchContent scope="mentor" initialCatalog={{ courses: [], mentors }} />
    </Suspense>
  );
}
