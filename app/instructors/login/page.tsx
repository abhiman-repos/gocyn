"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  GraduationCap,
  Rocket,
  Target,
  Workflow,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { FaHandsHelping, FaSuitcase } from "react-icons/fa";

type AuthMode = "signin" | "signup";

const API = process.env.NEXT_PUBLIC_APP_URL;

interface MentorSignupData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profilePhoto: File | null;
  currentRole: string;
  company: string;
  yearsOfExperience: string;
  expertise: string[];
  skills: string;
  socialmediaUrl: string;
  bio: string;
  offeringType: string[];
  teachingStyle: string;
  targetAudience: string;
  priceRange: string;
  weeklyAvailability: string;
  preferredLanguages: string[];
  pastMentoringExp: string;
  agreeToTerms: boolean;
  agreeToBackground: boolean;
}

type FieldProps = {
  label: string;
  required?: boolean;
  fieldKey?: string;
  children: React.ReactNode;
  error?: string;
};

/**
 * DRF returns validation errors as `{field: ["msg"], non_field_errors: ["msg"]}`
 * with no `message` key — the old `data.message || "Registration failed."`
 * pattern hid every field-level error. This helper surfaces them all.
 */
function extractErrorMessage(data: any, fallback = "Registration failed."): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return fallback;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return data.non_field_errors.join(" ");
  }

  const parts: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    if (field === "non_field_errors") continue;
    if (Array.isArray(value)) {
      parts.push(`${field}: ${value.join(" ")}`);
    } else if (typeof value === "string" && value.trim()) {
      parts.push(`${field}: ${value}`);
    }
  }
  return parts.length ? parts.join("\n") : fallback;
}

const Field = ({ label, required, children, error }: FieldProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-blue-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

const steps = [
  { id: 0, label: "01", title: "Identity" },
  { id: 1, label: "02", title: "Professional" },
  { id: 2, label: "03", title: "Offerings" },
  { id: 3, label: "04", title: "Review" },
];

const expertiseOptions = [
  "Frontend Dev",
  "Backend Dev",
  "Full Stack",
  "System Design",
  "Cloud / DevOps",
  "Data Science",
  "AI / ML",
  "Mobile Dev",
  "Product Management",
  "UI/UX Design",
  "Cybersecurity",
  "Blockchain",
  "Embedded Systems",
  "Open Source",
  "Entrepreneurship",
  "Career Coaching",
];

const languageOptions = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Other",
];

const defaultSignupData: MentorSignupData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  profilePhoto: null,
  currentRole: "",
  company: "",
  yearsOfExperience: "",
  expertise: [],
  skills: "",
  socialmediaUrl: "",
  bio: "",
  offeringType: [],
  teachingStyle: "",
  targetAudience: "",
  priceRange: "",
  weeklyAvailability: "",
  preferredLanguages: [],
  pastMentoringExp: "",
  agreeToTerms: false,
  agreeToBackground: false,
};

const validators: Partial<
  Record<keyof MentorSignupData, (v: any, data: MentorSignupData) => string>
> = {
  fullName: (v) => (v.trim() ? "" : "Full name is required"),
  email: (v) => (/\S+@\S+\.\S+/.test(v) ? "" : "Enter a valid email address"),
  phone: (v) =>
    /^[0-9]{10}$/.test(v.replace(/\D/g, ""))
      ? ""
      : "Enter a valid 10-digit phone number",
  password: (v) => (v.length >= 8 ? "" : "Password must be at least 8 characters"),
  confirmPassword: (v, d) => (v === d.password ? "" : "Passwords do not match"),
  currentRole: (v) => (v.trim() ? "" : "Role / Title is required"),
  company: (v) => (v.trim() ? "" : "Company is required"),
  yearsOfExperience: (v) => (v ? "" : "Please select years of experience"),
  targetAudience: (v) => (v ? "" : "Please select a target audience"),
  weeklyAvailability: (v) => (v ? "" : "Please select availability"),
};

/* ────────────────────────────────────────────────
   Credential analysis engine (0–100)
   ──────────────────────────────────────────────── */
type Analysis = {
  score: number;
  status: "strong" | "moderate" | "weak";
  statusLabel: string;
  recommendation: string;
  strengths: string[];
  concerns: string[];
};

