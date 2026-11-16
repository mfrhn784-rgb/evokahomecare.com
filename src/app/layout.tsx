import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://evokahomecare.com"),
  title: {
    default: "EVOKA | Home & Personal Care — Trivandrum, Kerala",
    template: "%s | EVOKA",
  },
  description:
    "Everyday Clean, Elevated. High-performance laundry detergents, dishwash liquids, floor cleaners, and personal care products crafted in Pallichal & Poovar Uchakkada, Trivandrum. Fast home delivery & COD available.",
  applicationName: "EVOKA",
  keywords: [
    "EVOKA",
    "EVOKA home care",
    "laundry detergent Trivandrum",
    "matic liquid detergent Kerala",
    "dishwash liquid manufacturer Trivandrum",
    "floor cleaner wholesale Kerala",
    "cleaning supplies Poovar",
    "cleaning products Pallichal",
    "hand wash Trivandrum",
    "personal care Kerala",
  ],
  authors: [{ name: "EVOKA Home & Personal Care", url: "https://evokahomecare.com" }],
  creator: "EVOKA",
  publisher: "EVOKA",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://evokahomecare.com",
    siteName: "EVOKA Home & Personal Care",
    title: "EVOKA | Everyday Clean, Elevated — Trivandrum, Kerala",
    description:
      "High-performance laundry detergents, dishwash liquids, floor cleaners, and personal care crafted in Trivandrum. Free local delivery and COD available.",
    images: [
      {
        url: "/images/evoka-og-banner.png",
        width: 1200,
        height: 630,
        alt: "EVOKA Home & Personal Care — Trivandrum, Kerala",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVOKA | Everyday Clean, Elevated",
    description:
      "High-performance laundry detergents, dishwash, and cleaning products in Trivandrum.",
    images: ["/images/evoka-og-banner.png"],
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
  alternates: {
    canonical: "https://evokahomecare.com",
  },
  verification: {
    google: "google15607361170c0aa2",
  },
  other: {
    "geo.region": "IN-KL",
    "geo.placename": "Thiruvananthapuram",
    "geo.position": "8.4419;77.0152",
    ICBM: "8.4419, 77.0152",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Explicit Google Favicon specification: 48x48 multiple square icon */}
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <JsonLd />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
