import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Omnichannel Messaging | MarketSage",
  description: "Seamlessly manage Email, SMS, and WhatsApp campaigns from a single platform with unified analytics.",
};

export default function OmnichannelMessagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 