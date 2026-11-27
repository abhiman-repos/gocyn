import type { Metadata } from "next";
import CourseDetailClient from "./CourseDetailClient";

const SITE_URL = "https://www.gocyn.com";
const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
export const revalidate = 3600;

async function getCourse(id: string) {
  if (!API) return null;
  try {
    const response = await fetch(`${API}/api/courses/${encodeURIComponent(id)}/`, { next: { revalidate } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "Course unavailable | Gocyn", robots: { index: false, follow: true } };

  const title = course.title || "Online course";
  const description = String(course.description || `Explore ${course.title || "this course"} on Gocyn, taught by ${course.instructor || "an expert instructor"}.`).replace(/\s+/g, " ").slice(0, 180);
  const canonical = `/course/${encodeURIComponent(id)}`;
  const image = course.thumbnail_url || course.imageUrl || course.thumbnail;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, siteName: "Gocyn", ...(image ? { images: [{ url: image, alt: course.title || "Course thumbnail" }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
    robots: { index: course.status ? course.status === "published" : true, follow: true },
  };
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const course = await getCourse(id);
  const jsonLd = course?.title ? {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: String(course.description || `Explore ${course.title} on Gocyn.`).replace(/\s+/g, " ").slice(0, 1000),
    url: `${SITE_URL}/course/${encodeURIComponent(id)}`,
    provider: { "@type": "Organization", name: "Gocyn", sameAs: SITE_URL },
    ...(course.published_at || course.publishedAt ? { datePublished: course.published_at || course.publishedAt } : {}),
    ...(course.updated_at || course.updatedAt ? { dateModified: course.updated_at || course.updatedAt } : {}),
    ...(course.instructor ? { instructor: { "@type": "Person", name: course.instructor } } : {}),
    ...(course.category ? { educationalLevel: course.level, about: course.category } : {}),
    ...(course.price !== undefined ? { offers: { "@type": "Offer", price: String(Number(course.price) || 0), priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${SITE_URL}/course/${encodeURIComponent(id)}` } } : {}),
  } : null;

  return <>
    {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
    <CourseDetailClient id={id} initialCourse={course} />
  </>;
}
