import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";
import { ThemeScript } from "@/components/theme-script";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Zafari Caja",
  title: {
    default: "Zafari · Punto de venta",
    template: "%s · Zafari",
  },
  description:
    "Punto de venta de Zafari: vendé, cobrá, controlá stock y caja desde cualquier dispositivo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zafari",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${outfit.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
