import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PASMigranPro P3MI — Sistem Manajemen Operasional Penempatan PMI",
  description:
    "Satu Command Center untuk mengelola data CPMI, tahapan penempatan (Journey Engine), dokumen & pengingat masa berlaku, medical, visa, serta jejak audit multi-cabang P3MI.",
  icons: {
    icon: "/logo-pas.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
