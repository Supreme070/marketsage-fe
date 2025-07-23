import type { Metadata } from "next";
import { PricingHeader } from "@/components/pricing/pricing-header";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { PricingComparison } from "@/components/pricing/pricing-comparison";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { PricingCTA } from "@/components/pricing/pricing-cta";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Pricing - MarketSage Intelligence | Transparent Pricing for African Enterprises",
  description: "Simple, transparent pricing that scales with your business. Start free, upgrade as you grow. No hidden fees, no surprises. Built for African enterprises.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <PricingHeader />
        <PricingTiers />
        <PricingComparison />
        <PricingFAQ />
        <PricingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}