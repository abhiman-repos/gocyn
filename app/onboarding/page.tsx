"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Cropper, { Area } from "react-easy-crop";
import {
  User,
  GraduationCap,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  Camera,
  Phone,
  Building2,
  BookOpen,
  Hash,
  Calendar,
  Home,
  Map,
  Sparkles,
  Target,
  Link2,
  Image as ImageIcon,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

// ==========================================================
// Types & constants
// ==========================================================
interface ProfileData {
  avatar_url: string;
  gender: string;
  contact_no: string;
  college: string;
  course: string;
  branch: string;
  graduation_year: string;
  education: string;
  current_address: string;
  state: string;
  city: string;
  skills: string[];
  career_interests: string[];
  social_media: string;
}

const INITIAL: ProfileData = {
  avatar_url: "",
  gender: "",
  contact_no: "",
  college: "",
  course: "",
  branch: "",
  graduation_year: "",
  education: "",
  current_address: "",
  state: "",
  city: "",
  skills: [],
  career_interests: [],
  social_media: "",
};

const STEPS = [
  { id: 1, title: "Personal", icon: User, subtitle: "Tell us about yourself" },
  {
    id: 2,
    title: "Education",
    icon: GraduationCap,
    subtitle: "Your academic background",
  },
  { id: 3, title: "Location", icon: MapPin, subtitle: "Where you're based" },
  {
    id: 4,
    title: "Professional",
    icon: Briefcase,
    subtitle: "Skills & career interests",
  },
];

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
  "Other",
];
const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 15 }, (_, i) =>
  String(CURRENT_YEAR - 5 + i)
);

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

const POPULAR_COLLEGES = [
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "NIT Trichy",
  "NIT Warangal",
  "BITS Pilani",
  "Delhi University",
  "Jawaharlal Nehru University",
  "VIT Vellore",
  "SRM University",
  "Amity University",
  "Other",
];

const POPULAR_COURSES = [
  "B.Tech",
  "B.E",
  "B.Sc",
  "B.Com",
  "BBA",
  "BCA",
  "M.Tech",
  "MBA",
  "M.Sc",
  "MCA",
  "PhD",
  "Diploma",
  "Other",
];

const POPULAR_BRANCHES = [
  "Computer Science",
  "CSE",
  "IT",
  "Electronics",
  "ECE",
  "Mechanical",
  "Civil",
  "Electrical",
  "Chemical",
  "Biotechnology",
  "Data Science",
  "AI & ML",
  "Other",
];

const SKILL_SUGGESTIONS = [
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "Machine Learning",
  "Django",
  "Figma",
  "Marketing",
  "Writing",
  "TypeScript",
  "Java",
  "C++",
  "AWS",
  "Docker",
];

const INTEREST_SUGGESTIONS = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "UI/UX Design",
  "Marketing",
  "Consulting",
  "Entrepreneurship",
  "DevOps",
  "Cybersecurity",
  "Finance",
];

