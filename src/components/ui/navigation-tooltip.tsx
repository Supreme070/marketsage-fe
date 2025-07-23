"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface NavigationTooltipProps {
  title: string;
  description: string;
  features?: string[];
  children: React.ReactNode;
}

export function NavigationTooltip({ title, description, features, children }: NavigationTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-80 p-4">
          <div className="space-y-2">
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
            {features && features.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium">Key Features:</div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Navigation help data
export const navigationHelp = {
  "/leadpulse": {
    title: "LeadPulse Overview",
    description: "Comprehensive visitor tracking and analytics platform for understanding website visitor behavior.",
    features: [
      "Real-time visitor tracking",
      "Anonymous visitor identification",
      "Behavioral analytics and scoring",
      "Geographic and device intelligence"
    ]
  },
  "/leadpulse/visitors": {
    title: "Visitor Intelligence Hub", 
    description: "Advanced visitor tracking with real-time behavioral analytics and GDPR-compliant data collection.",
    features: [
      "Live visitor tracking with session recording",
      "Behavioral scoring with engagement metrics",
      "Geographic and device analytics",
      "Lead management and conversion opportunities"
    ]
  },
  "/leadpulse/analytics": {
    title: "Analytics Hub",
    description: "Comprehensive analytics dashboard with funnel analysis, real-time metrics, and performance insights.",
    features: [
      "Funnel analysis with drop-off insights",
      "Real-time visitor activity monitoring", 
      "Performance metrics and KPI tracking",
      "Custom analytics reports"
    ]
  },
  "/leadpulse/forms": {
    title: "Forms & Conversions",
    description: "Dynamic form builder with conversion tracking and optimization tools.",
    features: [
      "Drag-and-drop form builder",
      "Conversion tracking and attribution",
      "A/B testing for form optimization",
      "Goal setting and performance monitoring"
    ]
  },
  "/ai-intelligence": {
    title: "AI Intelligence Overview",
    description: "Central hub for AI-powered business intelligence, customer insights, and predictive analytics.",
    features: [
      "Multi-modal AI orchestration",
      "Predictive customer analytics",
      "Automated decision support",
      "Strategic business insights"
    ]
  },
  "/ai-intelligence/chat": {
    title: "Supreme Chat",
    description: "Advanced AI chat interface with task execution capabilities and African market intelligence.",
    features: [
      "Natural language business queries",
      "Automated task execution with approvals",
      "African market context awareness",
      "Multi-modal content analysis"
    ]
  },
  "/ai-intelligence/customers": {
    title: "Customer Intelligence",
    description: "AI-powered customer behavior analysis, segmentation, and predictive modeling.",
    features: [
      "Predictive churn analysis",
      "Customer lifetime value modeling",
      "Behavioral segmentation",
      "Personalization recommendations"
    ]
  },
  "/ai-intelligence/campaigns": {
    title: "Campaign Intelligence",
    description: "AI-powered campaign optimization with performance prediction and automated decision-making.",
    features: [
      "Campaign performance prediction",
      "Send time optimization",
      "Content generation and A/B testing",
      "Audience intelligence and targeting"
    ]
  },
  "/ai-intelligence/business": {
    title: "Business Intelligence",
    description: "Strategic AI-powered insights for business growth and decision support across African markets.",
    features: [
      "Revenue forecasting and optimization",
      "Market intelligence and competitive analysis",
      "Risk assessment and compliance monitoring",
      "Strategic decision support with scenario modeling"
    ]
  },
  "/ai-intelligence/operations": {
    title: "AI Operations",
    description: "Operational AI management including task monitoring, approvals, and performance optimization.",
    features: [
      "AI task management and approval workflows",
      "Performance monitoring and optimization",
      "Model training and feedback loops",
      "Operational analytics and insights"
    ]
  }
};