import { Suspense } from "react";
import SearchContent from "@/app/search/search/SearchContent";

export default function Mentors() {
  return (
    <Suspense
      fallback={
        <div role="status" className="flex min-h-[60vh] items-center justify-center bg-[#fcfcfc] px-4 text-sm text-slate-500">
          Loading mentors…
        </div>
      }
    >
      <SearchContent scope="mentor" />
    </Suspense>
  );
}
