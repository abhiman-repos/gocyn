import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Users } from "lucide-react";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    instructor?: string;
    category?: string;
    rating?: number;
    reviewsCount?: number;
    duration?: string;
    enrolledStudents?: number;
    price?: string | number;
    originalPrice?: number;
    discountedPrice?: number;
    discountPercent?: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const price = Number(course.discountedPrice ?? (course.price === "Free" ? 0 : course.price) ?? 0);
  const originalPrice = Number(course.originalPrice ?? price);
  return (
    <Link
      href={`/course/${course._id}`}
      className="group block w-[300px] border border-slate-200 bg-white overflow-hidden
                 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <Image
          src={course.thumbnail || "/placeholder.jpg"}
          alt={course.title}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {!!course.discountPercent && course.discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 shadow">
            {course.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
          <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1">
            {course.category || "Course"}
        </span>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2 min-h-[40px]">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-xs text-gray-500">by {course.instructor || "Expert Instructor"}</p>

        {/* Meta Row */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {course.rating != null && (
              <>
                <span className="font-semibold text-gray-800">{course.rating}</span>
                <span className="text-gray-400">({course.reviewsCount ?? 0})</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{course.duration || "Self-paced"}</span>
          </div>

          {course.enrolledStudents != null && <div className="flex items-center gap-1">
            <Users size={13} />
            <span>{course.enrolledStudents.toLocaleString()}</span>
          </div>}
        </div>

        {/* Price */}
        <div className="pt-1 flex items-end gap-2">
          <span className="text-lg font-bold text-gray-900">
            {price === 0 ? "Free" : `₹${price.toLocaleString()}`}
          </span>
          {originalPrice > price && (
            <span className="text-sm text-gray-400 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
