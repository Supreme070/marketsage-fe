import "./globals.css";
// import { Inter, Plus_Jakarta_Sans, Outfit } from "next/font/google";
import type { Metadata } from "next";
import Providers from "@/providers";
import ChatBotWrapper from "@/components/ChatBotWrapper";
import WebVitalsInit from "@/components/WebVitalsInit";

// Temporarily using system fonts to avoid Docker build issues
// const inter = Inter({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-inter",
//   weight: ["400", "500", "600", "700"],
// });

// const plusJakarta = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-plus-jakarta",
//   weight: ["400", "500", "600", "700"],
// });

// const outfit = Outfit({
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-outfit",
//   weight: ["400", "500", "600", "700"],
// });

export const metadata: Metadata = {
  title: "MarketSage | Multi-Channel Marketing Automation for African Businesses",
  description: "Connect with your audience through Email, SMS, and WhatsApp marketing automation designed specifically for Nigerian and African businesses.",
  keywords: "marketing automation, email marketing, SMS marketing, WhatsApp marketing, Nigerian business, African business",
  authors: [{ name: "MarketSage Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "MarketSage | Multi-Channel Marketing Automation for African Businesses",
    description: "Connect with your audience through Email, SMS, and WhatsApp marketing automation designed specifically for Nigerian and African businesses.",
    url: "https://marketsage.africa",
    siteName: "MarketSage",
    locale: "en_NG",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MarketSage" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body className="font-sans">
        <WebVitalsInit />
        <Providers>{children}</Providers>
        <ChatBotWrapper />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Register service worker for PWA functionality
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }

              // PWA install prompt handling
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                // Show install button or banner
                window.dispatchEvent(new CustomEvent('marketsage:installable'));
              });

              // Handle successful installation
              window.addEventListener('appinstalled', (e) => {
                console.log('PWA was installed');
                window.dispatchEvent(new CustomEvent('marketsage:installed'));
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
