import type { Metadata } from "next";
import InstructorProfileClient from "./InstructorProfileClient";

const SITE_URL = "https://www.gocyn.com";
const API = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
export const revalidate = 3600;

async function getInstructor(id: string) {
  if (!API) return null;
  try {
    const response = await fetch(
      `${API}/api/instructors/${encodeURIComponent(id)}/`,
      { next: { revalidate } },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getInstructor(id);
  if (!profile)
    return {
      title: "Instructor profile unavailable | Gocyn",
      robots: { index: false, follow: true },
    };

  const name = profile.name || "Gocyn instructor";
  const specialty = Array.isArray(profile.expertise)
    ? profile.expertise.join(", ")
    : profile.expertise ||
      profile.currentRole ||
      profile.company ||
      "Courses and mentorship";
  const title = `${name} — Instructor, ${String(specialty).slice(0, 80)}`;
  const description = String(
    profile.bio ||
      `${name} teaches ${specialty} on Gocyn. Explore instructor courses, experience, and expertise.`,
  )
    .replace(/\s+/g, " ")
    .slice(0, 180);
  const canonical = `/instructors/${encodeURIComponent(id)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      url: canonical,
      title,
      description,
      siteName: "Gocyn",
      ...(profile.imageUrl
        ? { images: [{ url: profile.imageUrl, alt: name }] }
        : {}),
    },
    twitter: {
      card: profile.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(profile.imageUrl ? { images: [profile.imageUrl] } : {}),
    },
    robots: {
      index: profile.status
        ? ["approved", "published", "active"].includes(
            String(profile.status).toLowerCase(),
          )
        : true,
      follow: true,
    },
  };
}

export default async function InstructorPage({ params }: Props) {
  const { id } = await params;
  const profile = await getInstructor(id);
  const jsonLd = profile
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: `${SITE_URL}/instructors/${encodeURIComponent(id)}`,
        ...(profile.updated_at || profile.updatedAt
          ? { dateModified: profile.updated_at || profile.updatedAt }
          : {}),
        mainEntity: {
          "@type": "Person",
          name: profile.name || "Gocyn instructor",
          identifier: id,
          worksFor: { "@type": "Organization", name: "Gocyn", url: SITE_URL },
          ...(profile.imageUrl ? { image: profile.imageUrl } : {}),
          ...(profile.bio
            ? {
                description: String(profile.bio)
                  .replace(/\s+/g, " ")
                  .slice(0, 1000),
              }
            : {}),
          ...(profile.currentRole ? { jobTitle: profile.currentRole } : {}),
          ...(profile.company
            ? {
                affiliation: { "@type": "Organization", name: profile.company },
              }
            : {}),
          ...(Array.isArray(profile.expertise)
            ? { knowsAbout: profile.expertise }
            : typeof profile.expertise === "string"
              ? {
                  knowsAbout: profile.expertise
                    .split(/[,\n]/)
                    .map((item: string) => item.trim())
                    .filter(Boolean),
                }
              : {}),
          ...(profile.socialProfile ? { sameAs: [profile.socialProfile] } : {}),
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <InstructorProfileClient id={id} initialProfile={profile} />
    </>
  );
}
