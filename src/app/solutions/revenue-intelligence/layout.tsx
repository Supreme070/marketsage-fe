import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Reporting | MarketSage",
  description: "Make data-driven decisions with comprehensive analytics that track campaign performance in real-time.",
};

export default function AnalyticsReportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 