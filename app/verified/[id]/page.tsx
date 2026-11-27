"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaAward,
  FaDownload,
  FaLinkedin,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { LEGACY_API_BASE } from "@/src/lib/apiBases";

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [downloading, setDownloading] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Certificate
  useEffect(() => {
    if (!id) return;

    const fetchCertificate = async () => {
      try {
        const res = await fetch(
          `${LEGACY_API_BASE}/upload/verify-certificate?certificate_id=${encodeURIComponent(String(id))}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Invalid certificate");

        setCertificateData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  };

  // PDF Download (High Quality)
  const handleDownloadPDF = async () => {
    if (!certificateRef.current || !certificateData) return;

    setDownloading(true);
    try {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.width = "1123px";
      container.style.height = "794px";
      container.style.background = "#ffffff";
      container.style.fontFamily = "Arial, sans-serif";

      const clone = certificateRef.current.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(container, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1123, 794],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 1123, 794);
      pdf.save(`Gocyn-Certificate-${certificateData.certificate_id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading your certificate...
      </div>
    );
  }

  if (error || !certificateData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-2">Invalid Certificate ❌</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition"
        >
          <FaArrowLeft /> Back to Profile
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#1e40af] px-6 md:px-10 py-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaAward size={32} className="md:size-10" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Gocyn</h1>
                <p className="text-xs md:text-sm opacity-90">Academy of Excellence</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-sm">
              <FaCheckCircle /> VERIFIED
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="p-6 md:p-14 bg-white">
            <div
              ref={certificateRef}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 md:p-12 text-center bg-white min-h-[420px] md:min-h-[520px] flex flex-col justify-center"
            >
              <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">
                {certificateData.internship_title}
              </h2>

              <p className="text-base md:text-lg mb-4">This is to certify that</p>

              <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-gray-800">
                {certificateData.user_name}
              </h3>

              <p className="text-sm md:text-base mb-10 text-gray-600">
                {certificateData.user_email}
              </p>

              <p className="text-base md:text-lg mb-10">
                has successfully completed the program.
              </p>

              <div className="grid grid-cols-3 gap-4 text-sm md:text-base">
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Course</p>
                  <p className="font-semibold mt-1 leading-tight">
                    {certificateData.internship_title}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Issued</p>
                  <p className="font-semibold mt-1">
                    {new Date(certificateData.issued_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs md:text-sm">Certificate ID</p>
                  <p className="font-mono font-semibold mt-1 text-xs md:text-sm">
                    {certificateData.certificate_id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Optimized for Mobile */}
          <div className="px-6 md:px-10 py-6 bg-gray-50 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 
                         text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 
                         disabled:opacity-70 transition-all active:scale-95"
            >
              <FaDownload />
              {downloading ? "Generating PDF..." : "Download Certificate (PDF)"}
            </button>

            <button
              onClick={() => {
                triggerConfetti();
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(
                    `I just earned my ${certificateData.internship_title} certificate from Gocyn! 🎉`
                  )}`
                );
              }}
              className="flex-1 sm:flex-none border-2 border-gray-300 hover:border-gray-400 
                         py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <FaLinkedin size={24} className="text-[#0a66c2]" />
              Share on LinkedIn
            </button>
          </div>
        </motion.div>

        <p className="text-center text-xs md:text-sm text-gray-500 mt-8">
          This certificate has been verified by Gocyn Secure System
        </p>
      </div>
    </div>
  );
}
