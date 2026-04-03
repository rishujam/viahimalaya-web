import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViaHimalaya - Coming Soon",
  description: "High-precision, guide-verified offline trails for India's most iconic treks. Coming Soon.",
  keywords: "himalaya, trekking, trails, offline maps, india, mountains, hiking, adventure",
  authors: [{ name: "ViaHimalaya" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "ViaHimalaya - Coming Soon",
    description: "High-precision, guide-verified offline trails for India's most iconic treks.",
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
    title: "ViaHimalaya - Coming Soon",
    description: "High-precision, guide-verified offline trails for India's most iconic treks.",
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
      <body className="min-h-full flex flex-col bg-black" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
