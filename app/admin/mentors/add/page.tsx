"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MdArrowBack,
  MdCloudUpload,
  MdPerson,
  MdSchool,
  MdStars,
  MdEmail,
  MdDescription,
  MdSettings,
  MdPhotoSizeSelectActual,
  MdCheckCircle,
} from "react-icons/md";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function AddMentor({
  initialData,
  isEditMode,
}: {
  initialData?: any;
  isEditMode?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    expertise: "",
    bio: "",
    experience: "",
    status: "Active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        expertise: initialData.expertise || "",
        bio: initialData.bio || "",
        experience: initialData.experience || "",
        status: initialData.status || "Active",
      });
      if (initialData.imageUrl) setPreview(initialData.imageUrl);
    }
  }, [initialData]);

  const handleImageChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      let res;

      // ✅ EDIT (PUT + JSON)
      if (isEditMode && initialData?._id) {
        let imageBase64 = null;

        if (image) {
          const reader = new FileReader();
          imageBase64 = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(image);
          });
        }

        res = await fetch(`${API}/api/update_mentor/${initialData._id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            image: imageBase64,
          }),
        });
      }

      // ✅ CREATE (POST + FormData)
      else {
        const formDataToSend = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
          formDataToSend.append(key, String(value));
        });

        if (image) formDataToSend.append("image", image);

        res = await fetch(`${API}/api/mentor/`, {
          method: "POST",
          body: formDataToSend,
        });
      }

      if (!res.ok) throw new Error("Operation failed");

      router.push("/admin/mentors");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-16">
      <div className="w-full max-w-5xl mx-auto">
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              className="mb-4 pl-0 flex items-center gap-2 hover:bg-transparent text-gray-400 hover:text-indigo-600 font-bold transition-colors"
              onClick={() => router.push("/admin/mentors")}
            >
              <MdArrowBack className="text-xl" />
              Back to Mentors
            </Button>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {isEditMode ? "Edit Profile" : "Add Mentor"}
            </h1>
            <p className="text-gray-400 font-medium mt-2">
              Create a professional profile for your experts.
            </p>
          </motion.div>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-xs font-bold bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* LEFT: PHOTO UPLOAD */}
          <div className="lg:col-span-4 space-y-4">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1 flex items-center gap-2">
              <MdPhotoSizeSelectActual className="text-indigo-500" /> Mentor
              Photo
            </Label>
            <div className="relative group overflow-hidden rounded-[32px] border-2 border-dashed border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer aspect-square flex items-center justify-center shadow-sm">
              <input
                type="file"
                className="hidden"
                id="imageUpload"
                onChange={(e) =>
                  e.target.files?.[0] && handleImageChange(e.target.files[0])
                }
              />
              <label
                htmlFor="imageUpload"
                className="cursor-pointer w-full h-full flex items-center justify-center"
              >
                {preview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-[32px]"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[32px]">
                      <MdCloudUpload className="text-white text-4xl" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <MdCloudUpload className="text-4xl mx-auto mb-2 group-hover:scale-110 transition-transform text-indigo-400" />
                    <p className="font-bold text-sm text-gray-700">
                      Upload Photo
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MdCheckCircle className="text-indigo-600 text-lg" /> Profile
                Tip
              </h4>
              <p className="text-[11px] leading-relaxed text-indigo-700 font-medium">
                A professional headshot increases trust and engagement from
                students.
              </p>
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MdPerson className="text-indigo-500 text-lg" /> Full Name
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm font-bold focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MdEmail className="text-indigo-500 text-lg" /> Email
                    Address
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm font-bold"
                  />
                </div>
              </div>

              {/* Expertise & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MdSchool className="text-indigo-500 text-lg" /> Expertise
                  </Label>
                  <Input
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    placeholder="e.g. React, UI/UX"
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MdStars className="text-indigo-500 text-lg" /> Experience
                  </Label>
                  <Input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5+ Years"
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm font-bold"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MdDescription className="text-indigo-500 text-lg" />{" "}
                  Professional Bio
                </Label>
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about your professional journey..."
                  rows={4}
                  className="rounded-2xl border-gray-200 bg-white/70 focus:bg-white resize-none p-4 font-medium shadow-sm"
                />
              </div>

              {/* Stats & Status */}
              <div className="grid grid-cols-1  gap-6 items-end">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MdSettings className="text-indigo-500 text-lg" /> Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger className="rounded-2xl h-12 border-gray-200 bg-white shadow-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem
                        value="Active"
                        className="text-green-600 font-bold"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value="Inactive"
                        className="text-gray-400 font-bold"
                      >
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6">
                <Button
                  disabled={loading}
                  type="submit"
                  className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  {loading
                    ? "Saving..."
                    : isEditMode
                      ? "Update Profile"
                      : "Create Mentor"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-8 rounded-2xl border-gray-200 bg-white font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 shadow-sm"
                  onClick={() => router.push("/admin/mentors")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
