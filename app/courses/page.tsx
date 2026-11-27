import type { Metadata } from "next";
import { Suspense } from "react";
import SearchContent from "@/app/search/search/SearchContent";

const SITE_URL = "https://www.gocyn.com";
const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Online courses for skills that matter",
  description: "Explore online courses on Gocyn. Find a subject, learn from an instructor, and build skills you can put into practice.",
  alternates: { canonical: "/courses" },
  openGraph: { type: "website", url: "/courses", title: "Online courses | Gocyn", description: "Find a subject, learn from an instructor, and build practical skills." },
};

async function getCourseList() {
  if (!API) return [];
  try {
    const response = await fetch(`${API}/api/courses/list/`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.courses || payload.results || payload.data?.courses || [];
    return Array.isArray(rows) ? rows.filter((course: any) => course && (course.id || course._id) && course.title && course.description) : [];
  } catch {
    return [];
  }
}

export default async function CoursesList() {
  const courses = await getCourseList();
  const itemList = courses.length >= 3 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Online courses on Gocyn",
    itemListElement: courses.map((course: any, index: number) => {
      const id = String(course.id || course._id);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/course/${encodeURIComponent(id)}`,
        item: {
          "@type": "Course",
          name: course.title,
          description: String(course.description).replace(/\s+/g, " ").slice(0, 500),
          provider: { "@type": "Organization", name: "Gocyn", sameAs: SITE_URL },
          ...(course.published_at || course.publishedAt ? { datePublished: course.published_at || course.publishedAt } : {}),
          ...(course.updated_at || course.updatedAt ? { dateModified: course.updated_at || course.updatedAt } : {}),
          ...(course.instructor ? { instructor: { "@type": "Person", name: course.instructor } } : {}),
        },
      };
    }),
  } : null;

  return (
    <>
    {itemList && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />}
    <Suspense
      fallback={
        <div role="status" className="flex min-h-[60vh] items-center justify-center bg-[#fcfcfc] px-4 text-sm text-slate-500">
          Loading courses…
        </div>
      }
    >
      <SearchContent scope="course" initialCatalog={{ courses, mentors: [] }} />
    </Suspense>
    </>
  );
}
