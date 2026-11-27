"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddMentor from "../../add/page";
import { motion } from "motion/react";


const API = process.env.NEXT_PUBLIC_APP_URL

export default function EditMentorPage() {
  const { id } = useParams();
  const router = useRouter();

  const mentorId =
    typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<any>(null);
  const [error, setError] = useState("");

  // ✅ FETCH MENTOR
  useEffect(() => {
    if (!mentorId) return;

    const fetchMentor = async () => {
      try {
        const res = await fetch(
          `${API}/api/get_mentor/${mentorId}/`
        );

        if (!res.ok) throw new Error("Failed to fetch mentor");

        const data = await res.json();
        setMentor(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  // 🌀 Loading
  if (loading) {
    return (
      <div className="p-10 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/2" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-red-600 font-semibold">
          Failed to load mentor
        </h2>
        <button
          onClick={() => router.push("/admin/mentors")}
          className="mt-4 px-4 py-2 bg-black text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 🚫 Not found
  if (!mentor) {
    return <div className="p-10 text-center">Mentor not found</div>;
  }

  // ✅ Render form
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AddMentor initialData={mentor} isEditMode />
    </motion.div>
  );
}