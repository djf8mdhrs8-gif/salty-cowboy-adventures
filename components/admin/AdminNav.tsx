"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Ship,
  CalendarOff,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/trips", label: "Trips & Add-ons", icon: Ship },
  { href: "/admin/availability", label: "Availability", icon: CalendarOff },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The login page renders without chrome.
  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <LogoMark className="h-9 w-9" />
        <span className="font-heading text-sm font-bold uppercase tracking-widest text-cream-50">
          SCA Admin
        </span>
      </div>
      <ul className="flex-1 space-y-1 px-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold ${
                  active
                    ? "bg-coastal-700 text-white"
                    : "text-navy-100 hover:bg-navy-700 hover:text-white"
                }`}
              >
                <link.icon className="h-5 w-5" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-2 pb-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-navy-100 hover:bg-navy-700 hover:text-white"
        >
          <LogOut className="h-5 w-5" aria-hidden /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-navy-900 px-4 py-3 lg:hidden">
        <span className="font-heading text-sm font-bold uppercase tracking-widest text-cream-50">
          SCA Admin
        </span>
        <button
          type="button"
          className="rounded-md p-2 text-cream-50"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open ? <div className="bg-navy-900 lg:hidden">{nav}</div> : null}

      <aside className="hidden bg-navy-900 lg:block">{nav}</aside>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
