import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Attribution from "./Attribution";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate export, not a `viewport` key inside `metadata` - that has been
// deprecated since Next 14 and this project is on 16.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ViaHimalaya — Offline maps for Himalayan treks",
  description: "Free, offline-first navigation for Himalayan alpine trekking. High-precision trails, elevation profiles and multi-day planning for India's most iconic treks.",
  keywords: "himalaya, trekking, trails, offline maps, india, mountains, hiking, adventure",
  authors: [{ name: "ViaHimalaya" }],
  openGraph: {
    title: "ViaHimalaya — Offline maps for Himalayan treks",
    description: "Free, offline-first navigation for Himalayan alpine trekking. High-precision trails, elevation profiles and multi-day planning.",
    siteName: "ViaHimalaya",
    images: [
      {
        url: "/bg.jpg",
        width: 2560,
        height: 1440,
        alt: "ViaHimalaya - Himalayan Trails",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViaHimalaya — Offline maps for Himalayan treks",
    description: "Free, offline-first navigation for Himalayan alpine trekking. High-precision trails, elevation profiles and multi-day planning.",
    images: ["/bg.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="min-h-full flex flex-col bg-black" suppressHydrationWarning={true}>
        {children}
        <Attribution />
      </body>
    </html>
  );
}
