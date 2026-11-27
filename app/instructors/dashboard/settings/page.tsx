"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { toast } from "react-hot-toast";
import {
  BookOpen,
  BriefcaseBusiness,
  Globe2,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import {
  fetchInstructorMe,
  type InstructorMe,
} from "@/src/components/libs/instructors";

const API = process.env.APP_URL;
type Profile = Omit<InstructorMe, "expertise"> & {
  expertise: string[] | string;
  current_role: string;
  company: string;
  social_profile: string;
  skills: string;
  bio: string;
  teaching_style: string;
  target_audience: string;
  weekly_availability: string;
  price_range: string;
  past_mentoring_exp: string;
  achievements: string;
  offering_type: string[] | string;
  preferred_language: string[] | string;
};
const listText = (value: string[]) => value.join(", ");
const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function makeCroppedFile(
  imageUrl: string,
  crop: Area,
  originalName: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const context = canvas.getContext("2d");
      if (!context)
        return reject(new Error("Could not prepare the cropped image."));
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
      canvas.toBlob(
        (blob) => {
          if (!blob)
            return reject(new Error("Could not prepare the cropped image."));
          const name = originalName.replace(/\.[^.]+$/, "") || "profile-photo";
          resolve(
            new File([blob], `${name}-cropped.jpg`, { type: "image/jpeg" }),
          );
        },
        "image/jpeg",
        0.9,
      );
    };
    image.onerror = () =>
      reject(new Error("Could not read the selected image."));
    image.src = imageUrl;
  });
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const token = () => localStorage.getItem("mentorToken") || "";

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const nextProfile = await fetchInstructorMe();
      setProfile(nextProfile as Profile);
      setSavedProfile(nextProfile as Profile);
    } catch (error: any) {
      toast.error(error.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const set = (key: keyof Profile, value: any) =>
    setProfile((current) => (current ? { ...current, [key]: value } : current));
  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png"]).has(file.type))
      return toast.error("Choose a JPG or PNG image.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Profile photos must be 5 MB or smaller.");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setPhoto(file);
    setRemovingPhoto(false);
    setCropOpen(true);
  };

  const confirmCrop = async () => {
    if (!photoPreviewUrl || !croppedAreaPixels || !photo)
      return toast.error("Adjust the crop before continuing.");
    setIsPreparingCrop(true);
    try {
      const cropped = await makeCroppedFile(
        photoPreviewUrl,
        croppedAreaPixels,
        photo.name,
      );
      if (cropped.size > 5 * 1024 * 1024)
        return toast.error(
          "The cropped image is larger than 5 MB. Zoom in and try again.",
        );
      setPhoto(cropped);
      setCropOpen(false);
      toast.success("Photo crop ready. Save your profile to upload it.");
    } catch (error: any) {
      toast.error(error.message || "Could not crop the selected image.");
    } finally {
      setIsPreparingCrop(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const prepared = {
      ...profile,
      expertise:
        typeof profile.expertise === "string"
          ? splitList(profile.expertise as any)
          : profile.expertise,
      offering_type:
        typeof profile.offering_type === "string"
          ? splitList(profile.offering_type as any)
          : profile.offering_type,
      preferred_language:
        typeof profile.preferred_language === "string"
          ? splitList(profile.preferred_language as any)
          : profile.preferred_language,
    };
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/instructors/me/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          current_role: profile.current_role,
          company: profile.company,
          years_of_experience: Number(profile.years_of_experience) || 0,
          social_profile: profile.social_profile,
          expertise: prepared.expertise,
          skills: profile.skills,
          bio: profile.bio,
          offering_type: prepared.offering_type,
          teaching_style: profile.teaching_style,
          target_audience: profile.target_audience,
          weekly_availability: profile.weekly_availability,
          price_range: profile.price_range,
          preferred_language: prepared.preferred_language,
          past_mentoring_exp: profile.past_mentoring_exp,
          achievements: profile.achievements,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.detail || data.error || "Could not save profile.");
      if (photo || removingPhoto) {
        if (photo) {
          setUploadProgress(0);
          await new Promise<void>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open("POST", `${API}/api/instructors/me/avatar/`);
            request.setRequestHeader("Authorization", `Bearer ${token()}`);
            request.upload.onprogress = (event) => {
              if (event.lengthComputable)
                setUploadProgress(
                  Math.round((event.loaded / event.total) * 100),
                );
            };
            request.onload = () => {
              let data: any = {};
              try {
                data = request.responseText
                  ? JSON.parse(request.responseText)
                  : {};
              } catch {
                /* handled as a generic server error */
              }
              if (request.status >= 200 && request.status < 300) resolve();
              else
                reject(
                  new Error(
                    data.detail ||
                      data.error ||
                      "Profile details saved, but the photo could not be uploaded.",
                  ),
                );
            };
            request.onerror = () =>
              reject(new Error("Network error while uploading the photo."));
            request.onabort = () =>
              reject(new Error("Photo upload was cancelled."));
            const form = new FormData();
            form.append("profilePhoto", photo);
            request.send(form);
          });
          setUploadProgress(100);
        } else {
          const avatarResponse = await fetch(
            `${API}/api/instructors/me/avatar/`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token()}` },
            },
          );
          if (!avatarResponse.ok) {
            const avatarData = await avatarResponse.json().catch(() => ({}));
            throw new Error(
              avatarData.detail ||
                avatarData.error ||
                "Profile details saved, but the photo could not be removed.",
            );
          }
        }
      }
      const updatedProfile = (await fetchInstructorMe()) as Profile;
      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setPhoto(null);
      setRemovingPhoto(false);
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (error: any) {
      toast.error(error.message || "Could not save profile.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (loading)
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-6">
        <div className="h-9 w-56 animate-pulse bg-gray-200" />
        <div className="h-48 animate-pulse bg-gray-200" />
        <div className="h-64 animate-pulse bg-gray-200" />
      </div>
    );
  if (!profile)
    return (
      <div className="mx-auto max-w-4xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">
          Your profile could not be loaded.
        </p>
        <button
          onClick={() => void load()}
          className="mt-3 bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );

  const display = (value: unknown) => {
    if (Array.isArray(value))
      return value.length ? value.join(", ") : "Not provided";
    if (typeof value === "string") return value.trim() || "Not provided";
    if (typeof value === "number")
      return value > 0 ? `${value} years` : "Not provided";
    return "Not provided";
  };
  const input = (label: string, key: keyof Profile, type = "text") => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={
          Array.isArray(profile[key])
            ? listText(profile[key] as string[])
            : String(profile[key] ?? "")
        }
        onChange={(e) =>
          set(
            key,
            ["expertise", "offering_type", "preferred_language"].includes(key)
              ? e.target.value
              : type === "number"
                ? Number(e.target.value)
                : e.target.value,
          )
        }
        className="mt-1.5 block w-full border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
      {["expertise", "offering_type", "preferred_language"].includes(key) && (
        <span className="mt-1 block text-xs font-normal text-gray-500">
          Separate values with commas.
        </span>
      )}
    </label>
  );
  const textarea = (label: string, key: keyof Profile, rows = 3) => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <textarea
        rows={rows}
        value={String(profile[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1.5 block w-full border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
  const field = (label: string, value: unknown) => (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 break-words whitespace-pre-wrap text-sm leading-6 text-gray-900">
        {display(value)}
      </dd>
    </div>
  );
  const cancelEdit = () => {
    if (savedProfile) setProfile({ ...savedProfile });
    setPhoto(null);
    setRemovingPhoto(false);
    setCropOpen(false);
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Instructor account
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            Your instructor profile
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your instructor information, update your details, and manage
            notification preferences.
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setProfile(savedProfile ? { ...savedProfile } : profile);
              setIsEditing(true);
            }}
            className="inline-flex items-center justify-center gap-2 border border-blue-700 bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Cancel editing
          </button>
        )}
      </header>

      {!isEditing ? (
        <>
          <section className="border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/70 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.full_name || "Instructor"} profile`}
                    className="h-24 w-24 shrink-0 border-4 border-white object-cover shadow"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center border-4 border-white bg-blue-100 text-3xl font-bold text-blue-800 shadow">
                    <UserRound className="h-10 w-10" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-950">
                      {profile.full_name || "Instructor profile"}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold capitalize ${profile.status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : profile.status === "suspended" || profile.status === "rejected" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                    >
                      <span className="h-1.5 w-1.5 bg-current" />
                      {profile.status}
                    </span>
                  </div>
                  <p className="mt-1 text-base text-gray-700">
                    {[profile.current_role, profile.company]
                      .filter(Boolean)
                      .join(" · ") || "Add a professional title and company"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-l border-blue-100 pl-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Profile score
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-800">
                    {profile.credential_score ?? 0}
                    <span className="text-sm font-medium text-gray-500">
                      /100
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {profile.review_note && (
              <div className="border-b border-gray-100 px-6 py-4 text-sm text-gray-700">
                <span className="font-semibold">Admin review note:</span>{" "}
                {profile.review_note}
              </div>
            )}
            <div className="grid gap-0 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="p-6">
                <SectionHeading
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  title="Professional profile"
                />
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {field("Professional title", profile.current_role)}
                  {field("Company", profile.company)}
                  {field("Experience", profile.years_of_experience)}
                  {field("Social profile", profile.social_profile)}
                </dl>
              </div>
              <div className="p-6">
                <SectionHeading
                  icon={<BookOpen className="h-4 w-4" />}
                  title="Expertise & teaching"
                />
                <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {field("Expertise", profile.expertise)}
                  {field("Skills", profile.skills)}
                  {field("Teaching style", profile.teaching_style)}
                  {field("Target audience", profile.target_audience)}
                </dl>
              </div>
            </div>
            <div className="border-t border-gray-100 p-6">
              <SectionHeading
                icon={<Globe2 className="h-4 w-4" />}
                title="Offerings & availability"
              />
              <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {field("Offerings", profile.offering_type)}
                {field("Languages", profile.preferred_language)}
                {field("Weekly availability", profile.weekly_availability)}
                {field("Price range", profile.price_range)}
              </dl>
            </div>
            <div className="grid gap-0 border-t border-gray-100 md:grid-cols-2 md:divide-x md:divide-gray-100">
              <div className="p-6">
                <SectionHeading
                  icon={<UserRound className="h-4 w-4" />}
                  title="About"
                />
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {profile.bio ||
                    "Add a short professional bio to help learners understand your background."}
                </p>
              </div>
              <div className="space-y-6 border-t border-gray-100 p-6 md:border-t-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Past mentoring experience
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {profile.past_mentoring_exp || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Achievements
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {profile.achievements || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <section className="space-y-5 border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Profile photo
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload a JPG or PNG up to 5 MB. You can crop it before saving.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {(photoPreviewUrl || profile.avatar_url) && !removingPhoto ? (
                <img
                  src={photoPreviewUrl || profile.avatar_url || undefined}
                  alt="Profile preview"
                  className="h-20 w-20 border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center border border-gray-200 bg-gray-100 text-2xl font-bold text-gray-500">
                  {profile.full_name?.[0] || "I"}
                </div>
              )}
              <label className="cursor-pointer border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {photo ? "Choose another photo" : "Choose photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={choosePhoto}
                  className="sr-only"
                />
              </label>
              {profile.has_avatar && !removingPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setRemovingPhoto(true);
                  }}
                  className="px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Remove photo
                </button>
              )}
              {photo && (
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  className="px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Adjust crop
                </button>
              )}
              {photo && (
                <span className="text-sm text-gray-500">
                  {photo.name} ready to upload
                </span>
              )}
            </div>
            {uploadProgress !== null && (
              <div className="max-w-xl" aria-live="polite">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    Uploading profile photo…
                  </span>
                  <span className="tabular-nums text-gray-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden bg-gray-200"
                  role="progressbar"
                  aria-label="Profile photo upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uploadProgress}
                >
                  <div
                    className="h-full bg-blue-600 transition-[width] duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </section>
          <section className="grid gap-4 border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="text-lg font-semibold text-gray-950">
                Personal & professional details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Email and phone are verified account details and can’t be
                changed here.
              </p>
            </div>
            {input("Display name", "full_name")}
            {input("Professional title", "current_role")}
            {input("Company", "company")}
            {input("Years of experience", "years_of_experience", "number")}
            {input("Social profile URL", "social_profile", "url")}
            {input("Expertise (comma separated)", "expertise")}
            {input("Offerings (comma separated)", "offering_type")}
            {input("Languages (comma separated)", "preferred_language")}
            {textarea("Skills", "skills")}
            {textarea("Bio", "bio", 5)}
            {textarea("Teaching style", "teaching_style")}
            {textarea("Target audience", "target_audience")}
            {textarea("Weekly availability", "weekly_availability")}
            {input("Price range", "price_range")}
            {textarea("Past mentoring experience", "past_mentoring_exp")}
            {textarea("Achievements", "achievements")}
          </section>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || cropOpen}
              className="inline-flex items-center justify-center gap-2 bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {uploadProgress !== null
                ? `Uploading photo ${uploadProgress}%…`
                : saving
                  ? "Saving profile…"
                  : "Save changes"}
            </button>
          </div>
          {cropOpen && photoPreviewUrl && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="crop-photo-title"
            >
              <section className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
                <header className="border-b p-5">
                  <h2
                    id="crop-photo-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Adjust your profile photo
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Drag to position the photo and use the slider to zoom.
                  </p>
                </header>
                <div className="relative h-[min(60vh,420px)] min-h-64 bg-slate-950">
                  <Cropper
                    image={photoPreviewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, areaPixels) =>
                      setCroppedAreaPixels(areaPixels)
                    }
                  />
                </div>
                <div className="space-y-4 p-5">
                  <label className="block text-sm font-medium text-gray-700">
                    Zoom{" "}
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="mt-2 block w-full accent-blue-600"
                    />
                  </label>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCropOpen(false);
                        setPhoto(null);
                        setCroppedAreaPixels(null);
                      }}
                      disabled={isPreparingCrop}
                      className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void confirmCrop()}
                      disabled={isPreparingCrop || !croppedAreaPixels}
                      className="bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isPreparingCrop ? "Preparing crop…" : "Use this crop"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-800">
      {" "}
      <span className="text-blue-700">{icon}</span>
      {title}
    </h3>
  );
}
