import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Providers from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MarketSage | Intelligent Multi-Channel Marketing Made Simple",
  description: "All-in-one email and SMS marketing & automation platform with AI-driven personalization for growing businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
