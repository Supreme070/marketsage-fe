import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { SupremeAISection } from "@/components/landing/supreme-ai-section";
import { LeadPulseWorldMap } from "@/components/landing/leadpulse-world-map";
import { AfricanSuccessSection } from "@/components/landing/african-success-section";
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
        
        {/* Supreme-AI Command Center */}
        <SupremeAISection />
        
        {/* LeadPulse World Map */}
        <LeadPulseWorldMap />
        
        {/* African Success Stories & Enterprise Features */}
        <AfricanSuccessSection />
      </main>
      
      {/* Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}
