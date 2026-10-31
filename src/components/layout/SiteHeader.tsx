"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/paths", label: "Learning paths" },
  { href: "/challenges", label: "CTF" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      const supabase = createBrowserSupabase();
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setAuthed(Boolean(data.user));
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthed(Boolean(session?.user));
      });
      return () => {
        mounted = false;
        data.subscription.unsubscribe();
      };
    } catch {
      return;
    }
  }, []);

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-bg-panel focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-mono text-sm tracking-widest text-neon">
          HLA://hacklab
        </Link>
        <button
          type="button"
          className="border border-line px-3 py-1 font-mono text-xs md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav
          className={cn(
            "absolute left-0 right-0 top-full flex-col gap-1 border-b border-line bg-bg p-4 md:static md:flex md:flex-row md:items-center md:gap-4 md:border-0 md:bg-transparent md:p-0",
            open ? "flex" : "hidden md:flex",
          )}
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-mono text-xs uppercase tracking-wide text-muted hover:text-neon",
                pathname === link.href && "text-neon",
              )}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {authed ? (
            <>
              <Link href="/dashboard" className="font-mono text-xs text-neon">
                Dashboard
              </Link>
              <button type="button" onClick={logout} className="font-mono text-xs text-muted">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-mono text-xs">
                Login
              </Link>
              <Link
                href="/register"
                className="border border-neon px-3 py-1 font-mono text-xs text-neon"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
