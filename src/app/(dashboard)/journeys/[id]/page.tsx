import { Metadata } from "next";
import { JourneyDetailPage } from "@/components/journeys/JourneyDetailPage";

export const metadata: Metadata = {
  title: "Journey Details | MarketSage",
  description: "View and manage a customer journey",
};

interface Props {
  params: {
    id: string;
  };
}

export default function Page({ params }: Props) {
  return <JourneyDetailPage journeyId={params.id} />;
} 