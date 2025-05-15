import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions | MarketSage - Marketing Automation for Nigerian Businesses",
  description: "Explore MarketSage's comprehensive marketing automation solutions for Nigerian businesses.",
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
} 