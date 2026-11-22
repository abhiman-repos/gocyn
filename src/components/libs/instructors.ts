// lib/instructor.ts
export type InstructorStatus = "pending" | "approved" | "rejected" | "suspended";

export interface InstructorMe {
  full_name: string;
  email: string;
  phone: string;
  status: InstructorStatus;
  review_note: string;
  reviewed_at: string | null;
  submitted_at: string;
  credential_score: number;
  avatar_url: string | null;
  has_avatar: boolean;
  years_of_experience: number;
  expertise: string[];
  // ... any other fields you want to read
}

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

export async function fetchInstructorMe(): Promise<InstructorMe> {
  const token = localStorage.getItem("mentorToken");
  if (!token) throw new AuthError();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/instructors/me/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (res.status === 401) throw new AuthError();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || data.message || "Failed to load profile.");
  }
  return res.json();
}

export function clearInstructorSession() {
  localStorage.removeItem("mentorToken");
  localStorage.removeItem("mentorEmail");
}