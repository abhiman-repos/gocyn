"use client";

import Link from "next/link";
import {
  Clock,
  XCircle,
  ShieldAlert,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Mail,
} from "lucide-react";
import type { InstructorStatus } from "../libs/instructors";

type ReviewableStatus = Exclude<InstructorStatus, "approved">;

interface PartnerReviewStatusProps {
  status: ReviewableStatus;
  reviewNote?: string;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  credentialScore?: number;
  onLogout: () => void;
  onRefresh?: () => void;
}

const CONFIG = {
  pending: {
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeLabel: "Under Review",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-200",
    title: "Your application is under review",
    description:
      "Our team is verifying your credentials. You'll be notified by email once a decision is made.",
    noteLabel: null as string | null,
    notePlaceholder: null as string | null,
    showReapply: false,
    eta: (score?: number) => {
      if (typeof score !== "number") return "Typically within 24–48 hours";
      if (score >= 70) return "Typically within 24 hours";
      if (score >= 45) return "Typically within 24–48 hours";
      return "May take 2–3 days while we verify additional details";
    },
  },
  rejected: {
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badgeLabel: "Not Approved",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
    title: "Your application was not approved",
    description:
      "Unfortunately your profile didn't meet our current quality bar. You can review the reason below and reach out to our team.",
    noteLabel: "Reason from reviewer",
    notePlaceholder:
      "No specific reason was provided. Please contact support for more details.",
    showReapply: true,
    eta: () => null,
  },
  suspended: {
    icon: ShieldAlert,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badgeLabel: "Suspended",
    badgeCls: "bg-red-100 text-red-800 border-red-200",
    title: "Your account has been suspended",
    description:
      "Access to your partner dashboard is temporarily restricted. Please reach out to our support team to resolve this.",
    noteLabel: "Note from admin",
    notePlaceholder:
      "No additional details were provided. Please contact support.",
    showReapply: false,
    eta: () => null,
  },
} as const;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PartnerReviewStatus({
  status,
  reviewNote,
  reviewedAt,
  submittedAt,
  credentialScore,
  onLogout,
  onRefresh,
}: PartnerReviewStatusProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  const eta = cfg.eta(credentialScore);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Status card */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="p-6 sm:p-10 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
              >
                <Icon className={`w-7 h-7 ${cfg.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${cfg.badgeCls} mb-2`}
                >
                  {cfg.badgeLabel}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {cfg.title}
                </h1>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {cfg.description}
                </p>
                {eta && (
                  <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {eta}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin note */}
          {cfg.noteLabel && (
            <div className="p-6 sm:p-10 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                {cfg.noteLabel}
              </p>
              <div className="bg-gray-50 border border-gray-100 p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {reviewNote?.trim()
                  ? reviewNote
                  : cfg.notePlaceholder ?? "No details provided."}
              </div>
              {reviewedAt && (
                <p className="mt-2 text-xs text-gray-400">
                  Reviewed on {formatDate(reviewedAt)}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="p-6 sm:p-10 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetaCell
              label="Submitted on"
              value={formatDate(submittedAt)}
            />
            <MetaCell
              label="Credential score"
              value={
                typeof credentialScore === "number"
                  ? `${credentialScore} / 100`
                  : "—"
              }
              score={credentialScore}
            />
          </div>

          {/* Actions */}
          <div className="p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check status
                </button>
              )}
              <Link
                href="mailto:support@gocyn.com"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <Mail className="w-4 h-4" />
                Contact support
              </Link>
              {cfg.showReapply && (
                <Link
                  href="/instructors/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
                >
                  Reapply
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Every application is reviewed by a human. Thanks for your patience.
        </p>
      </div>
    </div>
  );
}

function MetaCell({
  label,
  value,
  score,
}: {
  label: string;
  value: string;
  score?: number;
}) {
  const barCls =
    typeof score !== "number"
      ? "bg-gray-300"
      : score >= 70
        ? "bg-green-500"
        : score >= 45
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
      {typeof score === "number" && (
        <div className="h-1 w-full bg-gray-200 mt-2 overflow-hidden">
          <div
            className={`h-full ${barCls}`}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}
