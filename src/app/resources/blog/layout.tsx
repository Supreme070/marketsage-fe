import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing Blog | MarketSage",
  description: "Explore our blog for the latest marketing automation tips, strategies, and best practices for Nigerian businesses.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 