import { Metadata } from "next";
import { JourneyAnalyticsPage } from "@/components/journeys/JourneyAnalyticsPage";

export const metadata: Metadata = {
  title: "Journey Analytics | MarketSage",
  description: "Analyze customer journey performance and identify bottlenecks",
};

interface Props {
  params: {
    id: string;
  };
}

export default function Page({ params }: Props) {
  return <JourneyAnalyticsPage journeyId={params.id} />;
} 