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
    maximumScale: 5,
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
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eksen AI" />
      </head>
      <body>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  );
}
