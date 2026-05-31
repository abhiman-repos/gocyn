"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  MdWork,
  MdAccessTime,
  MdDescription,
  MdCloudUpload,
  MdArrowBack,
} from "react-icons/md";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_APP_URL;

// --- Validation Schema ---
const internshipSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  type: z.enum(["Remote", "Onsite", "Hybrid"]),
  duration: z.string().min(1, "Duration is required"),
  stipend: z.string().min(1, "Stipend is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  applicantsLimit: z.number().positive().optional(),
  description: z.string().min(20, "Description must be at least 20 characters"),
  requirements: z.string().min(20, "Requirements must be at least 20 characters"),
  status: z.enum(["Active", "Draft", "Closed"]).default("Draft"),
});

type InternshipFormData = z.infer<typeof internshipSchema>;

export default function CreateInternshipPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      type: "Remote",
      status: "Draft",
    },
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit handler
  const onSubmit = async (data: InternshipFormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Creating internship...");

    try {
      const formData = new FormData();
      // Append all text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/upload/internships/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Creation failed");

      toast.success("Internship created successfully!", { id: toastId });
      router.push("/partner/dashboard/programs");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/partner/dashboard/programs"
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
          >
            <MdArrowBack size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Internship</h1>
            <p className="text-gray-500 text-sm">Fill in the details to post an internship opportunity</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdWork className="text-indigo-500" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internship Title *
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g., Frontend React Developer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  {...register("company")}
                  placeholder="Your company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                {errors.company && (
                  <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  {...register("location")}
                  placeholder="e.g., Bangalore, Remote, Hybrid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Type *
                </label>
                <select
                  {...register("type")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline & Compensation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdAccessTime className="text-indigo-500" /> Timeline & Compensation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <input
                  {...register("duration")}
                  placeholder="e.g., 3 months, 6 months"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.duration && (
                  <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stipend (₹) *
                </label>
                <input
                  {...register("stipend")}
                  placeholder="e.g., 15000, Unpaid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.stipend && (
                  <p className="text-red-500 text-xs mt-1">{errors.stipend.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register("startDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  {...register("endDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicants Limit (Optional)
                </label>
                <input
                  type="number"
                  {...register("applicantsLimit", { valueAsNumber: true })}
                  placeholder="e.g., 50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdDescription className="text-indigo-500" /> Description & Requirements
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description *
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Describe the role, responsibilities, and what the intern will learn..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements & Eligibility *
                </label>
                <textarea
                  {...register("requirements")}
                  rows={4}
                  placeholder="Skills, qualifications, tools, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                />
                {errors.requirements && (
                  <p className="text-red-500 text-xs mt-1">{errors.requirements.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image & Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdCloudUpload className="text-indigo-500" /> Media & Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="cursor-pointer flex flex-col items-center gap-1"
                  >
                    <MdCloudUpload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400">JPG, PNG up to 2MB</span>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-auto rounded-lg object-cover border"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register("status")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="Draft">Draft (not visible to students)</option>
                  <option value="Active">Active (immediately publish)</option>
                  <option value="Closed">Closed (no new applications)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pb-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Internship"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}