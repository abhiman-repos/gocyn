"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
  ChangeEvent,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import Cropper, { Area } from "react-easy-crop";
import { Camera, User as UserIcon, X, Loader2 } from "lucide-react";

const API = process.env.APP_URL;

const fieldClass =
  "block w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const CAREER_SUGGESTIONS = [
  "Artificial Intelligence / ML",
  "Data Science",
  "Data Analytics",
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile App Development",
  "DevOps & Cloud",
  "Cybersecurity",
  "UI/UX Design",
  "Product Management",
  "Quality Assurance",
  "Blockchain / Web3",
  "Game Development",
  "Digital Marketing",
  "Business Analytics",
  "Technical Writing",
  "Research & Development",
  "Entrepreneurship",
];

const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "Git",
  "Docker",
  "AWS",
  "Figma",
];

type ProfileRecord = Record<string, unknown>;

function normalizeProfileResponse(data: ProfileRecord): ProfileRecord {
  const account = (
    data.user && typeof data.user === "object" ? data.user : data
  ) as ProfileRecord;
  const profile = (
    data.profile && typeof data.profile === "object"
      ? data.profile
      : account.profile && typeof account.profile === "object"
        ? account.profile
        : {}
  ) as ProfileRecord;

  return {
    ...account,
    profile,
    profile_completed:
      data.profile_completed !== undefined
        ? data.profile_completed
        : account.profile_completed ?? null,
    is_profile_completed:
      data.is_profile_completed ??
      (data.profile_completed !== undefined
        ? data.profile_completed !== null
        : account.profile_completed != null),
  };
}

/**
 * Normalizes any unknown value into a clean, deduplicated `string[]`.
 * Handles nested JSON-stringified arrays at any depth.
 */
function normalizeStringArray(value: unknown): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  };

  const walk = (input: unknown): void => {
    if (input == null) return;

    if (typeof input === "string") {
      let current: unknown = input;

      while (typeof current === "string") {
        const trimmed = current.trim();
        if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) break;
        try {
          const decoded = JSON.parse(trimmed);
          if (!Array.isArray(decoded)) break;
          current = decoded;
        } catch {
          break;
        }
      }

      if (typeof current === "string") {
        add(current);
        return;
      }
      walk(current);
      return;
    }

    if (Array.isArray(input)) {
      for (const item of input) walk(item);
      return;
    }

    if (typeof input === "number" || typeof input === "boolean") {
      add(String(input));
    }
  };

  walk(value);
  return result;
}

function extractError(data: unknown): string {
  if (!data) return "Request failed";
  if (typeof data === "string") return data;
  if (typeof data !== "object") return "Request failed";

  const record = data as ProfileRecord;
  if (record.detail) return String(record.detail);
  if (record.error) return String(record.error);

  const parts: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.length) {
      parts.push(`${key}: ${value.join(" ")}`);
    } else if (typeof value === "string" && value) {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.length ? parts.join("\n") : "Request failed";
}

// ==========================================================
// Crop helpers
// ==========================================================
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImgAsFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName = "avatar.jpg"
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rotRad = getRadianAngle(0);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    0
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return null;

  const outputSize = 512;
  croppedCanvas.width = outputSize;
  croppedCanvas.height = outputSize;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.88
    );
  });
}

// ==========================================================
// UI Helpers
// ==========================================================
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 py-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  hintId,
  full = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  hintId?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Professional rectangular tag box.
 *
 * Renders each value as an individual rectangular chip inside a fixed
 * rectangular container. `value` is normalized internally so that even
 * corrupted inputs like `'["TypeScript","React","Node.js"]'` are displayed
 * as three separate chips instead of one giant string.
 */
function TagInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
  describedBy,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  describedBy?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Render-time safety: even if a parent forgets to normalize, we do it here.
  const safeValue = useMemo(() => normalizeStringArray(value), [value]);
  const valueRef = useRef(safeValue);
  valueRef.current = safeValue;

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;

    const next = [...valueRef.current];
    for (const part of parts) {
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    if (next.length !== valueRef.current.length) onChange(next);
  };

  const remove = (tag: string) => {
    onChange(valueRef.current.filter((item) => item !== tag));
  };

  const flushDraft = () => {
    if (draft.trim()) {
      add(draft);
      setDraft("");
    }
  };

  const remainingSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          !safeValue.some(
            (item) => item.toLowerCase() === suggestion.toLowerCase()
          )
      ),
    [suggestions, safeValue]
  );

  const handleContainerClick = () => inputRef.current?.focus();

  return (
    <div>
      {/* Professional rectangular container */}
      <div
        onClick={handleContainerClick}
        className="flex min-h-[48px] w-full cursor-text flex-wrap items-center gap-2 border border-gray-300 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-100"
      >
        {safeValue.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
          >
            <span className="max-w-[16rem] truncate whitespace-nowrap">
              {tag}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                remove(tag);
              }}
              className="flex h-4 w-4 items-center justify-center text-blue-500 transition-colors hover:text-blue-900"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              if (event.key === "Enter" && !draft.trim()) return;
              event.preventDefault();
              add(draft);
              setDraft("");
            } else if (
              event.key === "Backspace" &&
              !draft &&
              valueRef.current.length
            ) {
              remove(valueRef.current[valueRef.current.length - 1]);
            }
          }}
          onBlur={flushDraft}
          aria-describedby={describedBy}
          placeholder={safeValue.length ? "" : placeholder || "Type and press Enter"}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Count indicator */}
      {safeValue.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          {safeValue.length}{" "}
          {safeValue.length === 1 ? "item" : "items"} added
        </p>
      )}

      {/* Suggestions */}
      {remainingSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {remainingSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                add(suggestion);
                inputRef.current?.focus();
              }}
              className="border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  full_name: "",
  avatar_url: "",
  contact_no: "",
  gender: "",
  college: "",
  course: "",
  branch: "",
  graduation_year: "",
  education: "",
  skills: [] as string[],
  current_address: "",
  state: "",
  city: "",
  career_interests: [] as string[],
  social_media: "",
};

function formFromUser(user: ProfileRecord) {
  const normalized = normalizeProfileResponse(user);
  const profile = (
    normalized.profile && typeof normalized.profile === "object"
      ? normalized.profile
      : {}
  ) as ProfileRecord;

  return {
    full_name: String(normalized.full_name ?? ""),
    avatar_url: String(profile.avatar_url ?? ""),
    contact_no: String(profile.contact_no ?? ""),
    gender: String(profile.gender ?? normalized.gender ?? ""),
    college: String(profile.college ?? normalized.college ?? ""),
    course: String(profile.course ?? normalized.course ?? ""),
    branch: String(profile.branch ?? normalized.branch ?? ""),
    graduation_year: String(
      profile.graduation_year ?? normalized.graduation_year ?? ""
    ),
    education: String(profile.education ?? normalized.education ?? ""),
    skills: normalizeStringArray(profile.skills ?? normalized.skills),
    current_address: String(
      profile.current_address ?? normalized.current_address ?? ""
    ),
    state: String(profile.state ?? normalized.state ?? ""),
    city: String(profile.city ?? normalized.city ?? ""),
    career_interests: normalizeStringArray(
      profile.career_interests ?? normalized.career_interests
    ),
    social_media: String(profile.social_media ?? normalized.social_media ?? ""),
  };
}

