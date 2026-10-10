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
        className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors ${
          active
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold tracking-wide text-white">
            SR
          </span>
          <span className="font-semibold tracking-tight">Slip Ring Tracker</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
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
            className={`${buttonStyles.secondary} px-3 py-1.5 text-sm`}
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 border-t border-slate-100 px-3 py-2 md:hidden">
        <NavLinks />
      </nav>
    </header>
  );
}
