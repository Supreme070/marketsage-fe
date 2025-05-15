import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audience Segmentation | MarketSage",
  description: "Target the right audience with AI-powered segmentation based on behavior, demographics, and engagement.",
};

export default function AudienceSegmentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 