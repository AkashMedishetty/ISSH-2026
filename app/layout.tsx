import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { conferenceConfig } from "@/config/conference.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://issh2026.com"; // Update with actual domain

export const metadata: Metadata = {
  title: {
    default: `${conferenceConfig.shortName} - ${conferenceConfig.name}`,
    template: `%s | ${conferenceConfig.shortName}`,
  },
  description: `${conferenceConfig.name} - ${conferenceConfig.tagline}. Join leading hand surgeons at ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city} on April 25-26, 2026. Organized by ISSH, TOSA & TCOS.`,
  keywords: [
    "ISSH 2026",
    "ISSH Midterm CME",
    "hand surgery conference",
    "hand surgery India",
    "Indian Society for Surgery of the Hand",
    "TOSA",
    "TCOS",
    "Hyderabad medical conference",
    "orthopedic surgery",
    "microsurgery",
    "hand trauma",
    "reconstructive surgery",
    "CME conference",
    "medical conference 2026",
  ],
  authors: [{ name: "ISSH - Indian Society for Surgery of the Hand" }],
  creator: "PurpleHat Events",
  publisher: "ISSH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${conferenceConfig.shortName} - ${conferenceConfig.name}`,
    description: `Join leading hand surgeons at the ISSH Midterm CME 2026 in Hyderabad. April 25-26, 2026 at HICC Novotel.`,
    url: siteUrl,
    siteName: conferenceConfig.shortName,
    images: [
      {
        url: "/logos/1.png",
        width: 800,
        height: 600,
        alt: `${conferenceConfig.shortName} Logo`,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${conferenceConfig.shortName} - Hand Surgery Conference 2026`,
    description: `Join leading hand surgeons at the ISSH Midterm CME 2026 in Hyderabad. April 25-26, 2026.`,
    images: ["/logos/1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/Favicons/favicon.ico" },
      { url: "/Favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/Favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/Favicons/apple-touch-icon.png" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/Favicons/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/Favicons/android-chrome-512x512.png" },
    ],
  },
  manifest: "/Favicons/site.webmanifest",
  verification: {
    // Add Google Search Console verification if available
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: conferenceConfig.name,
    description: `${conferenceConfig.tagline}. Premier hand surgery conference organized by ISSH, TOSA & TCOS.`,
    startDate: "2026-04-25",
    endDate: "2026-04-26",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: conferenceConfig.venue.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: conferenceConfig.venue.city,
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Indian Society for Surgery of the Hand (ISSH)",
      url: siteUrl,
    },
    image: `${siteUrl}/logos/1.png`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/register`,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
