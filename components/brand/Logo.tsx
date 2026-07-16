import Image from "next/image";

/**
 * Salty Cowboy Adventures brand marks, using the official transparent-PNG
 * badge at /public/logo.png (rope ring, cowboy hat over the wordmark, the
 * 2018 24ft Skeeter, palm and lighthouse, longhorn skull).
 *
 * The badge artwork is mostly deep navy/tan, so on dark surfaces the mark is
 * set inside a cream disc for contrast (invisible on cream page backgrounds).
 */

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-cream-50 ${className}`}
    >
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes="80px"
        className="object-contain p-0.5"
      />
    </span>
  );
}

/** Full badge for marketing placements (home page intro, etc.). */
export function LogoBadge({
  className = "w-full max-w-md",
  label = "Salty Cowboy Adventures Inc. — Explore More. Live Salty.",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={`relative block ${className}`} style={{ aspectRatio: "1" }}>
      <Image
        src="/logo.png"
        alt={label}
        fill
        sizes="(max-width: 640px) 90vw, 28rem"
        className="object-contain"
      />
    </span>
  );
}

export function LogoLockup({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-10 w-10" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-heading text-lg font-bold tracking-wide ${dark ? "text-cream-50" : "text-navy-900"}`}
        >
          Salty Cowboy
        </span>
        <span
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.25em] ${dark ? "text-coastal-300" : "text-coastal-600"}`}
        >
          Adventures Inc
        </span>
      </span>
    </span>
  );
}
