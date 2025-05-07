import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations | MarketSage",
  description: "Connect MarketSage with your favorite tools and platforms",
};

interface IntegrationsLayoutProps {
  children: React.ReactNode;
}

export default function IntegrationsLayout({ children }: IntegrationsLayoutProps) {
  return (
    <div className="flex-1 space-y-4">
      {children}
    </div>
  );
} 