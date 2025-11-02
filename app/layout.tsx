import type { Metadata } from "next";
import "./globals.css";
import OneSignalProvider from "@/components/providers/OneSignalProvider";

export const metadata: Metadata = {
  title: "Eksen AI - Personel Geri Bildirim",
  description: "Yapay zeka destekli personel geri bildirim ve görev yönetimi",
  themeColor: "#0B2A4C",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eksen AI",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  );
}
