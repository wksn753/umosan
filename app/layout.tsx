import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://umosan.baseight.com"),
  applicationName: "UMOSAN — MUST Chapter",
  title: {
    default: "UMOSAN — MUST Chapter",
    template: "%s | UMOSAN — MUST Chapter",
  },
  description:
    "UMOSAN — MUST Chapter community and registration portal for members, alumni and invited guests of Mbarara University of Science and Technology.",
  keywords: [
    "UMOSAN",
    "MUST",
    "Mbarara University of Science and Technology",
    "MUST Alumni",
    "UMOSAN MUST Chapter",
    "Mbarara alumni",
    "Uganda",
  ],
  creator: "UMOSAN — MUST Chapter",
  publisher: "UMOSAN — MUST Chapter",
  category: "community",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://umosan.baseight.com",
    siteName: "UMOSAN — MUST Chapter",
    title: "UMOSAN — MUST Chapter",
    description:
      "Connect with the UMOSAN — MUST Chapter community, register for chapter occasions and help shape future events.",
    images: [
      {
        url: "/images/umosan-logo.png",
        width: 1200,
        height: 1200,
        alt: "UMOSAN logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UMOSAN — MUST Chapter",
    description:
      "Community, connection and chapter event registration for UMOSAN — MUST members and alumni.",
    images: ["/images/umosan-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#031827",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivoBlack.variable}`}
    >
      <head>
        <link rel="preload" href="/images/umosan-logo.png" as="image" />
        <link rel="preload" href="/images/must-logo.png" as="image" />
      </head>
      <body>{children}</body>
    </html>
  );
}
