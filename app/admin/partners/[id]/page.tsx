"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_APP_URL;

interface PartnerDetails {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  currentRole: string;
  company: string;
  yearsOfExperience: string;
  expertise: string[];
  skills: string;
  linkedinProfile: string;
  portfolioUrl: string;
  bio: string;
  offeringType: string[];
  teachingStyle: string;
  targetAudience: string;
  priceRange: string;
  weeklyAvailability: string;
  preferredLanguages: string[];
  pastMentoringExp: string;
  achievements: string;
  aadhaarNumber?: string;
  panNumber?: string;
  profilePhotoUrl?: string;
  aadhaarFileUrl?: string;
  panFileUrl?: string;
  resumeFileUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  agreeToTerms: boolean;
  agreeToBackground: boolean;
}

export default function PartnerDetailPage() {
  const router = useRouter();
  const [instructors, setPartner] = useState<PartnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    fetchPartner();
  }, [id]);

  const fetchPartner = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API}/api/instructors/requests/profile/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch instructors");
      setPartner(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: "approved" | "rejected") => {
    if (!instructors) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API}/api/instructors/requests/${id}/status/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setPartner({ ...instructors, status: newStatus });
      // Optional: show success toast
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this instructors application? This action cannot be undone.",
      )
    ) {
      return;
    }
    setUpdating(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/instructors/requests/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      alert("Partner deleted successfully");
      router.push("/admin/instructors"); // redirect back to list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const renderFileWithPreview = (url: string | undefined, label: string) => {
    if (!url)
      return <span className="text-gray-400 text-sm">Not uploaded</span>;

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    const isPdf = url.endsWith(".pdf");

    return (
      <div className="mt-1">
        <button
          onClick={() => setExpandedFile(expandedFile === url ? null : url)}
          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
        >
          {expandedFile === url ? "Hide" : "Preview"} {label}
          <ExternalLink size={12} />
        </button>
        {expandedFile === url && (
          <div className="mt-2 border rounded-lg p-2 bg-gray-50">
            {isImage ? (
              <img
                src={url}
                alt={label}
                className="max-w-full max-h-96 object-contain mx-auto"
              />
            ) : isPdf ? (
              <iframe
                src={url}
                className="w-full h-96 border-0 rounded"
                title={label}
              />
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                Download file
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error || !instructors) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error || "Partner not found"}
        </div>
        <Link href="/admin/instructors" className="mt-4 inline-block text-blue-600">
          ← Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/instructors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back to requests
        </Link>
        <div className="flex gap-3">
          {instructors.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("approved")}
                disabled={updating}
                className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle size={18} /> Approve
              </button>
              <button
                onClick={() => updateStatus("rejected")}
                disabled={updating}
                className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle size={18} /> Reject
              </button>

              <div className="flex gap-3">
                {instructors.status === "pending" && (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={updating}
                      className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  </>
                )}
                {instructors.status !== "pending" && (
                  <>
                    <span className="...">
                      {instructors.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                    <button
                      onClick={handleDelete}
                      disabled={updating}
                      className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          {instructors.status !== "pending" && (
            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">
              {instructors.status === "approved" ? "✓ Approved" : "✗ Rejected"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-6">
          {instructors.profilePhotoUrl ? (
            <img
              src={instructors.profilePhotoUrl}
              alt={instructors.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <File size={32} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {instructors.fullName}
            </h1>
            <p className="text-gray-500">
              {instructors.email} • {instructors.phone}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Applied on{" "}
              {new Date(instructors.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Personal & Professional */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Professional Info
            </h2>
            <div className="space-y-3">
              <Info label="Role" value={instructors.currentRole} />
              <Info label="Company" value={instructors.company} />
              <Info
                label="Experience"
                value={`${instructors.yearsOfExperience} years`}
              />
              <Info label="Expertise" value={instructors.expertise?.join(", ")} />
              <Info label="Skills" value={instructors.skills} />
              <Info label="LinkedIn" value={instructors.linkedinProfile} isLink />
              <Info label="Portfolio" value={instructors.portfolioUrl} isLink />
              <Info label="Bio" value={instructors.bio} multiline />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Offerings & Mentorship
            </h2>
            <div className="space-y-3">
              <Info
                label="Offering Types"
                value={instructors.offeringType?.join(", ")}
              />
              <Info label="Teaching Style" value={instructors.teachingStyle} />
              <Info label="Target Audience" value={instructors.targetAudience} />
              <Info label="Price Range" value={instructors.priceRange} />
              <Info
                label="Weekly Availability"
                value={`${instructors.weeklyAvailability} hrs/week`}
              />
              <Info
                label="Languages"
                value={instructors.preferredLanguages?.join(", ")}
              />
              <Info
                label="Past Mentoring Exp"
                value={instructors.pastMentoringExp}
                multiline
              />
              <Info
                label="Achievements"
                value={instructors.achievements}
                multiline
              />
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Verification & Documents
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Aadhaar Number
              </p>
              <p className="text-gray-800">{instructors.aadhaarNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                PAN Number
              </p>
              <p className="text-gray-800">{instructors.panNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Aadhaar Card
              </p>
              {renderFileWithPreview(instructors.aadhaarFileUrl, "Aadhaar")}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                PAN Card
              </p>
              {renderFileWithPreview(instructors.panFileUrl, "PAN")}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Resume / CV
              </p>
              {renderFileWithPreview(instructors.resumeFileUrl, "Resume")}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Agreed to Terms:</span>{" "}
              {instructors.agreeToTerms ? "Yes" : "No"} &nbsp;|&nbsp;
              <span className="font-semibold">
                Background Check Consent:
              </span>{" "}
              {instructors.agreeToBackground ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying info rows
function Info({
  label,
  value,
  isLink = false,
  multiline = false,
}: {
  label: string;
  value?: string;
  isLink?: boolean;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      {isLink ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm break-all"
        >
          {value}
        </a>
      ) : multiline ? (
        <p className="text-gray-800 text-sm whitespace-pre-wrap mt-1">
          {value}
        </p>
      ) : (
        <p className="text-gray-800 text-sm break-words">{value}</p>
      )}
    </div>
  );
}
