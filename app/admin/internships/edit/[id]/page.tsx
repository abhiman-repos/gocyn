"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddInternship from "../../add/page";
import { motion } from "motion/react";


import { LEGACY_API_BASE } from "@/src/lib/apiBases";

export default function EditInternshipPage() {
  const { id } = useParams();
  const router = useRouter();

  const internshipId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<any>(null);
  const [error, setError] = useState("");

  // ✅ Fetch internship from backend (NOT local state)
  useEffect(() => {
    if (!internshipId) return;

    const fetchInternship = async () => {
      try {
        const res = await fetch(
          `${LEGACY_API_BASE}/upload/edit/${internshipId}/`,
        );

        if (!res.ok) throw new Error("Failed to fetch internship");

        const data = await res.json();
        setInternship(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [internshipId]);

  // 🌀 Loading UI
  if (loading) {
    return (
      <div className="p-10">
        <div className="animate-pulse space-y-6 max-w-2xl">
          <div className="h-10 bg-gray-200 rounded w-1/2" />
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // ❌ Error UI
  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-red-600">
          Failed to load internship
        </h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => router.push("/admin/internships")}
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 🚫 Not found
  if (!internship) {
    return (
      <div className="p-10 text-center text-gray-500">Internship not found</div>
    );
  }

  // ✅ Render SAME UI as add page
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AddInternship initialData={internship} isEditMode />
    </motion.div>
  );
}