export default function EditProfile() {
  const { user, setUser, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [usingCached, setUsingCached] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serverProfileLoaded, setServerProfileLoaded] = useState(false);

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropping, setCropping] = useState(false);

  // ================= LOAD PROFILE =================
  const loadProfile = useCallback(async () => {
    setServerProfileLoaded(false);
    setFetching(true);
    setFetchError("");
    setUsingCached(false);

    if (!API) {
      setFetchError("API URL is not configured (APP_URL).");
      setFetching(false);
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setFetchError("Your session has expired. Please log in again.");
      setFetching(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/me/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        setFetchError("Your session has expired. Please log in again.");
        setFetching(false);
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || typeof data !== "object") {
        throw new Error(extractError(data) || "Failed to load your profile.");
      }

      const normalizedData = normalizeProfileResponse(data as ProfileRecord);
      setUser(normalizedData as never);
      localStorage.setItem("user", JSON.stringify(normalizedData));
      setForm(formFromUser(normalizedData));
      setAvatarFile(null);
      setServerProfileLoaded(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load your profile.";

      const cachedUser = localStorage.getItem("user");

      if (cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          setForm(formFromUser(parsed));
          setUsingCached(true);
          setFetchError(
            `${message} Showing cached data. Please reload to try again.`
          );
        } catch {
          setFetchError(message);
        }
      } else {
        setFetchError(message);
      }
    } finally {
      setFetching(false);
    }
  }, [setUser]);

  useEffect(() => {
    if (loading) return;
    void loadProfile();
  }, [loading, loadProfile]);

  // ================= AVATAR HANDLERS =================
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setError("Image must be smaller than 8 MB");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setError("");
      });
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setCropping(true);
    try {
      const file = await getCroppedImgAsFile(imageSrc, croppedAreaPixels);
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setForm((prev) => ({ ...prev, avatar_url: previewUrl }));
        setAvatarFile(file);
      }
      setShowCropper(false);
      setImageSrc(null);
    } catch {
      setError("Failed to process image. Please try another photo.");
    } finally {
      setCropping(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ================= SUBMIT (FormData) =================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fullName = form.full_name.trim();
    if (!fullName) {
      setError("Please enter your full name before saving.");
      return;
    }

    if (!API) {
      setError("API URL is not configured.");
      return;
    }

    if (!serverProfileLoaded) {
      setError("Please load your latest profile before updating.");
      return;
    }

    if (saving) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append("full_name", fullName);
      formData.append("contact_no", form.contact_no || "");
      formData.append("gender", form.gender || "");
      formData.append("college", form.college || "");
      formData.append("course", form.course || "");
      formData.append("branch", form.branch || "");
      formData.append("graduation_year", form.graduation_year || "");
      formData.append("education", form.education || "");
      formData.append("current_address", form.current_address || "");
      formData.append("state", form.state || "");
      formData.append("city", form.city || "");
      formData.append("social_media", form.social_media || "");

      // Defense-in-depth: send clean arrays only.
      formData.append(
        "skills",
        JSON.stringify(normalizeStringArray(form.skills))
      );
      formData.append(
        "career_interests",
        JSON.stringify(normalizeStringArray(form.career_interests))
      );

      if (avatarFile) {
        formData.append("avatar_url", avatarFile, avatarFile.name);
      }

      const updateResponse = await fetch(`${API}/api/auth/me/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        cache: "no-store",
      });

      const updateData = await updateResponse.json().catch(() => null);

      if (!updateResponse.ok) {
        throw new Error(
          extractError(updateData) || "Failed to update profile."
        );
      }

      const profileResponse = await fetch(`${API}/api/auth/me/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const latestData = await profileResponse.json().catch(() => null);

      if (
        !profileResponse.ok ||
        !latestData ||
        typeof latestData !== "object"
      ) {
        throw new Error(
          "Profile was updated, but refreshing the latest data failed. Please reload."
        );
      }

      const normalizedData = normalizeProfileResponse(latestData as ProfileRecord);
      setUser(normalizedData as never);
      localStorage.setItem("user", JSON.stringify(normalizedData));
      setForm(formFromUser(normalizedData));
      setAvatarFile(null);

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        router.replace("/profile");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= RENDER STATES =================
  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10 text-sm text-gray-500">
        Loading your profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-md border border-gray-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Couldn&apos;t load your profile
          </h1>
          <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
            {fetchError || "Please log in to edit your profile."}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Keep your personal, academic and contact details up to date.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              disabled={saving || fetching || !serverProfileLoaded}
              className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={saving || fetching || !serverProfileLoaded}
              className="border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {usingCached && fetchError && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <span className="whitespace-pre-line">{fetchError}</span>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              Reload
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 whitespace-pre-line border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-6 border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          {/* ================= PROFILE PHOTO ================= */}
          <Section title="Profile photo">
            <div className="md:col-span-2 flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={40} className="text-gray-400" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 text-white flex items-center justify-center border border-blue-700 hover:bg-blue-700"
                  aria-label="Change photo"
                >
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">
                  {form.avatar_url ? "Photo ready" : "No photo uploaded"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click the camera icon to upload or change your profile photo.
                  You can crop and zoom before saving.
                </p>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, avatar_url: "" }));
                      setAvatarFile(null);
                    }}
                    className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </Section>

          {/* ================= PERSONAL INFORMATION ================= */}
          <Section title="Personal information">
            <Field label="Full name" htmlFor="full_name">
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                maxLength={150}
                value={form.full_name}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Aarav Sharma"
              />
            </Field>

            <Field label="Phone number" htmlFor="contact_no">
              <input
                id="contact_no"
                name="contact_no"
                type="tel"
                autoComplete="tel"
                value={form.contact_no}
                onChange={handleChange}
                className={fieldClass}
                placeholder="+91 98765 43210"
              />
            </Field>

            <Field label="Gender" htmlFor="gender">
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>
          </Section>

          {/* ================= EDUCATION ================= */}
          <Section title="Education">
            <Field label="College / University" htmlFor="college">
              <input
                id="college"
                name="college"
                type="text"
                value={form.college}
                onChange={handleChange}
                className={fieldClass}
                placeholder="MANIT Bhopal"
              />
            </Field>

            <Field label="Course" htmlFor="course">
              <select
                id="course"
                name="course"
                value={form.course}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select course</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E.">B.E.</option>
                <option value="B.Sc">B.Sc</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MBA">MBA</option>
              </select>
            </Field>

            <Field label="Branch / Specialization" htmlFor="branch">
              <select
                id="branch"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">
                  Information Technology
                </option>
                <option value="Electronics">
                  Electronics &amp; Communication
                </option>
                <option value="Mechanical">Mechanical Engineering</option>
                <option value="Civil">Civil Engineering</option>
                <option value="Electrical">Electrical Engineering</option>
                <option value="AI & ML">AI &amp; Machine Learning</option>
                <option value="Data Science">Data Science</option>
              </select>
            </Field>

            <Field label="Expected graduation year" htmlFor="graduation_year">
              <select
                id="graduation_year"
                name="graduation_year"
                value={form.graduation_year}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select year</option>
                {Array.from({ length: 8 }, (_, i) => 2025 + i).map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Education details" htmlFor="education" full>
              <textarea
                id="education"
                name="education"
                rows={2}
                value={form.education}
                onChange={handleChange}
                className={fieldClass}
                placeholder="B.Tech in Computer Science, MANIT Bhopal (2023–2027)"
              />
            </Field>

            <Field
              label="Skills"
              htmlFor="skills"
              hint="Type a skill and press Enter or comma to add it. Click × to remove."
              hintId="skills-hint"
              full
            >
              <TagInput
                id="skills"
                value={form.skills}
                onChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
                placeholder="e.g. React, TypeScript, Node.js"
                suggestions={SKILL_SUGGESTIONS}
                describedBy="skills-hint"
              />
            </Field>
          </Section>

          {/* ================= LOCATION ================= */}
          <Section title="Location">
            <Field label="Current address" htmlFor="current_address" full>
              <textarea
                id="current_address"
                name="current_address"
                rows={3}
                value={form.current_address}
                onChange={handleChange}
                className={fieldClass}
                placeholder="House / street / area"
              />
            </Field>

            <Field label="City" htmlFor="city">
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Bhopal"
              />
            </Field>

            <Field label="State" htmlFor="state">
              <select
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Select state</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </Field>
          </Section>

          {/* ================= CAREER AND LINKS ================= */}
          <Section
            title="Career and links"
            description="Pick from common career paths or add your own."
          >
            <Field
              label="Career interests"
              htmlFor="career_interests"
              hint="Select a suggested career path or type your own and press Enter."
              hintId="career-interests-hint"
              full
            >
              <TagInput
                id="career_interests"
                value={form.career_interests}
                onChange={(career_interests) =>
                  setForm((prev) => ({ ...prev, career_interests }))
                }
                placeholder="e.g. Data Science, AI / ML"
                suggestions={CAREER_SUGGESTIONS}
                describedBy="career-interests-hint"
              />
            </Field>

            <Field label="LinkedIn profile" htmlFor="social_media" full>
              <input
                id="social_media"
                name="social_media"
                type="url"
                value={form.social_media}
                onChange={handleChange}
                className={fieldClass}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </Field>
          </Section>
        </form>
      </main>

      {/* ================= CROP MODAL ================= */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Adjust photo</h3>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="p-1.5 text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-72 sm:h-80 bg-gray-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
              />
            </div>

            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">
                    Zoom
                  </label>
                  <span className="text-xs text-gray-400">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={cropping}
                  className="flex-1 border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={cropping}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cropping ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    "Save photo"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
