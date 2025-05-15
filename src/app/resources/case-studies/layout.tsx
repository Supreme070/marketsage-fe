import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Studies | MarketSage",
  description: "Explore success stories from Nigerian businesses using MarketSage's marketing automation platform.",
};

export default function CaseStudiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 