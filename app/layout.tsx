// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MercadoLibre OAuth Integration",
  description: "Manage MercadoLibre app credentials and OAuth tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className={`${geist.className} bg-gray-50 min-h-full`}>
        <nav className="bg-yellow-400 border-b border-yellow-500">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link
              href="/"
              className="font-bold text-gray-900 text-lg tracking-tight"
            >
              ML OAuth
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-800 hover:text-gray-900 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/apps"
              className="text-gray-800 hover:text-gray-900 text-sm font-medium"
            >
              Apps
            </Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
