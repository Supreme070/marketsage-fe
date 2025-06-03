import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | MarketSage",
  description: "Comprehensive guides and tutorials for using the MarketSage marketing automation platform.",
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 