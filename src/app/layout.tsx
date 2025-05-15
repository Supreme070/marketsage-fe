import "./globals.css";
import { Inter, Plus_Jakarta_Sans, Outfit } from "next/font/google";
import type { Metadata } from "next";
import Providers from "@/providers";
import ChatBotWrapper from "@/components/ChatBotWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MarketSage | Multi-Channel Marketing Automation for African Businesses",
  description: "Connect with your audience through Email, SMS, and WhatsApp marketing automation designed specifically for Nigerian and African businesses.",
  keywords: "marketing automation, email marketing, SMS marketing, WhatsApp marketing, Nigerian business, African business",
  authors: [{ name: "MarketSage Team" }],
  openGraph: {
    title: "MarketSage | Multi-Channel Marketing Automation for African Businesses",
    description: "Connect with your audience through Email, SMS, and WhatsApp marketing automation designed specifically for Nigerian and African businesses.",
    url: "https://marketsage.africa",
    siteName: "MarketSage",
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} ${outfit.variable}`}>
        <Providers>{children}</Providers>
        <ChatBotWrapper />
      </body>
    </html>
  );
}
