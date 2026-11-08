import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/shared/components/ServiceWorkerRegistrar";
import "./globals.css";

// latin-ext is required for Romanian diacritics (ș, ț, ă, î, â).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "block",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Dochița — Palatul Regal",
  description: "Sistem inteligent de securitate",
  applicationName: "Dochița",
  appleWebApp: {
    capable: true,
    title: "Dochița",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
