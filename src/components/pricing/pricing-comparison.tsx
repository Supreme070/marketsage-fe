"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check,
  Minus,
  Info
} from "lucide-react";

const comparisonCategories = [
  {
    name: "Core Features",
    features: [
      {
        name: "Contact Management",
        starter: "5,000",
        growth: "25,000",
        enterprise: "Unlimited",
        info: "Maximum number of contacts you can store"
      },
      {
        name: "Email Sends",
        starter: "500/month",
        growth: "5,000/month",
        enterprise: "Unlimited",
        info: "Total emails you can send per month"
      },
      {
        name: "SMS Campaigns",
        starter: false,
        growth: true,
        enterprise: true,
        info: "Send SMS to Nigerian and African numbers"
      },
      {
        name: "WhatsApp Business",
        starter: false,
        growth: true,
        enterprise: true,
        info: "WhatsApp Business API integration"
      }
    ]
  },
  {
    name: "AI & Intelligence",
    features: [
      {
        name: "LeadPulse Tracking",
        starter: "Basic",
        growth: "Advanced",
        enterprise: "Enterprise",
        info: "Visitor intelligence and tracking capabilities"
      },
      {
        name: "AI Recommendations",
        starter: false,
        growth: true,
        enterprise: true,
        info: "AI-powered campaign and content suggestions"
      },
      {
        name: "Predictive Analytics",
        starter: false,
        growth: "Limited",
        enterprise: true,
        info: "Churn prediction, LTV, and more"
      },
      {
        name: "Supreme-AI Access",
        starter: false,
        growth: "Basic",
        enterprise: "Full",
        info: "Access to advanced AI capabilities"
      }
    ]
  },
  {
    name: "Automation & Workflows",
    features: [
      {
        name: "Email Automation",
        starter: true,
        growth: true,
        enterprise: true,
        info: "Automated email sequences and triggers"
      },
      {
        name: "Custom Workflows",
        starter: false,
        growth: "10",
        enterprise: "Unlimited",
        info: "Visual workflow builder"
      },
      {
        name: "A/B Testing",
        starter: false,
        growth: true,
        enterprise: true,
        info: "Test different versions of campaigns"
      },
      {
        name: "Multi-channel Campaigns",
        starter: false,
        growth: true,
        enterprise: true,
        info: "Coordinate across email, SMS, WhatsApp"
      }
    ]
  },
  {
    name: "Support & Services",
    features: [
      {
        name: "Email Support",
        starter: "Standard",
        growth: "Priority",
        enterprise: "Priority",
        info: "Email support response time"
      },
      {
        name: "Phone Support",
        starter: false,
        growth: false,
        enterprise: "24/7",
        info: "Direct phone support availability"
      },
      {
        name: "Dedicated Manager",
        starter: false,
        growth: false,
        enterprise: true,
        info: "Personal customer success manager"
      },
      {
        name: "Onboarding",
        starter: "Self-service",
        growth: "Guided",
        enterprise: "White-glove",
        info: "Level of onboarding assistance"
      }
    ]
  },
  {
    name: "Security & Compliance",
    features: [
      {
        name: "Data Encryption",
        starter: true,
        growth: true,
        enterprise: true,
        info: "256-bit encryption for all data"
      },
      {
        name: "SSO/SAML",
        starter: false,
        growth: false,
        enterprise: true,
        info: "Single sign-on integration"
      },
      {
        name: "API Access",
        starter: false,
        growth: true,
        enterprise: true,
        info: "Programmatic access to your data"
      },
      {
        name: "SLA Guarantee",
        starter: false,
        growth: false,
        enterprise: "99.9%",
        info: "Uptime service level agreement"
      }
    ]
  }
];

export function PricingComparison() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className={`h-5 w-5 ${isLight ? "text-green-600" : "text-green-400"}`} />
      ) : (
        <Minus className="h-5 w-5 text-muted-foreground opacity-40" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-gray-50" : "bg-slate-950"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Detailed Feature Comparison
            </h2>
            <p className={`text-lg ${
              isLight ? "text-gray-600" : "text-gray-400"
            }`}>
              See exactly what's included in each plan
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4"></th>
                  <th className={`p-4 text-center ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    <div className="font-semibold text-lg">Starter</div>
                    <div className="text-sm text-muted-foreground">₦50,000/mo</div>
                  </th>
                  <th className={`p-4 text-center relative ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                      Popular
                    </Badge>
                    <div className="font-semibold text-lg">Growth</div>
                    <div className="text-sm text-muted-foreground">₦150,000/mo</div>
                  </th>
                  <th className={`p-4 text-center ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    <div className="font-semibold text-lg">Enterprise</div>
                    <div className="text-sm text-muted-foreground">Custom</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((category, categoryIndex) => (
                  <React.Fragment key={category.name}>
                    <tr>
                      <td colSpan={4} className="pt-8 pb-4">
                        <h3 className={`font-semibold text-lg ${
                          isLight ? "text-gray-900" : "text-gray-100"
                        }`}>
                          {category.name}
                        </h3>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <motion.tr
                        key={feature.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (categoryIndex * 0.1) + (featureIndex * 0.05) }}
                        className={`border-t ${
                          isLight ? "border-gray-200" : "border-gray-800"
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${
                              isLight ? "text-gray-700" : "text-gray-300"
                            }`}>
                              {feature.name}
                            </span>
                            <div className="group relative">
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap ${
                                isLight 
                                  ? "bg-gray-900 text-white" 
                                  : "bg-gray-100 text-gray-900"
                              }`}>
                                {feature.info}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {renderValue(feature.starter)}
                        </td>
                        <td className={`p-4 text-center ${
                          isLight ? "bg-green-50/50" : "bg-green-950/20"
                        }`}>
                          {renderValue(feature.growth)}
                        </td>
                        <td className="p-4 text-center">
                          {renderValue(feature.enterprise)}
                        </td>
                      </motion.tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}