const analyzeCredentials = (data: MentorSignupData): Analysis => {
  let score = 0;
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (data.profilePhoto) {
    score += 5;
    strengths.push("Profile photo uploaded — builds trust with mentees");
  } else {
    concerns.push("Add a profile photo — boosts credibility");
  }

  const years =
    data.yearsOfExperience === "15+"
      ? 15
      : parseInt(data.yearsOfExperience, 10) || 0;
  if (data.yearsOfExperience === "15+") {
    score += 25;
    strengths.push("15+ years of industry experience");
  } else if (years >= 5) {
    score += 25;
    strengths.push(`${years} years of experience — strong track record`);
  } else if (years >= 3) {
    score += 18;
    strengths.push(`${years} years of experience`);
  } else if (years >= 1) {
    score += 10;
    concerns.push("Limited industry experience (< 3 years)");
  } else {
    concerns.push("Industry experience not specified");
  }

  if (data.currentRole.trim() && data.company.trim()) {
    score += 10;
    strengths.push(`Currently ${data.currentRole} at ${data.company}`);
  } else if (data.currentRole.trim() || data.company.trim()) {
    score += 5;
  }

  if (data.expertise.length >= 3) {
    score += 15;
    strengths.push(`Broad expertise across ${data.expertise.length} domains`);
  } else if (data.expertise.length === 2) {
    score += 12;
  } else if (data.expertise.length === 1) {
    score += 7;
    concerns.push("Only 1 area of expertise — consider adding more");
  } else {
    concerns.push("No expertise selected");
  }

  const skillCount = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
  if (skillCount >= 3) {
    score += 5;
    strengths.push(`${skillCount} technical skills listed`);
  } else if (skillCount > 0) {
    score += 3;
  } else {
    concerns.push("No key skills / tools listed");
  }

  const bioLen = data.bio.trim().length;
  if (bioLen >= 200) {
    score += 10;
    strengths.push("Detailed professional bio");
  } else if (bioLen >= 80) {
    score += 6;
  } else if (bioLen > 0) {
    score += 3;
    concerns.push("Bio is short — aim for 150+ characters");
  } else {
    concerns.push("Professional bio is empty");
  }

  if (data.socialmediaUrl.trim()) {
    score += 10;
    strengths.push("Portfolio / LinkedIn / GitHub provided");
  } else {
    concerns.push("No LinkedIn / portfolio link — reduces verification speed");
  }

  const pastLen = data.pastMentoringExp.trim().length;
  if (pastLen >= 80) {
    score += 10;
    strengths.push("Proven mentoring / teaching track record");
  } else if (pastLen > 0) {
    score += 5;
  } else {
    concerns.push("No past mentoring experience mentioned");
  }

  if (data.offeringType.length >= 2) {
    score += 5;
    strengths.push(`Offers ${data.offeringType.length} formats`);
  } else if (data.offeringType.length === 1) {
    score += 3;
  }

  if (data.preferredLanguages.length >= 2) {
    score += 5;
    strengths.push(`Teaches in ${data.preferredLanguages.length} languages`);
  } else if (data.preferredLanguages.length === 1) {
    score += 3;
  } else {
    concerns.push("No instruction language selected");
  }

  let status: Analysis["status"];
  let statusLabel: string;
  let recommendation: string;

  if (score >= 70) {
    status = "strong";
    statusLabel = "Strong Profile";
    recommendation =
      "Your profile meets our quality bar. Most mentors with similar profiles get approved within 24 hours.";
  } else if (score >= 45) {
    status = "moderate";
    statusLabel = "Needs Review";
    recommendation =
      "Your profile is on the right track. Filling in the gaps below will significantly boost approval chances.";
  } else {
    status = "weak";
    statusLabel = "Incomplete";
    recommendation =
      "Your profile is missing key details. Address the concerns below to avoid rejection during review.";
  }

  return { score, status, statusLabel, recommendation, strengths, concerns };
};

