"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/chat") return null;

  return (
    <footer className="border-t border-violet-100 bg-white text-slate-600">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <Link href="/" className="text-lg font-semibold text-slate-900">
            InternLearn AI
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            A personal AI tutor for Internee.pk interns, with course-focused
            guidance, adaptive practice, and progress tracking.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">Learning</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/dashboard" className="hover:text-violet-700">Dashboard</Link>
            <Link href="/chat" className="hover:text-violet-700">Ask the AI tutor</Link>
            <Link href="/#features" className="hover:text-violet-700">How it helps</Link>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">Your account</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/login" className="hover:text-violet-700">Log in</Link>
            <Link href="/login?mode=signup" className="hover:text-violet-700">Create an account</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-violet-100">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-slate-500 sm:px-8">
          © {new Date().getFullYear()} InternLearn AI. A learning companion for Internee.pk interns.
        </p>
      </div>
    </footer>
  );
}