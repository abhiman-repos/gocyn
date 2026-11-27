import type { Metadata } from "next";
import InternshipPage from "./InternshipsClient";

import { LEGACY_API_BASE } from "@/src/lib/apiBases";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Internships to build real experience",
  description: "Explore current internship opportunities on Gocyn. Review the role, company, skills, location, and stipend before applying.",
  alternates: { canonical: "/internships" },
  openGraph: {
    type: "website",
    url: "/internships",
    title: "Internships | Gocyn",
    description: "Explore internship opportunities and build practical experience.",
  },
};

async function getInternships(): Promise<any[]> {
    if (!LEGACY_API_BASE) return [];
  try {
    const response = await fetch(`${LEGACY_API_BASE}/upload/internships/list/`, { next: { revalidate } });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload) ? payload.filter((item) => item && item._id && item.title) : [];
  } catch {
    return [];
  }
}

export default async function InternshipsPage() {
  const internships = await getInternships();
  return <InternshipPage initialInternships={internships} />;
}