export default function MentorAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [signupData, setSignupData] =
    useState<MentorSignupData>(defaultSignupData);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [touched, setTouched] = useState<Set<keyof MentorSignupData>>(
    new Set(),
  );
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (mode === "signup") {
      setCurrentStep(0);
      setSignupError("");
      setStepErrors({});
      setTouched(new Set());
    }
  }, [mode]);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninLoading(true);
    setSigninError("");
    try {
      const res = await fetch(`${API}/api/instructors/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Login failed."));
      }
      if (data.token) {
        localStorage.setItem("mentorToken", data.token);
        localStorage.setItem("mentorEmail", signinEmail.trim().toLowerCase());
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(data.status === "approved"
        ? (next === "/notifications?audience=instructor" ? next : "/instructors/dashboard")
        : "/instructors/review-status");
    } catch (err: any) {
      setSigninError(err.message || "An error occurred.");
    } finally {
      setSigninLoading(false);
    }
  };

  const update = (field: keyof MentorSignupData, value: any) => {
    setSignupData((prev) => {
      const next = { ...prev, [field]: value };
      const validator = validators[field];
      if (validator) {
        const fieldError = validator(value, next);
        setStepErrors((e) => ({ ...e, [field]: fieldError }));
      }
      if (field === "password" && touched.has("confirmPassword")) {
        const cpErr =
          next.confirmPassword === value ? "" : "Passwords do not match";
        setStepErrors((e) => ({ ...e, confirmPassword: cpErr }));
      }
      return next;
    });
    setTouched((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const toggleMulti = (
    field: "expertise" | "offeringType" | "preferredLanguages",
    val: string,
  ) => {
    setSignupData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(val)
          ? arr.filter((x) => x !== val)
          : [...arr, val],
      };
    });
    setTouched((prev) => new Set(prev).add(field));
  };

  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!signupData.fullName.trim()) e.fullName = "Full name is required";
      if (!signupData.email.trim() || !/\S+@\S+\.\S+/.test(signupData.email))
        e.email = "Enter a valid email address";
      if (
        !signupData.phone.trim() ||
        !/^[0-9]{10}$/.test(signupData.phone.replace(/\D/g, ""))
      )
        e.phone = "Valid 10-digit number required";
      if (!signupData.password || signupData.password.length < 8)
        e.password = "Min 8 characters";
      if (signupData.password !== signupData.confirmPassword)
        e.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!signupData.currentRole.trim())
        e.currentRole = "Role / Title is required";
      if (!signupData.company.trim()) e.company = "Company is required";
      if (!signupData.yearsOfExperience)
        e.yearsOfExperience = "Please select years of experience";
      if (signupData.expertise.length === 0)
        e.expertise = "Select at least one area";
    }
    if (step === 2) {
      if (signupData.offeringType.length === 0)
        e.offeringType = "Select at least one offering";
      if (!signupData.targetAudience)
        e.targetAudience = "Please select a target audience";
      if (!signupData.weeklyAvailability)
        e.weeklyAvailability = "Please select availability";
    }
    if (step === 3) {
      if (!signupData.agreeToTerms)
        e.agreeToTerms = "You must agree to continue";
      if (!signupData.agreeToBackground)
        e.agreeToBackground = "You must agree to continue";
    }
    setStepErrors(e);
    const keys = Object.keys(e) as (keyof MentorSignupData)[];
    if (keys.length)
      setTouched((prev) => {
        const n = new Set(prev);
        keys.forEach((k) => n.add(k));
        return n;
      });
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep))
      setCurrentStep((p) => Math.min(p + 1, steps.length - 1));
  };
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setSignupLoading(true);
    setSignupError("");

    const formData = new FormData();

    // ── simple string/boolean fields ──
    // `confirmPassword` MUST be here — the backend serializer requires it
    // (InstructorSignupSerializer.validate() compares it against password).
    const simpleFields: (keyof MentorSignupData)[] = [
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword",        // ← required by the backend
      "currentRole",
      "company",
      "yearsOfExperience",
      "skills",
      "socialmediaUrl",
      "bio",
      "teachingStyle",
      "targetAudience",
      "priceRange",
      "weeklyAvailability",
      "pastMentoringExp",
      "agreeToTerms",
      "agreeToBackground",
    ];

    simpleFields.forEach((field) => {
      let value = signupData[field];
      if (typeof value === "boolean") value = value.toString();
      if (value !== "" && value !== null && value !== undefined) {
        formData.append(field, value as string);
      }
    });

    // ── array fields (DRF ListField expects repeated keys) ──
    const arrayFields = ["expertise", "offeringType", "preferredLanguages"];
    arrayFields.forEach((field) => {
      const arr = signupData[field as keyof MentorSignupData] as string[];
      arr.forEach((item) => formData.append(field, item));
    });

    // ── file field (File, not string — must be appended separately) ──
    if (signupData.profilePhoto) {
      formData.append("profilePhoto", signupData.profilePhoto);
    }

    try {
      const res = await fetch(`${API}/api/instructors/register/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Surface the exact DRF validation payload so you can see which
        // field failed (email, password rules, phone, etc.).
        console.error("Registration failed", data);
        throw new Error(
          extractErrorMessage(data, `Registration failed (${res.status}).`),
        );
      }

      if (data.token) {
        localStorage.setItem("mentorToken", data.token);
        localStorage.setItem("mentorEmail", signupData.email);
      }

      router.push("/instructors/review-status");
    } catch (err: any) {
      setSignupError(err.message || "An error occurred.");
    } finally {
      setSignupLoading(false);
    }
  };

  /* ── Image Crop Logic ── */
  const onSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setStepErrors((p) => ({
          ...p,
          profilePhoto: "File too large — max 5MB",
        }));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 4 / 3, width, height),
      width,
      height,
    );
    setCrop(initialCrop);
  };

  const executeCrop = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], "avatar.jpg", {
        type: "image/jpeg",
      });
      update("profilePhoto", croppedFile);
      setCropModalOpen(false);
      setImgSrc("");
    }, "image/jpeg");
  };

  const err = (field: string) =>
    touched.has(field as keyof MentorSignupData) && stepErrors[field]
      ? stepErrors[field]
      : "";

  const inputCls = (field: string) => {
    const hasErr = err(field);
    return `w-full bg-white border px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all ${
      hasErr
        ? "border-red-400 ring-1 ring-red-300 bg-red-50"
        : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
    }`;
  };

  const selectCls = (field: string) =>
    inputCls(field) + " appearance-none cursor-pointer";

  const renderStep0 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 flex-col sm:flex-row">
        <div className="w-32 h-24 bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-blue-200">
          {signupData.profilePhoto ? (
            <img
              src={URL.createObjectURL(signupData.profilePhoto)}
              className="w-full h-full object-cover"
              alt="profile preview"
            />
          ) : (
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <p className="text-sm font-semibold text-gray-800">
            Profile Photo / Avatar
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Upload and crop to rectangular frame (JPG or PNG, max 5MB)
          </p>
          <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-300 px-3 py-1.5 hover:bg-blue-50 transition-all bg-white inline-block">
            Choose & Adjust Photo
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={onSelectImage}
            />
          </label>
          {err("profilePhoto") && (
            <p className="text-xs text-red-500 mt-1">{err("profilePhoto")}</p>
          )}
        </div>
      </div>

      <Field
        label="Full Name"
        required
        fieldKey="fullName"
        error={err("fullName")}
      >
        <input
          type="text"
          value={signupData.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          onBlur={() => setTouched((p) => new Set(p).add("fullName"))}
          className={inputCls("fullName")}
          placeholder="Your Name"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" required fieldKey="email">
          <input
            type="email"
            value={signupData.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("email"))}
            className={inputCls("email")}
            placeholder="your@example.com"
          />
        </Field>
        <Field label="Phone" required fieldKey="phone">
          <input
            type="tel"
            value={signupData.phone}
            onChange={(e) => update("phone", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("phone"))}
            className={inputCls("phone")}
            placeholder="XXXXX XXXXX"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Password" required fieldKey="password">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={signupData.password}
              onChange={(e) => update("password", e.target.value)}
              onBlur={() => setTouched((p) => new Set(p).add("password"))}
              className={inputCls("password") + " pr-16"}
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password" required fieldKey="confirmPassword">
          <input
            type="password"
            value={signupData.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("confirmPassword"))}
            className={inputCls("confirmPassword")}
            placeholder="Confirm Password"
          />
        </Field>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Current Role / Title" required fieldKey="currentRole">
          <input
            type="text"
            value={signupData.currentRole}
            onChange={(e) => update("currentRole", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("currentRole"))}
            className={inputCls("currentRole")}
            placeholder="Senior Engineer"
          />
        </Field>
        <Field label="Company / Organization" required fieldKey="company">
          <input
            type="text"
            value={signupData.company}
            onChange={(e) => update("company", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("company"))}
            className={inputCls("company")}
            placeholder="Google, Razorpay…"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Years of Experience"
          required
          fieldKey="yearsOfExperience"
        >
          <select
            value={signupData.yearsOfExperience}
            onChange={(e) => update("yearsOfExperience", e.target.value)}
            onBlur={() =>
              setTouched((p) => new Set(p).add("yearsOfExperience"))
            }
            className={selectCls("yearsOfExperience")}
          >
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((y) => (
              <option key={y} value={y}>
                {y} {y === 1 ? "year" : "years"}
              </option>
            ))}
            <option value="15+">15+ years</option>
          </select>
        </Field>
      </div>

      <Field label="Linkedin / Portfolio / GitHub / Website">
        <input
          type="url"
          value={signupData.socialmediaUrl}
          onChange={(e) => update("socialmediaUrl", e.target.value)}
          className={inputCls("portfolioUrl")}
          placeholder="github.com/username"
        />
      </Field>

      <Field label="Domains of Expertise" required fieldKey="expertise">
        <div className="flex flex-wrap gap-2 mt-1">
          {expertiseOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleMulti("expertise", opt)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                signupData.expertise.includes(opt)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {err("expertise") && (
          <p className="mt-1.5 text-xs text-red-500">{err("expertise")}</p>
        )}
      </Field>

      <Field label="Key Skills / Tools (comma-separated)">
        <input
          type="text"
          value={signupData.skills}
          onChange={(e) => update("skills", e.target.value)}
          className={inputCls("skills")}
          placeholder="React, Node.js, AWS, Docker…"
        />
      </Field>

      <Field label="Professional Bio">
        <textarea
          rows={3}
          value={signupData.bio}
          onChange={(e) => update("bio", e.target.value)}
          className={inputCls("bio")}
          placeholder="Tell mentees about your journey, achievements, and why you mentor…"
        />
        <p className="text-xs text-gray-400 mt-1">
          {signupData.bio.length}/600 chars
        </p>
      </Field>
    </div>
  );

  const offeringOptions = [
    {
      id: "mentorship",
      label: "Mentorship",
      icon: FaHandsHelping,
      desc: "Live sessions & guidance",
    },
    {
      id: "course",
      label: "Online Course",
      icon: GraduationCap,
      desc: "Self-paced video content",
    },
    {
      id: "internship",
      label: "Internship",
      icon: FaSuitcase,
      desc: "Project-based learning",
    },
    {
      id: "workshop",
      label: "Workshop",
      icon: Workflow,
      desc: "Group live sessions",
    },
    {
      id: "bootcamp",
      label: "Bootcamp",
      icon: Rocket,
      desc: "Intensive programs",
    },
    {
      id: "mock_interview",
      label: "Mock Interviews",
      icon: Target,
      desc: "Interview prep",
    },
  ];

  const renderStep2 = () => (
    <div className="space-y-5">
      <Field
        label="What will you offer on the platform?"
        required
        fieldKey="offeringType"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {offeringOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleMulti("offeringType", opt.id)}
              className={`flex items-center gap-3 p-3 border text-left transition-all ${
                signupData.offeringType.includes(opt.id)
                  ? "bg-blue-50 border-blue-400"
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <span className="text-xl">
                <opt.icon size={24} />
              </span>
              <div>
                <p
                  className={`text-sm font-semibold ${signupData.offeringType.includes(opt.id) ? "text-blue-700" : "text-gray-800"}`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {err("offeringType") && (
          <p className="mt-1.5 text-xs text-red-500">{err("offeringType")}</p>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target Audience" required fieldKey="targetAudience">
          <select
            value={signupData.targetAudience}
            onChange={(e) => update("targetAudience", e.target.value)}
            onBlur={() => setTouched((p) => new Set(p).add("targetAudience"))}
            className={selectCls("targetAudience")}
          >
            <option value="">Select</option>
            <option value="students">College Students</option>
            <option value="freshers">Freshers (0–1 yr)</option>
            <option value="early_career">Early Career (1–3 yrs)</option>
            <option value="mid_career">Mid-Level (3–7 yrs)</option>
            <option value="senior">Senior (7+ yrs)</option>
            <option value="career_switch">Career Switchers</option>
          </select>
        </Field>
        <Field
          label="Weekly Availability"
          required
          fieldKey="weeklyAvailability"
        >
          <select
            value={signupData.weeklyAvailability}
            onChange={(e) => update("weeklyAvailability", e.target.value)}
            onBlur={() =>
              setTouched((p) => new Set(p).add("weeklyAvailability"))
            }
            className={selectCls("weeklyAvailability")}
          >
            <option value="">Select</option>
            <option value="1-2">1–2 hrs/week</option>
            <option value="3-5">3–5 hrs/week</option>
            <option value="5-10">5–10 hrs/week</option>
            <option value="10+">10+ hrs/week</option>
          </select>
        </Field>
      </div>

      <Field label="Session / Course Pricing Range">
        <select
          value={signupData.priceRange}
          onChange={(e) => update("priceRange", e.target.value)}
          className={selectCls("priceRange")}
        >
          <option value="">Select</option>
          <option value="free">Free / Pro Bono</option>
          <option value="500-1000">₹500 – ₹1,000 per session</option>
          <option value="1000-2500">₹1,000 – ₹2,500 per session</option>
          <option value="2500-5000">₹2,500 – ₹5,000 per session</option>
          <option value="5000+">₹5,000+ per session</option>
          <option value="custom">Custom / Negotiable</option>
        </select>
      </Field>

      <Field label="Teaching / Mentoring Style">
        <select
          value={signupData.teachingStyle}
          onChange={(e) => update("teachingStyle", e.target.value)}
          className={selectCls("teachingStyle")}
        >
          <option value="">Select</option>
          <option value="structured">Structured curriculum-based</option>
          <option value="project">Project / hands-on driven</option>
          <option value="socratic">Socratic / discussion-based</option>
          <option value="adaptive">Adaptive to learner</option>
        </select>
      </Field>

      <Field label="Languages of Instruction">
        <div className="flex flex-wrap gap-2 mt-1">
          {languageOptions.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleMulti("preferredLanguages", lang)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                signupData.preferredLanguages.includes(lang)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Past Mentoring / Teaching Experience">
        <textarea
          rows={2}
          value={signupData.pastMentoringExp}
          onChange={(e) => update("pastMentoringExp", e.target.value)}
          className={inputCls("pastMentoringExp")}
          placeholder="e.g. Mentored 30+ students on XYZ platform, conducted workshops at ABC college…"
        />
      </Field>
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium text-right max-w-[60%] truncate">
        {value || "—"}
      </span>
    </div>
  );

  const renderStep3 = () => {
    const analysis = analyzeCredentials(signupData);

    const badgeCls =
      analysis.status === "strong"
        ? "bg-green-100 text-green-700 border-green-200"
        : analysis.status === "moderate"
          ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-red-100 text-red-700 border-red-200";

    const barCls =
      analysis.status === "strong"
        ? "bg-green-500"
        : analysis.status === "moderate"
          ? "bg-amber-500"
          : "bg-red-500";

    return (
      <div className="space-y-4">
        <div className="border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Approval Likelihood
            </p>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badgeCls}`}
            >
              {analysis.statusLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-5xl font-extrabold text-gray-900 leading-none">
              {analysis.score}
            </span>
            <span className="text-sm font-semibold text-gray-400">/ 100</span>
          </div>

          <div className="h-2 w-full bg-gray-200 mb-4 overflow-hidden">
            <div
              className={`h-full ${barCls} transition-all duration-500`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {analysis.recommendation}
          </p>

          {analysis.strengths.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">
                ✓ Strengths ({analysis.strengths.length})
              </p>
              <ul className="space-y-1.5">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.concerns.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                ⚠ Improvements ({analysis.concerns.length})
              </p>
              <ul className="space-y-1.5">
                {analysis.concerns.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border border-gray-100 bg-gray-50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
            Personal
          </p>
          <InfoRow label="Name" value={signupData.fullName} />
          <InfoRow label="Email" value={signupData.email} />
          <InfoRow label="Phone" value={signupData.phone} />
        </div>

        <div className="border border-gray-100 bg-gray-50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
            Professional
          </p>
          <InfoRow label="Role" value={signupData.currentRole} />
          <InfoRow label="Company" value={signupData.company} />
          <InfoRow
            label="Experience"
            value={
              signupData.yearsOfExperience
                ? `${signupData.yearsOfExperience} yrs`
                : ""
            }
          />
          <InfoRow label="Expertise" value={signupData.expertise.join(", ")} />
        </div>

        <div className="border border-gray-100 bg-gray-50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
            Offerings
          </p>
          <InfoRow
            label="Offering Types"
            value={signupData.offeringType.join(", ")}
          />
          <InfoRow label="Audience" value={signupData.targetAudience} />
          <InfoRow
            label="Availability"
            value={
              signupData.weeklyAvailability
                ? `${signupData.weeklyAvailability} hrs/week`
                : ""
            }
          />
          <InfoRow label="Price Range" value={signupData.priceRange} />
        </div>

        <div className="space-y-3 pt-2">
          {[
            {
              field: "agreeToTerms" as const,
              label: (
                <>
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-blue-600 underline-offset-2 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-blue-600 underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  , and confirm all information is accurate.
                </>
              ),
            },
            {
              field: "agreeToBackground" as const,
              label:
                "I consent to a background verification check as part of the mentor approval process.",
            },
          ].map(({ field, label }) => (
            <div
              key={field}
              className={`flex items-start gap-3 p-4 border transition-all ${
                err(field)
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => update(field, !signupData[field])}
                  className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                    signupData[field]
                      ? "bg-blue-600 border-blue-600"
                      : err(field)
                        ? "border-red-400 bg-white"
                        : "border-gray-300 bg-white hover:border-blue-400"
                  }`}
                >
                  {signupData[field] && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-700">{label}</p>
                {err(field) && (
                  <p className="text-xs text-red-500 mt-1">{err(field)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStepper = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 z-0" />
      {steps.map((step, idx) => {
        const done = idx < currentStep;
        const active = idx === currentStep;
        return (
          <div
            key={step.id}
            className="flex flex-col items-center gap-2 z-10 relative"
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 text-xs sm:text-sm font-bold transition-all duration-300 ${
                done
                  ? "bg-blue-600 border-blue-600 text-white"
                  : active
                    ? "bg-white border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                    : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {done ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.label
              )}
            </div>
            <span
              className={`text-xs font-medium hidden md:block ${active ? "text-blue-600" : done ? "text-gray-500" : "text-gray-300"}`}
            >
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1588fa; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; }
        option { background: white; color: #111827; }
        select { color: #374151; }
      `}</style>

      <div className="hidden lg:flex w-[620px] flex-shrink-0 flex-col relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(211, 16, 16, 0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 p-10 flex flex-col h-full">
          <div className="mt-auto">
            {mode === "signin" ? (
              <>
                <div className="inline-block mb-4 px-3 py-1 bg-white/100 border border-white/20 text-xs text-blue-900 font-semibold tracking-wider uppercase">
                  Mentor Portal
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src={"/logo.png"}
                    alt="logo"
                    height={120}
                    width={120}
                  />
                  <span className="text-6xl font-bold tracking-tighter">
                    Go<span className="text-white">cyn</span>
                  </span>
                </div>
                <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
                  GOOD TO HAVE
                  <br />
                  you back.
                </h1>
                <p className="mt-4 text-blue-20 text-base leading-relaxed">
                  Your students are waiting. Continue shaping careers through
                  your expertise.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    "Dashboard analytics & session tracking",
                    "Manage mentees, courses & internships",
                    "Instant payout & earnings reports",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-blue-10"
                    >
                      <svg
                        className="w-4 h-4 text-blue-30 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="inline-block mb-4 px-3 py-1 bg-white/100 border border-white/20 text-xs text-black-100 font-semibold tracking-wider uppercase">
                  Become a Mentor
                </div>
                <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                  Share your
                  <br />
                  knowledge.
                  <br />
                  Earn while
                  <br />
                  you inspire.
                </h1>
                <p className="mt-4 text-black-100 text-base leading-relaxed">
                  Join India's trusted platform for expert mentors, course
                  creators, and internship providers.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    ["1,000+", "Verified Mentors"],
                    ["80K+", "Students Served"],
                    ["₹1.2Cr", "Mentor Earnings"],
                    ["4.8★", "Avg Rating"],
                  ].map(([num, lbl]) => (
                    <div
                      key={lbl}
                      className="p-4 bg-white/50 border border-black/10"
                    >
                      <div className="text-2xl font-bold text-black">{num}</div>
                      <div className="text-xs text-green mt-0.5 uppercase">
                        {lbl}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className="mt-auto pt-8 text-xs text-black-300 border-t border-white/100">
            Trusted by professionals from MNCS & 500+ companies
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        <div className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-12 pt-10">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {mode === "signin"
                  ? "Sign in to your dashboard"
                  : "Create profile"}
              </h2>
              <p className="mt-2 text-gray-500 text-sm">
                {mode === "signin"
                  ? "New to MentorHub?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() =>
                    setMode(mode === "signin" ? "signup" : "signin")
                  }
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  {mode === "signin"
                    ? "Create instructors profile →"
                    : "Sign in instead"}
                </button>
              </p>
            </div>

            {mode === "signin" && (
              <div className="bg-white p-4 sm:p-8 lg:p-28">
                <div className="lg:hidden flex items-center justify-center px-4 py-2 gap-3 mb-6">
                  <Image
                    src="/logo.png"
                    alt="Gocyn logo"
                    width={90}
                    height={90}
                  />
                  <span className="text-4xl font-bold tracking-tighter text-gray-900">
                    Go<span className="text-blue-600">cyn</span>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight py-4 mb-6">
                  Welcome Back !
                </h2>
                <form onSubmit={handleSignin} className="space-y-5">
                  <Field label="Email Address" fieldKey="signinEmail">
                    <input
                      type="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                      placeholder="example@gmail.com"
                    />
                  </Field>
                  <Field label="Password" fieldKey="signinPassword">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all pr-24"
                        placeholder="••••••••"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="text-gray-300 hover:text-gray-600 text-xs font-medium"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                        <Link
                          href="/instructors/auth/forget-password/"
                          className="text-blue-600 text-xs font-medium hover:text-blue-700"
                        >
                          Forgot?
                        </Link>
                      </div>
                    </div>
                  </Field>

                  {signinError && (
                    <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {signinError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={signinLoading}
                    className="w-full py-2 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-sm"
                  >
                    {signinLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Signing in…
                      </>
                    ) : (
                      "Sign in to Dashboard →"
                    )}
                  </button>
                </form>
              </div>
            )}

            {mode === "signup" && (
              <form onSubmit={handleRegistration}>
                <div className="bg-white p-4 sm:p-6 lg:p-8">
                  {renderStepper()}

                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900">
                      {steps[currentStep].title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>

                  <div className="min-h-[360px]">
                    {currentStep === 0 && renderStep0()}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                  </div>

                  {signupError && (
                    <div className="mt-4 bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="whitespace-pre-line">{signupError}</span>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="px-6 py-2 border border-gray-200 text-black text-sm font-semibold hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ← Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-2 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                      >
                        Continue →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        {signupLoading ? (
                          <>
                            <svg
                              className="h-4 w-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Submitting…
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 max-w-xl w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Adjust Avatar Fit
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setImgSrc("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 max-h-[60vh] flex items-center justify-center overflow-auto bg-gray-50 border border-gray-100 p-2">
              <ReactCrop
                crop={crop}
                onChange={(_: any, percentCrop: any) => setCrop(percentCrop)}
                onComplete={(c: any) => setCompletedCrop(c)}
                aspect={4 / 3}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "50vh", maxWidth: "100%" }}
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setImgSrc("");
                }}
                className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCrop}
                className="px-5 py-2 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Check size={16} /> Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
