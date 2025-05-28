import { LandingHeader } from "@/components/landing/landing-header";
import { IntelligenceHeroSection } from "@/components/landing/intelligence-hero-section";
import { IntelligenceFeaturesSection } from "@/components/landing/intelligence-features-section";
import { EnterpriseProofSection } from "@/components/landing/enterprise-proof-section";
import { ROICalculatorSection } from "@/components/landing/roi-calculator-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { IntelligenceCtaSection } from "@/components/landing/intelligence-cta-section";
import { BrandLogo } from "@/components/landing/landing-footer-brand";
import { Metadata } from "next";

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
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <IntelligenceHeroSection />
        <IntelligenceFeaturesSection />
        <EnterpriseProofSection />
        <ROICalculatorSection />
        <ComparisonSection />
        <IntelligenceCtaSection />
      </main>
      <footer className="border-t border-border bg-background py-6">
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
