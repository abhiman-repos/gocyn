"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  MdBook,
  MdPerson,
  MdDescription,
  MdCategory,
  MdTimeline,
  MdCurrencyRupee,
  MdCloudUpload,
  MdSchool,
  MdArrowBack,
  MdCheckCircle,
} from "react-icons/md";

const API = process.env.NEXT_PUBLIC_APP_URL;

// --- Validation Schema ---
const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  instructor: z.string().min(2, "Instructor name is required"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  category: z.string().min(1, "Please select a category"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().min(1, "Duration is required"),
  price: z.string().min(1, "Price is required"),
  status: z.enum(["Published", "Draft", "Archived"]).default("Draft"),
  whatYouWillLearn: z.string().min(10, "Please list at least one learning outcome"),
  prerequisites: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

// Options
const categories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "AI & Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "Digital Marketing",
  "Business & Entrepreneurship",
  "Personal Development",
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: "Beginner",
      status: "Draft",
    },
  });

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

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Creating course...");

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      if (imageFile) formData.append("image", imageFile);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/upload/courses/create/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Creation failed");

      toast.success("Course created successfully!", { id: toastId });
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/partner/dashboard/programs"
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition"
          >
            <MdArrowBack size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-500 text-sm">Share your knowledge with students worldwide</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdBook className="text-indigo-500" /> Course Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g., Advanced React Patterns"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor Name *
                </label>
                <input
                  {...register("instructor")}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.instructor && (
                  <p className="text-red-500 text-xs mt-1">{errors.instructor.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register("category")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <select
                  {...register("level")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Duration & Pricing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdTimeline className="text-indigo-500" /> Timeline & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <input
                  {...register("duration")}
                  placeholder="e.g., 10 hours, 6 weeks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.duration && (
                  <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) *
                </label>
                <input
                  {...register("price")}
                  placeholder="e.g., 499, Free"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Learning Outcomes & Prerequisites */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdSchool className="text-indigo-500" /> Learning Path
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What You’ll Learn *
                </label>
                <textarea
                  {...register("whatYouWillLearn")}
                  rows={3}
                  placeholder="List key takeaways (one per line or bullet points)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                />
                {errors.whatYouWillLearn && (
                  <p className="text-red-500 text-xs mt-1">{errors.whatYouWillLearn.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites (Optional)
                </label>
                <textarea
                  {...register("prerequisites")}
                  rows={2}
                  placeholder="Any required skills or knowledge"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdDescription className="text-indigo-500" /> Course Description
            </h2>
            <div>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="Full course description, what students will achieve, why they should take it..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Media & Status */}
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
                    id="courseImageUpload"
                  />
                  <label htmlFor="courseImageUpload" className="cursor-pointer flex flex-col items-center gap-1">
                    <MdCloudUpload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <span className="text-xs text-gray-400">JPG, PNG up to 2MB</span>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-lg object-cover border" />
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
                  <option value="Published">Published (immediately available)</option>
                  <option value="Archived">Archived (hidden from listings)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
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
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}