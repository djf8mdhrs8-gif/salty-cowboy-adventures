"use client";

import { PLACEHOLDER_CONTACT } from "@/lib/site";
import { analytics } from "@/lib/analytics";

/** Phone link that fires the phone-click analytics event. */
export function PhoneLink({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={PLACEHOLDER_CONTACT.phoneHref}
      className={className}
      onClick={() => analytics.phoneClick()}
    >
      {children ?? PLACEHOLDER_CONTACT.phone}
    </a>
  );
}
