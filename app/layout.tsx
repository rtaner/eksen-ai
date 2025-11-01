import type { Metadata } from "next";
import "./globals.css";
import OneSignalProvider from "@/components/providers/OneSignalProvider";

export const metadata: Metadata = {
  title: "Eksen AI - Personel Geri Bildirim",
  description: "Yapay zeka destekli personel geri bildirim ve görev yönetimi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <OneSignalProvider>{children}</OneSignalProvider>
      </body>
    </html>
  );
}
