const normalizeBase = (value?: string) => value?.replace(/\/+$/, "") || "";

/** Main API for courses, instructor profiles, and platform accounts. */
export const APP_API_BASE = normalizeBase(
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL,
);

/** Legacy service for internship uploads and legacy certificate records. */
export const LEGACY_API_BASE = normalizeBase(
  process.env.NEXT_PUBLIC_LEGACY_API_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_URL,
);
