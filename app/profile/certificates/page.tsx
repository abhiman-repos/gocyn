"use client";

import { motion } from "motion/react";
import { FaAward, FaDownload, FaEye, FaCalendarAlt } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";

const API = process.env.APP_URL;

interface Certificate {
  id: string;
  title: string;
  course: string;
  issuedDate: string;
  certificateId: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/courses/my-certificates/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setCertificates((data.certificates || []).map((cert: any) => ({
            id: cert.id || cert.certificateId,
            title: cert.title || cert.course,
            course: cert.course || cert.title,
            issuedDate: new Date(cert.issuedDate || cert.issued_at).toLocaleDateString("en-IN"),
            certificateId: cert.certificateId || cert.id,
          })));
        }
      } catch (err) {
        console.error("CERT ERROR:", err);
      }
    };

    if (user) fetchCertificates();
  }, [user]);

  return (
    <div className="pt-1 pb-4">   {/* ← Sabse kam space */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">   {/* gap bhi kam */}
        {certificates.map((cert) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
          >
            {/* Certificate Preview - Height kam kiya */}
            <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-600 p-5 flex flex-col justify-between text-white relative">
              <div className="absolute top-4 right-4">
                <FaAward size={40} className="opacity-30" />
              </div>
              <span className="px-3 py-1 bg-white/20 text-xs font-semibold rounded-3xl w-fit">
                VERIFIED
              </span>
              <h3 className="text-xl font-semibold leading-tight line-clamp-2">
                {cert.title}
              </h3>
            </div>

            <div className="p-5">
              <p className="font-medium text-gray-800 text-sm">{cert.course}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                <FaCalendarAlt />
                <span>Issued: {cert.issuedDate}</span>
              </div>

              <div className="text-[10px] font-mono text-gray-400 mt-1">
               Certificate ID: {cert.certificateId}
              </div>

              {/* Buttons - tight */}
              <div className="flex gap-2 mt-6">
                <Link href={`/profile/certificate/${cert.certificateId}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 text-sm transition-all">
                  <FaEye /> View
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FaAward size={60} className="mx-auto opacity-30 mb-3" />
          <p className="text-lg">No certificates yet</p>
          <p className="text-sm mt-1">Complete an internship/course to earn your first certificate</p>
        </div>
      )}
    </div>
  );
}
