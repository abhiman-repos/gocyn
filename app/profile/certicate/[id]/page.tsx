"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaDownload,
  FaLinkedin,
  FaArrowLeft,
  FaCalendarAlt,
} from "react-icons/fa";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API = process.env.APP_URL;

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [certificateData, setCertificateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (value?: string | null) => value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/courses/certificates/${id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setError("Invalid Certificate");
          return;
        }

        setCertificateData(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCertificate();
  }, [id]);

  const triggerConfetti = () => {
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
  };

  const qrImageUrl = certificateData?.qr_code || "";
  const completedOn = certificateData?.completed_at;
  const certificateDate = completedOn || certificateData?.issued_at;

  // High Quality PDF Download
  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);

    try {
      const element = certificateRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,

        // ✅ FIX: sanitize unsupported colors
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll("*");

          allElements.forEach((el: any) => {
            const style = window.getComputedStyle(el);

            // Replace unsupported lab/oklch colors
            if (style.color.includes("lab") || style.color.includes("oklch")) {
              el.style.color = "#000000";
            }

            if (
              style.backgroundColor.includes("lab") ||
              style.backgroundColor.includes("oklch")
            ) {
              el.style.backgroundColor = "#ffffff";
            }

            if (style.borderColor.includes("lab")) {
              el.style.borderColor = "#1e3a8a";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [297, 210],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);

      pdf.save(`Certificate-${certificateData.certificate_id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Certificate...
      </div>
    );
  if (error || !certificateData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <p className="text-2xl">{error}</p>
        <button
          onClick={() => router.push("/verify")}
          className="mt-6 underline"
        >
          Go to Verification
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 mb-8 text-gray-600 hover:text-black"
        >
          <FaArrowLeft /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-x-auto shadow-2xl"
        >
          {/* Certificate Container */}
          <div
            ref={certificateRef}
            className="relative mx-auto aspect-[297/210] w-full min-w-[720px] max-w-[1200px] overflow-hidden bg-white font-sans text-[#0b0b0b]"
            style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.4)" }}
          >
            <div className="absolute inset-[1.8%] border-[7px] border-[#2a1fb5]" />

            <img src="/logo.png" alt="Gocyn" className="absolute left-[5.2%] top-[6.4%] h-[12%] w-[11%] object-contain" />
            <div className="absolute right-[5.2%] top-[6.5%] max-w-[45%] text-right">
              <h1 className="text-[clamp(12px,2.2vw,28px)] font-semibold tracking-tight text-[#111]">{certificateData.organization_name || "Gocyn"}</h1>
              <p className="mt-1 text-[clamp(7px,0.85vw,12px)] text-[#333]">{certificateData.organization_tagline || "Empowering Learning, Building Future."}</p>
            </div>

            <header className="absolute left-[5%] right-[5%] top-[17%] text-center">
              <h2 className="text-[clamp(28px,5.5vw,68px)] font-extrabold leading-none tracking-[0.02em] text-[#0b0b0b]">CERTIFICATE</h2>
              <p className="mt-[1.2%] text-[clamp(11px,1.6vw,20px)] font-normal tracking-[0.34em] text-[#111]">OF {certificateData.certificate_type === "course" ? "COMPLETION" : "INTERNSHIP"}</p>
              <div className="mx-auto mt-[1.1%] h-[3px] w-[9%] bg-[#2a1fb5]" />
            </header>

            <main className="absolute left-[8%] right-[8%] top-[38.5%] text-center">
              <p className="text-[clamp(10px,1.35vw,17px)]">This is to certify that</p>
              <h3 className="mx-auto mt-[1.3%] max-w-full truncate border-b border-[#666] px-[3%] pb-[0.8%] text-[clamp(18px,3.3vw,42px)] font-bold uppercase tracking-[0.02em] text-[#2a4aa8]">{certificateData.user_name}</h3>
              <p className="mt-[1.5%] text-[clamp(9px,1.2vw,15px)] text-[#333]">{certificateData.certificate_type === "course" ? "has successfully completed the course" : "has successfully completed an internship as"}</p>
              <div className="mx-auto mt-[1.4%] inline-flex max-w-[82%] items-center justify-center gap-[1.4%] border-[2px] border-[#2a4aa8] px-[3.5%] py-[1%] text-[#2a4aa8]">
                <FaCalendarAlt className="shrink-0 text-[clamp(11px,1.7vw,21px)]" />
                <span className="line-clamp-2 text-[clamp(12px,2vw,25px)] font-semibold leading-tight text-[#111]">{certificateData.course_title || certificateData.internship_title || "Course completion"}</span>
              </div>
              <p className="mx-auto mt-[1.8%] max-w-[72%] text-[clamp(8px,1vw,13px)] leading-relaxed text-[#333]">
                {certificateData.certificate_type === "course"
                  ? certificateData.description || `For successfully completing all required lessons of ${certificateData.course_title || "this course"}, demonstrating dedication and a keen learning attitude.`
                  : `During this period, ${certificateData.user_name?.split(" ")[0]} worked on various tasks including ${certificateData.description || "project development, problem solving, and demonstrating dedication and a keen learning attitude."}`}
              </p>
            </main>

            <div className="absolute left-[35%] top-[76%] flex max-w-[44%] items-center gap-[1.4%]">
              <FaCalendarAlt className="shrink-0 text-[clamp(17px,2.4vw,30px)] text-[#2a4aa8]" />
              <div className="min-w-0">
                <p className="text-[clamp(8px,1vw,13px)] uppercase tracking-wide text-[#2a4aa8]">{certificateData.start_date ? "Duration" : completedOn ? "Completed on" : "Certificate issued"}</p>
                <p className="text-[clamp(9px,1.2vw,16px)] font-semibold text-[#111]">{certificateData.start_date ? `${formatDate(certificateData.start_date)} - ${formatDate(certificateData.end_date || certificateDate)}` : formatDate(certificateDate)}</p>
              </div>
            </div>

            <div className="absolute bottom-[8.5%] left-[6%] w-[28%] text-center">
              <div className="border-t border-[#666] pt-[1.5%]">
                <p className="text-[clamp(9px,1.15vw,15px)] font-semibold">Authorized Signatory</p>
                <p className="text-[clamp(8px,1vw,13px)] text-[#333]">{certificateData.organization_name || "Gocyn"}</p>
              </div>
            </div>

            {qrImageUrl && <img crossOrigin="anonymous" src={qrImageUrl} alt="Scan to verify this certificate" className="absolute bottom-[18%] right-[5.5%] h-[10%] w-[10%] object-contain" />}
            <div className="absolute bottom-[6.5%] right-[5.5%] max-w-[25%] text-right text-[clamp(7px,0.8vw,11px)] leading-snug">
              <b className="block text-[clamp(8px,0.9vw,12px)]">Certificate ID</b><span className="mb-[1.5%] block break-all text-[#2a4aa8]">{certificateData.certificate_id}</span>
              <b className="block text-[clamp(8px,0.9vw,12px)]">Verify at</b><span className="block text-[#2a4aa8]">www.gocyn.com/verify</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-3 bg-blue-700 hover:bg-blue-800 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition disabled:opacity-70"
          >
            <FaDownload />
            {downloading ? "Generating PDF..." : "Download Certificate"}
          </button>

          <button
            onClick={() => {
              triggerConfetti();
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(
                  certificateData.certificate_type === "course"
                    ? `I completed ${certificateData.course_title || "a course"} at ${certificateData.organization_name || "Gocyn"}! 🎉`
                    : `I completed my internship at ${certificateData.organization_name || "Gocyn"}! 🎉`,
                )}`,
              );
            }}
            className="flex items-center gap-3 border-2 border-gray-700 hover:bg-gray-100 px-8 py-4 rounded-2xl font-medium"
          >
            <FaLinkedin size={24} /> Share on LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}
