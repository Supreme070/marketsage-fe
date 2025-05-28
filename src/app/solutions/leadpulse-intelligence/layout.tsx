import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflow Automation | MarketSage",
  description: "Create sophisticated marketing journeys with our intuitive drag-and-drop interface without writing code.",
};

export default function WorkflowAutomationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 