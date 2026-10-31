"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-16 border-t border-line bg-bg-raised">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <p className="font-mono text-sm text-neon">HackLab Academy</p>
          <p className="mt-2 text-sm text-muted">
            Authorized cybersecurity training. Offensive exercises stay inside isolated labs.
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-muted">Campus</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/courses">Courses</Link>
            </li>
            <li>
              <Link href="/paths">Learning paths</Link>
            </li>
            <li>
              <Link href="/challenges">CTF challenges</Link>
            </li>
            <li>
              <Link href="/leaderboard">Leaderboard</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-muted">Academy</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/terminal">Training terminal</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase text-muted">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of service</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center font-mono text-xs text-muted">
        © {new Date().getFullYear()} HackLab Academy. Training use only.
      </p>
    </footer>
  );
}
