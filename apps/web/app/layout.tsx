import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoQA Intelligence Platform",
  description: "AI-Powered Testing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          {children}
          <footer className="fixed bottom-0 left-0 right-0 py-3 bg-gradient-to-r from-purple-900/20 via-black/40 to-purple-900/20 backdrop-blur-sm border-t border-purple-500/20">
            <p className="text-center text-sm font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Created by <span className="font-bold">BHANU PRASAD</span> with ❤️ for <span className="font-bold">AhaApps</span>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
