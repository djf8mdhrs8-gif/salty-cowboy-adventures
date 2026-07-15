/**
 * Salty Cowboy Adventures brand marks, drawn to match the official logo:
 * a rope-ring badge with a cowboy hat over arched "SALTY COWBOY" lettering,
 * a Skeeter-style center-console boat on the water, palm, lighthouse, and
 * longhorn skull, in muted navy/tan/cream/coastal blue.
 *
 * To use the original raster logo instead, drop it at /public/logo.png and
 * swap these components for <Image src="/logo.png" …/>.
 */

const C = {
  navy: "#1b2c42",
  navyDeep: "#131f30",
  rope: "#8a6a42",
  ropeLight: "#c8a878",
  tan: "#d1b892",
  tanDark: "#a8875a",
  cream: "#faf5e8",
  water: "#569fb6",
  waterDeep: "#3c5f88",
  sun: "#ddb181",
};

/** Compact mark for headers/favicons: hat over waves in a rope ring. */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="29" fill={C.cream} stroke={C.rope} strokeWidth="3" strokeDasharray="5 3" />
      {/* cowboy hat */}
      <path
        d="M17 33.5c.6-1 4.5-2.2 7.5-2.6 1-5.5 3.5-9.9 7.5-9.9s6.5 4.4 7.5 9.9c3 .4 6.9 1.6 7.5 2.6.5 1-8 3-15 3s-15.5-2-15-3z"
        fill={C.tan}
        stroke={C.tanDark}
        strokeWidth="1"
      />
      <path d="M26.5 31c.2-4.2 2.4-7.5 5.5-7.5s5.3 3.3 5.5 7.5c-1.8.7-9.2.7-11 0z" fill={C.tanDark} />
      <path d="M27.5 28.5h9" stroke={C.navy} strokeWidth="1.6" />
      {/* waves */}
      <path
        d="M12 44c3.6-2.8 7.2-2.8 10 0s6.4 2.8 10 0 7.2-2.8 10 0 6.4 2.8 10 0"
        fill="none"
        stroke={C.water}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M16 50c3.2-2.3 6.4-2.3 9.5 0s6.3 2.3 9.5 0 6.3-2.3 9.5 0"
        fill="none"
        stroke={C.waterDeep}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Full badge recreation of the logo for hero/marketing placements.
 * Scales cleanly; decorative (pass context via the aria-label).
 */