// ==========================================================
// Crop helpers → returns File (same as Edit Profile)
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
function Field({
  label,
  hint,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {Icon && (
          <Icon size={16} className="text-blue-600 dark:text-blue-400" />
        )}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors ${className}`}
    />
  );
}

function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors appearance-none ${className}`}
    >
      {children}
    </select>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
  suggestions = [],
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const unused = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[52px] w-full border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1 text-sm font-medium border border-blue-200 dark:border-blue-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="hover:bg-blue-100 dark:hover:bg-blue-900/60 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && add(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
        />
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unused.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 border border-slate-300 dark:border-zinc-600 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
            >
              <Plus size={12} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================================
// Onboarding Page
// ==========================================================
export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProfileData>(INITIAL);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Cropper
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropping, setCropping] = useState(false);

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;

    const checkProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const res = await fetch(`${API}/api/auth/me/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/");
          return;
        }

        if (!res.ok) {
          throw new Error("Unable to fetch profile");
        }

        const result = await res.json();

        if (cancelled) return;

        // Already completed onboarding
        if (
          result.profile_completed !== null &&
          result.profile_completed !== undefined
        ) {
          router.replace("/");
          return;
        }

        // Incomplete profile: populate existing information
        const existing = result.profile ?? {};

        setData((prev) => {
          const merged = { ...prev };
          (Object.keys(INITIAL) as (keyof ProfileData)[]).forEach((key) => {
            const value = existing[key];
            if (value !== undefined && value !== null) {
              (merged as any)[key] = value;
            }
          });
          return merged;
        });
      } catch (error) {
        console.error("Onboarding profile check failed:", error);
        if (!cancelled) {
          setError("Unable to load your profile. Please refresh.");
        }
      }
    };

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ================= AVATAR =================
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        set("avatar_url", previewUrl);
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

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!data.gender) return "Please select your gender";
      if (!data.contact_no.trim()) return "Contact number is required";
      if (!/^\+?[\d\s\-()]{7,20}$/.test(data.contact_no.trim()))
        return "Please enter a valid contact number";
    }
    if (s === 2) {
      if (!data.college.trim()) return "College / institution is required";
      if (!data.course.trim()) return "Course is required";
    }
    if (s === 3) {
      if (!data.state.trim()) return "State is required";
      if (!data.city.trim()) return "City is required";
    }
    if (s === 4) {
      if (data.skills.length === 0) return "Add at least one skill";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    if (step < STEPS.length) setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    if (step > 1) setStep(step - 1);
  };

  // ================= SUBMIT with FormData (same as Edit Profile) =================
  const handleSubmit = async () => {
    for (let i = 1; i <= STEPS.length; i++) {
      const err = validateStep(i);
      if (err) {
        setStep(i);
        setError(err);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in again.");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append("gender", data.gender || "");
      formData.append("contact_no", data.contact_no || "");
      formData.append("college", data.college || "");
      formData.append("course", data.course || "");
      formData.append("branch", data.branch || "");
      formData.append("graduation_year", data.graduation_year || "");
      formData.append("education", data.education || "");
      formData.append("current_address", data.current_address || "");
      formData.append("state", data.state || "");
      formData.append("city", data.city || "");
      formData.append("social_media", data.social_media || "");
      formData.append("skills", JSON.stringify(data.skills || []));
      formData.append(
        "career_interests",
        JSON.stringify(data.career_interests || [])
      );

      // Same field name as working Edit Profile
      if (avatarFile) {
        formData.append("avatar_url", avatarFile, avatarFile.name);
      }

      const res = await fetch(`${API}/api/auth/me/`, {
        method: "POST", // or "PATCH" if your onboarding endpoint uses PATCH
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type – browser sets multipart boundary
        },
        body: formData,
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          resData.error || resData.detail || "Failed to save profile"
        );
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-10 text-center"
        >
          <div className="w-16 h-16 mx-auto bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Profile Complete
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Redirecting to dashboard...
          </p>
          <div className="mt-8 flex justify-center items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <Loader2 className="animate-spin h-4 w-4" />
            <span>Please wait</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step {step} of {STEPS.length}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                {STEPS[step - 1].title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {STEPS[step - 1].subtitle}
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {Math.round(progressPct)}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800">
            <motion.div
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-blue-600"
            />
          </div>

          <div className="mt-6 flex items-center">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isCompleted = s.id < step;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
                    <div
                      className={`w-9 h-9 flex items-center justify-center border transition-colors ${
                        isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : isActive
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : isCompleted
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-1 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : "bg-slate-200 dark:bg-zinc-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 p-6 sm:p-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 flex items-center gap-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3.5 text-sm text-red-700 dark:text-red-400"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <Field
                    label="Profile Photo"
                    icon={ImageIcon}
                    hint="Upload a clear photo. You can crop it to fit the circle."
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 overflow-hidden border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                          {data.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={data.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={32} className="text-slate-400" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 text-white flex items-center justify-center border border-blue-700 hover:bg-blue-700 transition-colors"
                        >
                          <Camera size={16} />
                        </button>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {data.avatar_url
                            ? "Photo ready. Click camera icon to change."
                            : "Add a profile photo (optional)"}
                        </p>
                        {data.avatar_url && (
                          <button
                            type="button"
                            onClick={() => {
                              set("avatar_url", "");
                              setAvatarFile(null);
                            }}
                            className="mt-1 text-xs font-medium text-red-500 hover:text-red-600"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </Field>

                  <Field label="Gender" required icon={User}>
                    <Select
                      value={data.gender}
                      onChange={(e) => set("gender", e.target.value)}
                    >
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Contact Number" required icon={Phone}>
                    <TextInput
                      type="tel"
                      value={data.contact_no}
                      onChange={(e) => set("contact_no", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <Field
                    label="College / Institution"
                    required
                    icon={Building2}
                  >
                    <TextInput
                      value={data.college}
                      onChange={(e) => set("college", e.target.value)}
                      placeholder="Type or select from suggestions"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {POPULAR_COLLEGES.filter((c) => c !== data.college)
                        .slice(0, 6)
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => set("college", c)}
                            className="text-xs border border-slate-300 dark:border-zinc-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  </Field>

                  <Field label="Course" required icon={BookOpen}>
                    <TextInput
                      value={data.course}
                      onChange={(e) => set("course", e.target.value)}
                      placeholder="e.g. B.Tech Computer Science"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {POPULAR_COURSES.filter((c) => !data.course.includes(c))
                        .slice(0, 7)
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => set("course", c)}
                            className="text-xs border border-slate-300 dark:border-zinc-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Branch / Specialisation" icon={Hash}>
                      <TextInput
                        value={data.branch}
                        onChange={(e) => set("branch", e.target.value)}
                        placeholder="e.g. CSE"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {POPULAR_BRANCHES.filter((b) => b !== data.branch)
                          .slice(0, 5)
                          .map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => set("branch", b)}
                              className="text-xs border border-slate-300 dark:border-zinc-600 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                              {b}
                            </button>
                          ))}
                      </div>
                    </Field>

                    <Field label="Graduation Year" icon={Calendar}>
                      <Select
                        value={data.graduation_year}
                        onChange={(e) =>
                          set("graduation_year", e.target.value)
                        }
                      >
                        <option value="">Select year</option>
                        {GRADUATION_YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Highest Education" icon={GraduationCap}>
                    <Select
                      value={data.education}
                      onChange={(e) => set("education", e.target.value)}
                    >
                      <option value="">Select level</option>
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <Field label="Current Address" icon={Home} hint="Optional">
                    <TextInput
                      value={data.current_address}
                      onChange={(e) => set("current_address", e.target.value)}
                      placeholder="House / Flat, Street, Area"
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="State" required icon={Map}>
                      <Select
                        value={data.state}
                        onChange={(e) => set("state", e.target.value)}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="City" required icon={MapPin}>
                      <TextInput
                        value={data.city}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="e.g. Jabalpur, Bengaluru"
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <>
                  <Field
                    label="Skills"
                    required
                    icon={Sparkles}
                    hint="Press Enter or comma to add. At least one required."
                  >
                    <TagInput
                      value={data.skills}
                      onChange={(v) => set("skills", v)}
                      placeholder="Type a skill and press Enter"
                      suggestions={SKILL_SUGGESTIONS}
                    />
                  </Field>

                  <Field
                    label="Career Interests"
                    icon={Target}
                    hint="What roles are you targeting?"
                  >
                    <TagInput
                      value={data.career_interests}
                      onChange={(v) => set("career_interests", v)}
                      placeholder="Type an interest and press Enter"
                      suggestions={INTEREST_SUGGESTIONS}
                    />
                  </Field>

                  <Field
                    label="Social / Portfolio URL"
                    icon={Link2}
                    hint="LinkedIn, GitHub, personal site"
                  >
                    <TextInput
                      type="url"
                      value={data.social_media}
                      onChange={(e) => set("social_media", e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </Field>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-zinc-600 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <button
              type="button"
              onClick={step === STEPS.length ? handleSubmit : handleNext}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : step === STEPS.length ? (
                <>
                  Complete Profile
                  <Check size={18} />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          All data is processed as per our{" "}
          <a href="/privacy-policy" className="underline hover:text-blue-600">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropper && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Adjust Photo
                </h3>
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative w-full h-72 sm:h-80 bg-slate-100 dark:bg-zinc-950">
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
                    <label className="text-xs font-medium text-slate-500">
                      Zoom
                    </label>
                    <span className="text-xs text-slate-400">
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
                    className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelCrop}
                    disabled={cropping}
                    className="flex-1 border border-slate-300 dark:border-zinc-600 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCrop}
                    disabled={cropping}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {cropping ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      "Save Photo"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}