/**
 * Branded scenic image placeholder: layered SVG coastal scene in brand colors.
 * Replace with real photography (next/image) when assets are available —
 * every usage passes an `alt`-style label for accessibility parity.
 */
const SCENES = {
  ocean: { sky: "#d9ecf1", sun: "#f3ead3", water: "#569fb6", deep: "#3d829b" },
  sunset: { sky: "#f2ebdd", sun: "#d1b892", water: "#3c5f88", deep: "#2e4a6c" },
  marsh: { sky: "#f0f7f9", sun: "#faf5e8", water: "#6aa192", deep: "#4f8577" },
} as const;

export function ScenicImage({
  label,
  scene = "ocean",
  className = "",
}: {
  label: string;
  scene?: keyof typeof SCENES;
  className?: string;
}) {
  const c = SCENES[scene];
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect width="800" height="500" fill={c.sky} />
        <circle cx="620" cy="120" r="70" fill={c.sun} />
        <path d="M0 260 Q200 230 400 260 T800 260 V500 H0 Z" fill={c.water} opacity="0.85" />
        <path d="M0 320 Q200 290 400 320 T800 320 V500 H0 Z" fill={c.deep} opacity="0.9" />
        {/* boat silhouette */}
        <g transform="translate(330 250)" fill="#1b2c42">
          <path d="M0 28 L140 28 L118 52 L18 52 Z" />
          <rect x="52" y="0" width="8" height="30" />
          <rect x="38" y="12" width="48" height="18" rx="3" />
        </g>
        <path
          d="M0 420 Q150 400 300 420 T600 420 T900 420 V500 H0 Z"
          fill="#1b2c42"
          opacity="0.12"
        />
      </svg>
    </div>
  );
}
