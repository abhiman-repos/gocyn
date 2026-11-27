"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Search, Briefcase, ChevronRight, Sparkles, IndianRupee } from "lucide-react";

export default function InternshipPage({ initialInternships }: { initialInternships: any[] }) {
  const [internships, setInternships] = useState<any[]>(initialInternships);
  const loading = false;
  const [search, setSearch] = useState("");

  const filtered = internships.filter((item) =>
    [item.title, item.company, item.description].some(field =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-10">
      {/* HERO SECTION */}

      {/* LISTING SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-400 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6"
          >
            <Sparkles size={14} />
            <span>Career Opportunities</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-4 sm:mb-6">
            Find an internship. Build experience.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Explore internship opportunities, build experience, and take your next step at work.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[380px] sm:h-[420px] bg-white rounded-3xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
          >
            <AnimatePresence>
              {filtered.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group bg-white w-full rounded-3xl border border-slate-200 hover:border-blue-300 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col h-full"
                >
                  {/* IMAGE PREVIEW */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                      <span className="bg-white/90 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] font-bold text-slate-900 uppercase tracking-tighter shadow-sm">
                        {item.company}
                      </span>
                    </div>

                    <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] font-bold text-white shadow-lg ${item.status === "Active" ? "bg-emerald-500" : "bg-slate-500"
                      }`}>
                      {item.status}
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="p-4 sm:p-6 flex flex-col flex-grow">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 sm:mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-auto space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 rounded-lg text-slate-600 text-xs font-medium">
                          <Clock size={14} className="text-blue-500" />
                          <span className="whitespace-nowrap">{item.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 rounded-lg text-slate-600 text-xs font-medium">
                          <MapPin size={14} className="text-indigo-500" />
                          <span className="whitespace-nowrap">{item.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
                        {/* Stipend - Icon + Amount ek line mein */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <IndianRupee size={16} className="text-green-600 sm:w-4.5 sm:h-4.5" />
                          <span className="text-lg sm:text-xl font-black text-slate-900">{item.stipend}</span>
                        </div>

                        <Link
                          href={`/internship/${item._id}`}
                          className="flex items-center gap-1 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-all active:scale-95"
                        >
                          <span className="whitespace-nowrap">View Details</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 sm:py-32"
          >
            <div className="bg-slate-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Briefcase className="text-slate-400" size={28} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">No results found</h3>
            <p className="text-sm sm:text-base text-slate-500">Try adjusting your search filters or keywords.</p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
