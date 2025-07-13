import { LandingHeader } from "@/components/landing/landing-header";
import { BrandLogo } from "@/components/landing/landing-footer-brand";
import { HeroSection } from "@/components/landing/hero-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketSage Intelligence - See and Convert Your Invisible Revenue | African Marketing Intelligence Platform",
  description: "The only Marketing Intelligence Platform built for African enterprises. Track anonymous visitors, predict conversions, and convert invisible revenue that your competitors miss. Trusted by 50+ enterprises processing ₦10B+ monthly.",
  keywords: ["marketing intelligence", "visitor tracking", "conversion prediction", "African enterprises", "revenue optimization", "behavioral analytics", "LeadPulse", "customer intelligence"],
  openGraph: {
    title: "MarketSage Intelligence - See Your Invisible Revenue",
    description: "Stop flying blind. See the 234 visitors on African websites right now and convert revenue that others miss.",
    images: ["/og-intelligence-platform.jpg"],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F172A]">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />
      </main>
      <footer className="border-t border-border bg-background dark:bg-[#0F172A] py-6 relative z-10">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BrandLogo />
              <span className="text-muted-foreground text-sm ml-2">© {new Date().getFullYear()} MarketSage Intelligence. All rights reserved</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Enterprise Sales</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
