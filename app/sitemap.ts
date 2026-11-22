import type { MetadataRoute } from "next";

const SITE_URL = "https://www.gocyn.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

// Refresh dynamic entries hourly. The sitemap still renders its static entries
// when the API is unavailable or returns an unexpected payload.
export const revalidate = 3600;

type DynamicEntry = {
  slug: string;
  updatedAt?: string;
};

function extractEntries(payload: unknown): DynamicEntry[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? [
          (payload as { results?: unknown }).results,
          (payload as { data?: unknown }).data,
          (payload as { items?: unknown }).items,
        ].find(Array.isArray)
      : undefined;

  if (!Array.isArray(candidates)) return [];

  return candidates.flatMap((entry): DynamicEntry[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    if (!slug || slug.includes("/") || slug === "." || slug === "..") return [];

    const updatedAt =
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : typeof item.updated_at === "string"
          ? item.updated_at
          : undefined;

    return [{ slug, updatedAt }];
  });
}

async function fetchEntries(path: string): Promise<DynamicEntry[]> {
  if (!API_BASE) return [];

  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      next: { revalidate },
    });
    if (!response.ok) return [];
    return extractEntries(await response.json());
  } catch {
    // A transient API failure should not make the sitemap route fail.
    return [];
  }
}

function safeDate(value?: string): Date {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/internships`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/mentors`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/verify`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contactus`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [internships, mentors] = await Promise.all([
    fetchEntries("internships"),
    fetchEntries("mentors"),
  ]);

  return [
    ...staticRoutes,
    ...internships.map((entry) => ({
      url: `${SITE_URL}/internships/${encodeURIComponent(entry.slug)}`,
      lastModified: safeDate(entry.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...mentors.map((entry) => ({
      url: `${SITE_URL}/mentors/${encodeURIComponent(entry.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
