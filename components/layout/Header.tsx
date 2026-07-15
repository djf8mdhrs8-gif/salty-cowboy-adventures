"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";

const NAV = [
  { href: "/trips", label: "Trips & Charters" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/manage", label: "My Booking" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-tan-200/60 bg-cream-50/95 backdrop-blur">
      <div className="container-content flex h-16 items-center justify-between md:h-20">
        <Link href="/" aria-label="Salty Cowboy Adventures — home">
          <LogoLockup />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-navy-700 hover:text-coastal-600"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/trips" className="btn-primary !min-h-10 !px-5 !py-2 text-sm">
            Book Your Adventure
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-navy-800 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-tan-200/60 bg-cream-50 md:hidden"
        >
          <ul className="container-content flex flex-col py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-3 text-base font-semibold text-navy-800"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <Link href="/trips" className="btn-primary w-full" onClick={() => setOpen(false)}>
                Book Your Adventure
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
