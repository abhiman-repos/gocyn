"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdAdd,
  MdCurrencyRupee,
  MdDelete,
  MdEdit,
  MdBusiness,
  MdLocationOn,
  MdAccessTime,
  MdWarning,
  MdDescription,
  MdAssignmentTurnedIn,
  MdWorkOutline,
  MdCheckCircle
} from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_APP_URL;

export default function InternshipsPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/upload/internships/list/`);
      const data = await res.json();
      setInternships(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API}/upload/delete_internship/${deleteId}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInternships((prev) => prev.filter((item) => item._id !== deleteId));
        setDeleteId(null);
        setTimeout(() => setShowSuccess(true), 300);
        setTimeout(() => setShowSuccess(false), 2500);
      }
    } catch (err) {
      toast.error("Error deleting");
      console.error(err);
    }
  };
  const selectedForDelete = internships.find(i => i._id === deleteId);

  return (
    <div className="min-h-screen bg-gray-50/10 pb-10">
      {/* HEADER – responsive sizing */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-6 sm:py-8">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <MdWorkOutline className="text-indigo-600 text-2xl sm:text-[28px]" />
            Internships
          </h1>
        </div>

        <Link href="/admin/internships/add">
          <button
            title="Add Internship"
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 text-white  transition-colors hover:bg-indigo-700 active:scale-95 font-bold text-[10px] sm:text-xs uppercase tracking-widest"
          >
            <MdAdd className="text-lg" />
            <span className="whitespace-nowrap">Add Intern</span>
          </button>
        </Link>
      </div>

      {/* GRID – full responsive with tighter gaps on mobile */}
      <div className="px-4 sm:px-6 pb-10 max-w-[1700px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 bg-gray-100/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {internships.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-100 rounded-[20px] overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-xl transition-all group h-full "
                >
                  {/* IMAGE */}
                  <div className="relative h-40 w-full overflow-hidden bg-gray-50">
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />
                    <div className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase bg-green-500 text-white shadow-sm">
                      {item.status || "Active"}
                    </div>
                  </div>

                  {/* CONTENT – already tight, fine on mobile */}
                  <div className="p-2.5 flex flex-col flex-1">
                    <h2 className="text-[11px] font-black text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight mb-1.5">
                      {item.title}
                    </h2>
                    
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold">
                        <MdBusiness className="text-indigo-600 text-xs shrink-0" />
                        <span className="truncate">{item.company}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-medium">
                        <MdLocationOn className="text-indigo-600 text-xs shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-medium">
                        <MdAccessTime className="text-indigo-600 text-xs shrink-0" />
                        <span>{item.duration || "N/A"}</span>
                      </div>

                      <div className="pt-1 border-t border-gray-50 space-y-1.5 mt-1">
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-medium leading-none">
                          <MdDescription className="text-indigo-400 text-[10px] shrink-0" />
                          <p className="line-clamp-1">{item.description || "No info"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-medium leading-none">
                          <MdAssignmentTurnedIn className="text-indigo-400 text-[10px] shrink-0" />
                          <p className="line-clamp-1">{item.requirements || "No skills"}</p>
                        </div>
                      </div>
                    </div>

                    {/* PRICE & BUTTONS */}
                    <div className="mt-2 pt-1.5 border-t border-gray-50 flex flex-col gap-1">
                      <div className="flex items-center text-emerald-600 font-black text-[11px] mb-0.5">
                        <MdCurrencyRupee className="text-[9px]" />
                        {item.stipend || "0"}
                      </div>

                      <div className="flex flex-col gap-1">
                        <Link href={`/admin/internships/edit/${item._id}`}>
                          <button className="w-full py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1 font-bold text-[9px] uppercase tracking-wider">
                            <MdEdit className="text-[14px]" /> edit profile
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(item._id)}
                          className="w-full py-1.5 rounded-md bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                        >
                          <MdDelete className="text-[14px]" /> delete your profile
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION DIALOG – responsive */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px] p-4 sm:p-8 max-w-[90%] sm:max-w-[380px] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 outline-none mx-auto">
          <AlertDialogHeader className="flex flex-col items-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mb-2 ring-8 ring-red-50/50"
            >
              <MdWarning className="text-red-500 text-2xl sm:text-3xl" />
            </motion.div>

            <AlertDialogTitle className="text-lg sm:text-xl font-bold text-center text-gray-900 tracking-tight">
              Delete Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-center text-sm font-medium leading-relaxed">
              You are about to delete <span className="text-gray-900 font-bold bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-200">"{selectedForDelete?.title}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 sm:mt-8 flex flex-row gap-3 w-full">
            <AlertDialogCancel className="flex-1 mt-0 h-11 rounded-xl font-bold uppercase text-[10px] tracking-wider bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 h-11 rounded-xl font-bold uppercase text-[10px] tracking-wider text-white border-none shadow-md shadow-red-200 transition-all"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUCCESS DIALOG – responsive */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-[24px] p-4 sm:p-8 max-w-[90%] sm:max-w-[380px] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 flex flex-col items-center justify-center text-center outline-none mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50"
          >
            <MdCheckCircle className="text-emerald-500 text-2xl sm:text-3xl" />
          </motion.div>

          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl font-bold text-center text-gray-900 tracking-tight">
              Successfully Deleted
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-center text-sm font-medium mt-2 leading-relaxed">
              The record has been permanently removed from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 sm:mt-8 w-full sm:justify-center">
            <AlertDialogAction
              onClick={() => setShowSuccess(false)}
              className="w-full bg-gray-900 hover:bg-gray-800 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest border-none shadow-md shadow-gray-300 text-white transition-all"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}