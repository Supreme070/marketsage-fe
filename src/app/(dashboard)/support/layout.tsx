import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | MarketSage",
  description: "Get help and support for MarketSage",
};

interface SupportLayoutProps {
  children: React.ReactNode;
}

export default function SupportLayout({ children }: SupportLayoutProps) {
  return (
    <div className="flex-1 space-y-4">
      {children}
    </div>
  );
} 