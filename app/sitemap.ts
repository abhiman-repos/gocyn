import type { MetadataRoute } from "next";

const SITE_URL = "https://www.gocyn.com";
import { APP_API_BASE, LEGACY_API_BASE } from "@/src/lib/apiBases";
const API_BASE = APP_API_BASE;

// Refresh dynamic entries hourly. The sitemap still renders its static entries
// when the API is unavailable or returns an unexpected payload.
export const revalidate = 3600;

type DynamicEntry = {
  slug: string;
  updatedAt?: string;
};

function extractEntries(payload: unknown, collectionKey?: string): DynamicEntry[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? [
          collectionKey ? (payload as Record<string, unknown>)[collectionKey] : undefined,
          (payload as { results?: unknown }).results,
          (payload as { data?: unknown }).data,
          (payload as { items?: unknown }).items,
        ].find(Array.isArray)
      : undefined;

  if (!Array.isArray(candidates)) return [];

  return candidates.flatMap((entry): DynamicEntry[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const rawIdentifier = item.slug ?? item.id ?? item._id ?? item.uuid;
    const slug = typeof rawIdentifier === "string" || typeof rawIdentifier === "number" ? String(rawIdentifier).trim() : "";
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

async function fetchEntries(path: string, collectionKey?: string, base = API_BASE): Promise<DynamicEntry[]> {
  if (!base) return [];

  try {
    const endpoint = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
    const response = await fetch(endpoint, {
      next: { revalidate },
    });
    if (!response.ok) return [];
    return extractEntries(await response.json(), collectionKey);
  } catch {
    // A transient API failure should not make the sitemap route fail.
    return [];
  }
}

function safeDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/internships`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/mentors`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/verify`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contactus`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [internships, mentors] = await Promise.all([
    fetchEntries("/upload/internships/list/", undefined, LEGACY_API_BASE),
    fetchEntries("/api/mentors/list/", "mentors"),
  ]);
  const courses = await fetchEntries("/api/courses/list/", "courses");

  return [
    ...staticRoutes,
    ...internships.map((entry) => ({
      url: `${SITE_URL}/internship/${encodeURIComponent(entry.slug)}`,
      ...(safeDate(entry.updatedAt) ? { lastModified: safeDate(entry.updatedAt) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...mentors.map((entry) => ({
      url: `${SITE_URL}/instructors/${encodeURIComponent(entry.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...courses.map((entry) => ({
      url: `${SITE_URL}/course/${encodeURIComponent(entry.slug)}`,
      ...(safeDate(entry.updatedAt) ? { lastModified: safeDate(entry.updatedAt) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
