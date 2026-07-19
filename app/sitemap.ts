import { MetadataRoute } from "next";

const SITE_URL = "https://www.gocyn.com";

// TODO: replace with your real API base — this is a guess.
// If your backend is same-origin (Next.js API routes under app/api/),
// use a relative path instead, e.g. `${SITE_URL}/api/internships`.
const API_BASE = process.env.NEXT_PUBLIC_APP_URL;

// Regenerate the sitemap at most once an hour instead of only at build
// time. Internships/mentors change more often than a deploy — without
// this, anything added after your last build simply never appears in
// the sitemap until you redeploy.
export const revalidate = 3600;

type InternshipListItem = {
  slug: string;
  updatedAt?: string; // adjust to match your actual API response shape
};

type MentorListItem = {
  slug: string;
};

async function fetchInternships(): Promise<InternshipListItem[]> {
  try {
    const res = await fetch(`${API_BASE}/internships`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // If the backend is briefly down during a crawl, fail quiet — a
    // sitemap missing new internships for one cycle is far better than
    // a sitemap request that 500s and takes the static routes down
    // with it.
    return [];
  }
}

async function fetchMentors(): Promise<MentorListItem[]> {
  try {
    const res = await fetch(`${API_BASE}/mentors`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/internships`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/mentors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/verify`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contactus`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [internships, mentors] = await Promise.all([
    fetchInternships(),
    fetchMentors(),
  ]);

  const internshipRoutes: MetadataRoute.Sitemap = internships.map((i) => ({
    url: `${SITE_URL}/internships/${i.slug}`,
    lastModified: i.updatedAt ? new Date(i.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const mentorRoutes: MetadataRoute.Sitemap = mentors.map((m) => ({
    url: `${SITE_URL}/mentors/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...internshipRoutes, ...mentorRoutes];
}