"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/icons";
import { useTracker } from "@/components/TrackerProvider";
import { buttonStyles } from "@/components/ui";
import { logout } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/dispatches", label: "Dispatches" },
  { href: "/inventory", label: "Inventory" },
];

function NavLinks() {
  const pathname = usePathname();
  return NAV_LINKS.map(({ href, label }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold transition-all duration-300 ${
          active
            ? "bg-indigo-50/80 text-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20"
            : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
        }`}
      >
        {label}
      </Link>
    );
  });
}

export function AppHeader() {
  const { openModal } = useTracker();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/50 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 transition-transform hover:scale-105">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold tracking-wide text-white shadow-lg shadow-indigo-500/30">
            SR
          </span>
          <span className="font-bold tracking-tight text-slate-900 text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Slip Ring Tracker</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex ml-4">
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => openModal({ kind: "receive" })}
            className={`${buttonStyles.primary}`}
          >
            <PlusIcon />
            <span className="hidden sm:inline">New receiving</span>
            <span className="sm:hidden">Receive</span>
          </button>
          
          <button
            type="button"
            onClick={() => logout()}
            className={`${buttonStyles.secondary} px-3 py-1.5 text-sm font-semibold`}
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 border-t border-white/40 bg-white/30 px-3 py-3 md:hidden">
        <NavLinks />
      </nav>
    </header>
  );
}
