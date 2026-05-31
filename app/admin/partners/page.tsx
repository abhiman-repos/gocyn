"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { useParams } from "next/navigation";

const API =  process.env.NEXT_PUBLIC_APP_URL;

type RequestStatus = "pending" | "approved" | "rejected";

interface MentorRequest {
  _id: string;
  fullName: string;
  email: string;
  currentRole: string;
  company: string;
  createdAt: string;
  status: RequestStatus;
  profilePhotoUrl?: string;
}

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const adminToken = localStorage.getItem("token");
      if (!adminToken) throw new Error("Admin not logged in");

      const url = statusFilter === "all" 
        ? `${API}/api/partner/requests/` 
        : `${API}/api/partner/requests/?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to fetch requests");
      
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const search = searchTerm?.toLowerCase() || "";
    const fullName = req.fullName?.toLowerCase() || "";
    const email = req.email?.toLowerCase() || "";
    return fullName.includes(search) || email.includes(search);
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={14}/> Approved</span>;
      case "rejected":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle size={14}/> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1"><Clock size={14}/> Pending</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Requests</h1>
          <p className="text-gray-500 mt-.1">Review and manage mentor applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-blue-900" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-5 py-2 text-sm font-medium transition-all ${
                statusFilter === s 
                  ? "bg-blue-600 text-white" 
                  : "bg-white border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-500 border-b border-gray-200 uppercase">
              <tr>
                <th className="p-4">Applicant</th>
                <th className="p-4">Role & Company</th>
                <th className="p-4">Applied On</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    No {statusFilter !== "all" ? statusFilter : ""} requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {req.profilePhotoUrl && (
                          <img 
                            src={req.profilePhotoUrl} 
                            alt={req.fullName}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{req.fullName}</div>
                          <div className="text-xs text-gray-500">{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-800">{req.currentRole}</div>
                      <div className="text-xs text-gray-500">{req.company}</div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/admin/partners/${req._id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-400 text-white hover:bg-blue-700  text-sm font-medium transition-colors"
                      >
                        <Eye size={16} /> Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}