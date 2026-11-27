"use client";

import { useRouter, useParams } from "next/navigation";
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
import {
  MdArrowBack,
  MdCloudUpload,
  MdBusiness,
  MdLocationOn,
  MdAccessTime,
  MdCurrencyRupee,
  MdCheckCircle,
  MdTitle,
  MdDescription,
  MdList,
  MdSettings,
  MdImage,
} from "react-icons/md";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { APP_API_BASE, LEGACY_API_BASE } from "@/src/lib/apiBases";
const API = APP_API_BASE;

export default function AddInternship({
  initialData,
  isEditMode,
}: {
  initialData?: any;
  isEditMode?: boolean;
}) {
  const navigate = useRouter();
  const params = useParams();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loadingMentors, setLoadingMentors] = useState(false);

  const rawId = params?.id;
  const internshipId = Array.isArray(rawId) ? rawId[0] : rawId;

  const fetchMentors = async (query: string) => {
    try {
      setLoadingMentors(true);
      const res = await fetch(`${API}/api/search-mentors/?q=${query}`);
      const data = await res.json();
      setMentors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMentors(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchMentors(search || ""); // ✅ always fetch
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    mentors: "",
    location: "",
    duration: "",
    stipend: "",
    description: "",
    requirements: "",
    status: "Active" as "Active" | "Inactive",
    imageUrl: "",
    public_id: "",
    youtube: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        company: initialData.company || "",
        mentors: initialData.mentors || "",
        location: initialData.location || "",
        duration: initialData.duration || "",
        stipend: initialData.stipend || "",
        description: initialData.description || "",
        requirements: initialData.requirements || "",
        status: initialData.status || "Active",
        imageUrl: initialData.imageUrl || "",
        public_id: initialData.public_id || "",
        youtube: initialData.youtube || "",
      });

      if (initialData.mentors) {
        setSelectedMentors(initialData.mentors.map((m: any) => m.name));
      }
      setPreview(initialData.imageUrl);
    }
  }, [initialData]);

  const handleImageChange = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl || null;
      let public_id = formData.public_id || null;

      if (image) {
        const formDataImg = new FormData();
        formDataImg.append("image", image);

        const res = await fetch(`${LEGACY_API_BASE}/upload/internship/images/`, {
          method: "POST",
          body: formDataImg,
        });

        if (!res.ok) throw new Error("Image upload failed");

        const data = await res.json();
        imageUrl = data.imageUrl;
        public_id = data.publicId;
      }

      const finalData = { 
        ...formData,
         imageUrl,
         public_id,
         mentorNames: selectedMentors,

       };

      let res;
      if (!isEditMode) {
        res = await fetch(`${LEGACY_API_BASE}/upload/internship/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData),
        });
        if (!res.ok) throw new Error("Create failed");
        toast.success("Internship created!");
      } else {
        res = await fetch(`${LEGACY_API_BASE}/upload/update_internship/${internshipId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Internship updated!");
      }

      navigate.push("/admin/internships");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setIsSubmitting(false);
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
              onClick={() => navigate.push("/admin/internships")}
            >
              <MdArrowBack className="text-xl" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {isEditMode ? "Edit Opportunity" : "New Internship"}
            </h1>
            <p className="text-gray-400 font-medium mt-2">
               Post a new internship with detailed requirements.
            </p>
          </motion.div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* LEFT: IMAGE SECTION */}
          <div className="lg:col-span-4 space-y-4">
            <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-1 flex items-center gap-2">
              <MdImage className="text-indigo-500 text-base" /> Banner Image
            </Label>
            <div className="relative group overflow-hidden rounded-[32px] border-2 border-dashed border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer aspect-[4/5] flex items-center justify-center shadow-sm">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="imgUp"
                onChange={(e) =>
                  e.target.files?.[0] && handleImageChange(e.target.files[0])
                }
              />
              <label
                htmlFor="imgUp"
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
                    <p className="font-bold text-sm text-gray-600">Upload Banner</p>
                  </div>
                )}
              </label>
            </div>

            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
               <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                 <MdCheckCircle className="text-indigo-600 text-lg" /> Pro Tip
               </h4>
               <p className="text-[11px] leading-relaxed text-indigo-700 font-medium">
                 Use a high-quality banner image to make the posting look more professional.
               </p>
            </div>
          </div>

          {/* RIGHT: DETAILS SECTION */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              {/* Job Title */}
              <div className="space-y-2">
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MdTitle className="text-indigo-500 text-lg" /> Job Title
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Full Stack Developer"
                  required
                  className="rounded-2xl h-14 border-gray-200 bg-white/70 shadow-sm font-bold text-lg focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Company & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MdBusiness className="text-indigo-500 text-lg" /> Company
                  </Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Company Name"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MdLocationOn className="text-indigo-500 text-lg" />{" "}
                    Location
                  </Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Remote / City"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm"
                  />
                </div>

              {/* Duration & Stipend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MdAccessTime className="text-indigo-500 text-lg"/> Duration
                  </Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g. 6 Months"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MdCurrencyRupee className="text-indigo-500 text-lg"/> Stipend
                  </Label>
                  <Input
                    value={formData.stipend}
                    onChange={(e) => setFormData({...formData, stipend: e.target.value})}
                    placeholder="Amount / Unpaid"
                    required
                    className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm"
                  />
                </div>
              </div>
            </div>
             </div>


            {/* About Role */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MdDescription className="text-indigo-500 text-lg" /> About the
                Role
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the responsibilities..."
                rows={4}
                required
                className="rounded-2xl border-gray-200 bg-white/70 focus:bg-white resize-none shadow-sm font-medium p-4"
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MdList className="text-indigo-500 text-lg" /> Requirements
              </Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder="What skills are you looking for?"
                rows={3}
                required
                className="rounded-2xl border-gray-200 bg-white/70 focus:bg-white resize-none shadow-sm font-medium p-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MdLocationOn className="text-indigo-500 text-lg" /> Youtube
                video Link
              </Label>
              <Input
                value={formData.youtube}
                onChange={(e) =>
                  setFormData({ ...formData, youtube: e.target.value })
                }
                placeholder="https://www.youtube.com/...."
                className="rounded-2xl h-12 border-gray-200 bg-white/70 shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MdBusiness className="text-indigo-500 text-lg" /> Mentors
              </Label>

              <div className="flex flex-wrap gap-2">
                {selectedMentors.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {name}
                    <button
                      onClick={() =>
                        setSelectedMentors((prev) =>
                          prev.filter((m) => m !== name),
                        )
                      }
                      className="text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* 🔍 Search */}
              <input
                type="text"
                placeholder="Search mentors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />

              {/* 📋 Dropdown */}
              <div className="border rounded-xl max-h-48 overflow-y-auto bg-white shadow-sm">
                {mentors.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    {search ? "No mentors found" : "Start typing to search"}
                  </div>
                ) : (
                  mentors.map((mentor: any) => {
                    const isSelected = selectedMentors.includes(mentor.name);

                    return (
                      <div
                        key={mentor._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMentors((prev) =>
                              prev.filter((name) => name !== mentor.name),
                            );
                          } else {
                            setSelectedMentors((prev) => [
                              ...prev,
                              mentor.name,
                            ]);
                          }
                        }}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                          isSelected
                            ? "bg-indigo-100 border-l-4 border-indigo-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {mentor.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {mentor.expertise}
                          </p>
                        </div>

                        {/* ✅ Checkbox indicator */}
                        <div>
                          {isSelected ? (
                            <div className="w-5 h-5 bg-indigo-500 text-white flex items-center justify-center rounded-full text-xs">
                              ✓
                            </div>
                          ) : (
                            <div className="w-5 h-5 border rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* STATUS & SUBMIT */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-6">
                <div className="w-full sm:w-40 space-y-2">
                  <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MdSettings className="text-indigo-500 text-lg" /> Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger className="rounded-2xl h-12 border-gray-200 bg-white shadow-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100">
                      <SelectItem
                        value="Active"
                        className="font-bold text-green-600"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value="Inactive"
                        className="font-bold text-gray-400"
                      >
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 w-full flex gap-3 mt-auto">
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 transition-all active:scale-95"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : isEditMode
                        ? "Update Now"
                        : "Publish Now"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-8 rounded-2xl border-gray-200 bg-white font-bold text-[11px] uppercase tracking-widest shadow-sm"
                    onClick={() => navigate.push("/admin/internships")}
                  >
                    Cancel
                  </Button>
                </div> 
              </div>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
   
  );
}
