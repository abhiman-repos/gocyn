import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[65vh] items-center justify-center bg-white px-6 py-16 text-slate-900">
      <div className="w-full max-w-xl border border-slate-200 px-8 py-12 text-center sm:px-14">
        <Link href="/" aria-label="Gocyn home" className="inline-flex">
          <Image src="/logo.png" alt="Gocyn" width={180} height={60} className="h-auto w-40 object-contain" priority />
        </Link>
        <p className="mt-12 text-sm font-bold uppercase tracking-[0.25em] text-indigo-700">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">This page isn’t here.</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
          The link may be outdated, or the page may have moved. Head back to Gocyn and continue from there.
        </p>
        <Link href="/" className="mt-8 inline-flex border border-indigo-700 bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800">
          Return to home
        </Link>
      </div>
    </section>
  );
}
