/**
 * Salty Cowboy Adventures mark — inline SVG placeholder inspired by the brand
 * logo: cowboy hat over rolling waves inside a rope ring. Swap for the real
 * logo asset in /public when available.
 */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      {/* rope ring */}
      <circle cx="32" cy="32" r="29" fill="none" stroke="#c8a878" strokeWidth="3" strokeDasharray="5 3" />
      <circle cx="32" cy="32" r="25.5" fill="#1b2c42" />
      {/* cowboy hat */}
      <path
        d="M20 30c1-6 4-11 12-11s11 5 12 11c3 .4 5 1.4 5 2.6 0 2-7.6 3.6-17 3.6s-17-1.6-17-3.6c0-1.2 2-2.2 5-2.6z"
        fill="#d1b892"
      />
      <path d="M26 29.5c0-4 2.5-7 6-7s6 3 6 7c-2 .8-10 .8-12 0z" fill="#bd9a6c" />
      {/* waves */}
      <path
        d="M10 44c4-3 8-3 11 0s7 3 11 0 8-3 11 0 7 3 11 0"
        fill="none"
        stroke="#83bfd0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14 50c3.5-2.5 7-2.5 10 0s7 2.5 10 0 6.5-2.5 10 0"
        fill="none"
        stroke="#569fb6"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoLockup({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-10 w-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-heading text-lg font-bold tracking-wide ${dark ? "text-cream-50" : "text-navy-900"}`}
        >
          Salty Cowboy
        </span>
        <span
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${dark ? "text-coastal-300" : "text-coastal-600"}`}
        >
          Adventures
        </span>
      </span>
    </span>
  );
}
