import type { Metadata } from "next";
import { Suspense } from "react";
import SearchContent from "./search/SearchContent";

export const metadata: Metadata = {
  title: "Search Courses and Instructors",
  description: "Search Gocyn courses, instructors, and mentors by name, topic, or skill.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
