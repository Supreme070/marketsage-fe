import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CtaSection } from "@/components/landing/cta-section";
import { BrandLogo } from "@/components/landing/landing-footer-brand";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MarketSage - Intelligent Marketing Automation for Nigerian Businesses",
  description: "MarketSage helps Nigerian businesses automate their marketing with multi-channel campaigns, AI-powered insights, and easy-to-use workflows.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <footer className="border-t border-border/40 bg-background py-6">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BrandLogo />
              <span className="text-muted-foreground text-sm ml-2">© {new Date().getFullYear()} All rights reserved</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
