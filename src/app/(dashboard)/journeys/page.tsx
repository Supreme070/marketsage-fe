import { Metadata } from "next";
import { JourneysPage } from "@/components/journeys/JourneysPage";

export const metadata: Metadata = {
  title: "Customer Journeys | MarketSage",
  description: "Create and manage customer journeys across multiple touchpoints",
};

export default function Page() {
  return <JourneysPage />;
} 