"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("internlearn-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.dataset.theme = savedTheme || preferredTheme;
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const linkStyle = (href: string) =>
    `text-sm transition hover:text-violet-700 ${
      pathname === href ? "font-semibold text-violet-700" : "text-slate-600"
    }`;

  const handleLogout = async () => {
    await signOut(auth);
    closeMenu();
    router.push("/");
  };

  const toggleTheme = () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("internlearn-theme", nextTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/95 text-slate-900 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-md shadow-violet-200" aria-hidden="true">
            <svg viewBox="0 0 48 48" className="size-7" fill="none">
              <path d="M8 13.5c6.3-2.1 11.6-.9 16 3.2v20c-4.4-4.1-9.7-5.3-16-3.2v-20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M40 13.5c-6.3-2.1-11.6-.9-16 3.2v20c4.4-4.1 9.7-5.3 16-3.2v-20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="m34 5 1.5 3.5L39 10l-3.5 1.5L34 15l-1.5-3.5L29 10l3.5-1.5L34 5Z" fill="currentColor" />
            </svg>
          </span>
          <span>
            <span className="block font-semibold">InternLearn AI</span>
            <span className="block text-xs text-slate-500">Internee.pk learning assistant</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:hidden">
          <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle light and dark theme" title="Toggle theme">
            <svg viewBox="0 0 24 24" className="theme-icon-light" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
            <svg viewBox="0 0 24 24" className="theme-icon-dark" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" /></svg>
          </button>
          <button
            type="button"
            className="rounded-lg border border-violet-200 px-3 py-2 text-sm text-slate-700"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div className="hidden items-center gap-7 sm:flex">
          <Link href="/" className={linkStyle("/")}>Home</Link>
          <Link href="/project" className={linkStyle("/project")}>Guidelines</Link>
          <Link href="/dashboard" className={linkStyle("/dashboard")}>Dashboard</Link>
          <Link href="/chat" className={linkStyle("/chat")}>AI Tutor</Link>

          <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="Toggle light and dark theme" title="Toggle theme">
            <svg viewBox="0 0 24 24" className="theme-icon-light" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
            <svg viewBox="0 0 24 24" className="theme-icon-dark" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" /></svg>
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className={linkStyle("/login")}>Log in</Link>
              <Link
                href="/login?mode=signup"
                className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="grid gap-4 border-t border-violet-100 bg-white px-5 py-5 sm:hidden"
        >
          <Link href="/" onClick={closeMenu} className={linkStyle("/")}>Home</Link>
          <Link href="/project" onClick={closeMenu} className={linkStyle("/project")}>Guidelines</Link>
          <Link href="/dashboard" onClick={closeMenu} className={linkStyle("/dashboard")}>Dashboard</Link>
          <Link href="/chat" onClick={closeMenu} className={linkStyle("/chat")}>AI Tutor</Link>
          {user ? (
            <button type="button" onClick={handleLogout} className="text-left text-sm text-slate-600">
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={closeMenu} className={linkStyle("/login")}>Log in</Link>
              <Link href="/login?mode=signup" onClick={closeMenu} className="text-sm font-semibold text-violet-700">
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}