/**
 * Duration-variant groups: packages that are the same trip offered at
 * different lengths. The first (listed) slug owns the public card; the trip
 * detail page shows a trip-length picker across all active slugs in a group.
 */
export const DURATION_GROUPS: string[][] = [
  ["inshore-fishing-charter", "full-day-fishing-charter"],
];

/** Card-level duration text overriding the single package duration. */
export const DURATION_CARD_LABELS: Record<string, string> = {
  "inshore-fishing-charter": "4 or 8 hours",
};

/** All slugs in the same duration group as `slug`, or null. */
export function durationGroupFor(slug: string): string[] | null {
  return DURATION_GROUPS.find((group) => group.includes(slug)) ?? null;
}

/**
 * Per-trip image focal point (Tailwind object-position class) for photos
 * whose subject isn't near the top of the frame.
 */
export const IMAGE_POSITION_BY_SLUG: Record<string, string> = {
  "dolphin-wildlife-tour": "object-[center_62%]",
};
