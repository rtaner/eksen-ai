import type { Metadata } from "next";
import "./globals.css";
import OneSignalProvider from "@/components/providers/OneSignalProvider";

export const metadata: Metadata = {
  title: "Eksen AI - Personel Geri Bildirim",
  description: "Yapay zeka destekli personel geri bildirim ve görev yönetimi",
  themeColor: "#0B2A4C",
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  );
}
