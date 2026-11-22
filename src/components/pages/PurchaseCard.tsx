import { Award, FileText, Loader2, MonitorPlay, PlayCircle, Shield } from "lucide-react";
import { JSX } from "react";

export default function PurchaseCard({
  videoId,
  thumbnail,
  title,
  price,
  duration,
  isEnrolled,
  isEnrolling,
  onEnroll,
  totalLessons,
  materialCount = 0,
  progress = 0,
  actionLabel,
}: {
  videoId: string;
  thumbnail?: string;
  title?: string;
  price: string | number;
  duration: string;
  isEnrolled: boolean;
  isEnrolling: boolean;
  onEnroll: () => void;
  totalLessons?: number;
  materialCount?: number;
  progress?: number;
  actionLabel?: string;
}): JSX.Element {
  const numericPrice = Number(price);
  const isFree = price === "Free" || !Number.isFinite(numericPrice) || numericPrice <= 0;

  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
      {/* Video Preview */}
      <div className="relative aspect-video bg-slate-900">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            className="w-full h-full absolute inset-0"
            allowFullScreen
            title="Course Preview"
          />
        ) : thumbnail ? (
          <div className="absolute inset-0">
            <img src={thumbnail} alt={title ? `${title} course thumbnail` : "Course thumbnail"} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/15" />
            <div className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center border border-white/70 bg-slate-950/70 text-white"><PlayCircle size={30} /></span></div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-300">
            <PlayCircle size={42} className="mb-2 opacity-70" />
            <p className="text-sm font-medium">{title || "Course preview"}</p>
          </div>
        )}
        {videoId && <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1 text-[11px] font-medium text-white">Preview</div>}
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6">
        {title && <h2 className="mb-3 line-clamp-2 text-lg font-bold leading-snug text-slate-900">{title}</h2>}
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {isFree ? "Free" : `₹${price}`}
          </h2>
        </div>

        <button
          type="button"
          onClick={onEnroll}
          disabled={isEnrolling}
          aria-label={isEnrolled ? "Resume your course" : isFree ? "Enroll in this course" : "Purchase this course"}
          className={`flex w-full items-center justify-center gap-2 border px-4 py-3.5 text-[15px] font-semibold transition-colors ${
            isEnrolled
              ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
              : isEnrolling
                ? "cursor-wait border-indigo-400 bg-indigo-400 text-white"
                : "border-indigo-700 bg-indigo-700 text-white hover:bg-indigo-800"
          }`}
        >
          {isEnrolling && <Loader2 size={18} className="animate-spin" />}
          {isEnrolled
            ? "Resume course"
            : isEnrolling
              ? "Processing..."
              : actionLabel || (isFree ? "Enroll for free" : "Buy course")}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Shield size={13} className="text-slate-400" />
          <span>{isFree ? "Free enrollment · start learning right away" : "Secure checkout via Razorpay"}</span>
        </div>

        <div className="my-5 border-t border-slate-100" />

        {isEnrolled && <div className="mb-5 border border-indigo-100 bg-indigo-50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">Your progress</span><span className="font-bold text-indigo-700">{Math.max(0, Math.min(100, progress))}%</span></div>
          <div className="h-1.5 bg-white"><div className="h-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
        </div>}
        <div className="space-y-3.5">
          <h3 className="font-semibold text-slate-900 text-sm">
            This course includes:
          </h3>
          {[
            {
              icon: <MonitorPlay size={16} />,
              text: `${duration} on-demand video`,
            },
            {
              icon: <FileText size={16} />,
              text: `${totalLessons || 0} lessons`,
            },
            ...(materialCount > 0 ? [{ icon: <FileText size={16} />, text: `${materialCount} downloadable ${materialCount === 1 ? "resource" : "resources"}` }] : []),
            { icon: <Award size={16} />, text: "Certificate after course completion" },
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-600">
              <div className="text-indigo-500 shrink-0">{feat.icon}</div>
              <span className="text-sm">{feat.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
