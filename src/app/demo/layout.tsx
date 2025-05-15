import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule a Demo | MarketSage",
  description: "Book a personalized demo of MarketSage's marketing automation platform designed for Nigerian businesses.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 
 