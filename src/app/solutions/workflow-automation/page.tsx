import { Workflow, Zap, Repeat, Share2, ListChecks, GanttChart } from "lucide-react";
import { SolutionHero } from "@/components/solutions/solution-hero";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { WorkflowDemo } from "@/components/landing/workflow-demo";

export default function WorkflowAutomationPage() {
  // Define primary color for this solution
  const primaryColor = "#8B5CF6"; // Purple
  const solutionType = "workflow-automation";

  // Define features for this solution
  const features = [
    {
      title: "Drag & Drop Interface",
      description: "Build complex workflows without writing a single line of code using our intuitive visual interface.",
      icon: <Share2 className="h-6 w-6" />,
    },
    {
      title: "Pre-built Templates",
      description: "Start faster with dozens of pre-built templates designed for different marketing scenarios.",
      icon: <ListChecks className="h-6 w-6" />,
    },
    {
      title: "Real-time Testing",
      description: "Test your workflows in real-time before deploying them to ensure everything works as expected.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Multi-channel Triggers",
      description: "Trigger workflows based on user behavior across email, SMS, WhatsApp, and web interactions.",
      icon: <Repeat className="h-6 w-6" />,
    },
    {
      title: "Conditional Logic",
      description: "Create advanced workflows with branching paths based on user behavior and segmentation data.",
      icon: <GanttChart className="h-6 w-6" />,
    },
    {
      title: "Version Control",
      description: "Track changes, compare versions, and easily roll back to previous workflow configurations.",
      icon: <Workflow className="h-6 w-6" />,
    },
  ];

  return (
    <>
      <SolutionHero
        title="Visual Workflow Builder"
        description="Create sophisticated marketing journeys with our intuitive drag-and-drop interface. No coding required."
        icon={<Workflow className="h-8 w-8" />}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      <SolutionFeatures
        title="Build Powerful Marketing Automations"
        description="Design complex, multi-step marketing journeys that respond to customer behavior in real-time."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      <section className="py-16 bg-background">
        <div className="container px-4 mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center text-white">
            Try Our Workflow Builder
          </h2>
          <div className="max-w-5xl mx-auto">
            <WorkflowDemo />
          </div>
        </div>
      </section>
      
      <SolutionCTA
        title="Ready to Automate Your Marketing?"
        description="Start building powerful marketing workflows today and save hours of manual work while delivering personalized customer experiences."
        color={primaryColor}
      />
    </>
  );
} 