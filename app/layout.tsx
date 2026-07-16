import type { Metadata } from "next";
import { Bitter, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";

const heading = Bitter({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Premium fishing charters, sunset cruises, dolphin tours, and private coastal adventures in Marco Island and Naples, Florida. Book your trip online with Salty Cowboy Adventures.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Premium fishing charters, sunset cruises, dolphin tours, and private coastal adventures.",
    url: siteUrl(),
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <a href="#main-content" className="sr-only sr-only-focusable">
          Skip to main content
        </a>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