export function LogoBadge({
  className = "w-full max-w-md",
  label = "Salty Cowboy Adventures Inc. — Explore More. Live Salty.",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={label}>
      <defs>
        {/* gentle arc across the upper third for the brand name */}
        <path id="arc-top" d="M 48 178 A 190 190 0 0 1 352 178" fill="none" />
        {/* low arc hugging the ring for the motto */}
        <path id="arc-bottom" d="M 82 280 A 140 140 0 0 0 318 280" fill="none" />
      </defs>

      {/* background + rope ring */}
      <circle cx="200" cy="200" r="196" fill={C.cream} />
      <circle cx="200" cy="200" r="184" fill="none" stroke={C.rope} strokeWidth="7" strokeDasharray="10 5" />
      <circle cx="200" cy="200" r="174" fill="none" stroke={C.ropeLight} strokeWidth="2.5" />

      {/* arched brand name */}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="33"
        fontWeight="bold"
        letterSpacing="2"
        fill={C.navy}
      >
        <textPath href="#arc-top" startOffset="50%" textAnchor="middle">
          SALTY COWBOY
        </textPath>
      </text>

      {/* cowboy hat — drawn over the wordmark center, like the original */}
      <g transform="translate(200 62)">
        <path
          d="M-52 14c1-2 12-5.5 20-6.5C-29 -8-19-22 0-22s29 14 32 29.5c8 1 19 4.5 20 6.5 1.5 3-22 8.5-52 8.5s-53.5-5.5-52-8.5z"
          fill={C.tan}
          stroke={C.tanDark}
          strokeWidth="2"
        />
        <path d="M-25 6C-24.4 -6 -14 -16 0 -16s24.4 10 25 22c-6 2.4-44 2.4-50 0z" fill={C.tanDark} />
        <path d="M-24 -1h48" stroke={C.navy} strokeWidth="3.5" />
        <circle cx="0" cy="-1" r="3.4" fill={C.ropeLight} />
      </g>
      <text
        x="200"
        y="176"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="17"
        fontWeight="bold"
        letterSpacing="4"
        fill={C.tanDark}
      >
        — ADVENTURES INC —
      </text>

      {/* scene: sun, palm, lighthouse, water */}
      <g transform="translate(0 -18)">
        <circle cx="150" cy="235" r="17" fill={C.sun} opacity="0.9" />
        {/* palm */}
        <g stroke={C.tanDark} fill="none" strokeWidth="2.5" opacity="0.85">
          <path d="M96 250c-2-14-3-26 2-38" />
          <path d="M98 212c-7-6-14-8-22-7 8-4 17-4 22 0 2-6 7-10 14-11-6 3-10 7-11 11 6-3 13-3 19 1-7-1-14 0-19 3z" fill={C.tanDark} stroke="none" />
        </g>
        {/* lighthouse */}
        <g opacity="0.85">
          <path d="M296 216l8 40h-22l8-40z" fill={C.cream} stroke={C.navy} strokeWidth="2" />
          <path d="M294 224h16M292 236h20M290 248h24" stroke={C.navy} strokeWidth="1.6" />
          <rect x="295" y="206" width="12" height="10" fill={C.navy} />
        </g>
        {/* gulls */}
        <path d="M236 208c3-3 6-3 8 0M250 200c3-3 6-3 8 0M226 196c3-3 6-3 8 0" stroke={C.navy} strokeWidth="1.6" fill="none" opacity="0.6" />

        {/* water */}
        <path d="M52 262c30-8 70-8 100 0s70 8 100 0 66-8 96 0v24H52z" fill={C.water} opacity="0.5" />
        <path d="M56 276c30-6 68-6 98 0s70 6 100 0 62-6 90 0" stroke={C.waterDeep} strokeWidth="2.5" fill="none" opacity="0.7" />

        {/* Skeeter-style center-console boat */}
        <g transform="translate(120 222)">
          {/* outboard */}
          <path d="M-4 26h14v18h-10l-4-10z" fill={C.navyDeep} />
          <rect x="-2" y="20" width="12" height="8" rx="2" fill={C.navyDeep} />
          {/* hull */}
          <path d="M6 44l6 14h132l22-20-2-6H14z" fill={C.cream} stroke={C.navy} strokeWidth="2.5" />
          <path d="M10 40h152" stroke={C.navy} strokeWidth="2" />
          <text x="46" y="54" fontFamily="Georgia, serif" fontSize="9" fontWeight="bold" letterSpacing="1.5" fill={C.navy}>
            SKEETER
          </text>
          {/* console + seat */}
          <path d="M74 12h20l6 20H70z" fill={C.cream} stroke={C.navy} strokeWidth="2" />
          <path d="M78 18l14-1" stroke={C.navy} strokeWidth="1.6" />
          <rect x="48" y="20" width="16" height="12" rx="2.5" fill={C.tan} stroke={C.navy} strokeWidth="1.6" />
          {/* T-top */}
          <path d="M62 -4h50M66 -4l6 24M108 -4l-8 24" stroke={C.navy} strokeWidth="2.5" fill="none" />
          <path d="M70 -10h34" stroke={C.navy} strokeWidth="2" />
          <path d="M76 -10v6M88 -10v6M100 -10v6" stroke={C.navy} strokeWidth="1.6" />
          {/* trolling motor */}
          <path d="M160 34l16-8M176 26l6 3" stroke={C.navyDeep} strokeWidth="2.5" fill="none" />
        </g>
      </g>

      {/* EST / 2024 + stars */}
      <text x="126" y="286" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fontWeight="bold" letterSpacing="2" fill={C.navy}>
        EST.
      </text>
      <text x="276" y="286" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fontWeight="bold" letterSpacing="2" fill={C.navy}>
        2024
      </text>
      <path d="M92 278l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9z" fill={C.tanDark} />
      <path d="M308 278l2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9z" fill={C.tanDark} />

      {/* longhorn skull */}
      <g transform="translate(200 285)" stroke={C.tanDark} fill={C.cream} strokeWidth="2">
        <path d="M-16 -8c-9-4-19-3-26 2 7 1 13 4 17 8M16 -8c9-4 19-3 26 2-7 1-13 4-17 8" fill="none" strokeLinecap="round" />
        <path d="M-14 -8c2-5 7-8 14-8s12 3 14 8c1 4-1.5 8-5 10.5l-3.5 9c-1.2 3.4-3 5-5.5 5s-4.3-1.6-5.5-5l-3.5-9c-3.5-2.5-6-6.5-5-10.5z" />
        <ellipse cx="-7" cy="-3" rx="2.4" ry="3" fill={C.navy} stroke="none" />
        <ellipse cx="7" cy="-3" rx="2.4" ry="3" fill={C.navy} stroke="none" />
      </g>

      {/* motto */}
      <text
        fontFamily="Georgia, serif"
        fontSize="14"
        fontWeight="bold"
        letterSpacing="1.5"
        fill={C.navy}
      >
        <textPath href="#arc-bottom" startOffset="50%" textAnchor="middle">
          EXPLORE MORE. LIVE SALTY.
        </textPath>
      </text>
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
          Adventures Inc
        </span>
      </span>
    </span>
  );
}
