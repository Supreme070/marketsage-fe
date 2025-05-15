import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | MarketSage - Marketing Automation for Nigerian Businesses",
  description: "Explore MarketSage's resources, guides, and best practices for marketing automation.",
};

export default function ResourcesLayout({
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