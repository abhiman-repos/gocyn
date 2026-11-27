import type { Metadata } from "next";
import InternshipDetail from "./InternshipDetailClient";

import { LEGACY_API_BASE } from "@/src/lib/apiBases";
const SITE_URL = "https://www.gocyn.com";
export const revalidate = 3600;

async function getInternship(id: string) {
  if (!LEGACY_API_BASE) return null;
  try {
    const response = await fetch(`${LEGACY_API_BASE}/upload/internship/${encodeURIComponent(id)}/`, { next: { revalidate } });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload && payload._id && payload.title ? payload : null;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const internship = await getInternship(id);
  if (!internship) {
    return { title: "Internship unavailable | Gocyn", robots: { index: false, follow: true } };
  }

  const title = String(internship.title);
  const company = internship.company ? ` at ${internship.company}` : "";
  const plainDescription = String(internship.description || `Explore the ${title} internship${company} on Gocyn.`)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const canonical = `/internship/${encodeURIComponent(id)}`;
  const image = internship.imageUrl || internship.image || internship.thumbnail_url;

  return {
    title: `${title}${company}`,
    description: plainDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${title}${company}`,
      description: plainDescription,
      siteName: "Gocyn",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title}${company}`,
      description: plainDescription,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function InternshipPage({ params }: Props) {
  const { id } = await params;
  const internship = await getInternship(id);
  return (
    <>
      {internship && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: internship.title,
              description: String(internship.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000),
              url: `${SITE_URL}/internship/${encodeURIComponent(id)}`,
              isPartOf: { "@type": "WebSite", name: "Gocyn", url: SITE_URL },
              ...(internship.created_at || internship.createdAt ? { datePublished: internship.created_at || internship.createdAt } : {}),
              ...(internship.updated_at || internship.updatedAt ? { dateModified: internship.updated_at || internship.updatedAt } : {}),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <InternshipDetail id={id} initialInternship={internship} />
    </>
  );
}
