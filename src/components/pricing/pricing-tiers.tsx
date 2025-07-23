"use client";

import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Check,
  X,
  Sparkles,
  Rocket,
  Building2,
  ArrowRight,
  Zap,
  Users,
  Mail,
  MessageSquare,
  BarChart,
  Shield,
  Headphones
} from "lucide-react";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: "NGN" | "USD";
  badge?: string;
  badgeColor?: string;
  features: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    description: "Perfect for small businesses getting started",
    monthlyPrice: "₦50,000",
    yearlyPrice: "₦500,000",
    currency: "NGN",
    icon: Sparkles,
    color: "blue",
    features: [
      { text: "Up to 5,000 contacts", included: true },
      { text: "500 emails per month", included: true },
      { text: "Basic LeadPulse tracking", included: true },
      { text: "Email campaigns", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email support", included: true },
      { text: "SMS campaigns", included: false },
      { text: "WhatsApp integration", included: false },
      { text: "AI recommendations", included: false },
      { text: "Custom workflows", included: false }
    ]
  },
  {
    name: "Growth",
    description: "For growing businesses ready to scale",
    monthlyPrice: "₦150,000",
    yearlyPrice: "₦1,500,000",
    currency: "NGN",
    badge: "Most Popular",
    badgeColor: "green",
    icon: Rocket,
    color: "green",
    popular: true,
    features: [
      { text: "Up to 25,000 contacts", included: true, highlight: true },
      { text: "5,000 emails per month", included: true, highlight: true },
      { text: "Advanced LeadPulse with AI", included: true, highlight: true },
      { text: "Email + SMS campaigns", included: true },
      { text: "WhatsApp Business API", included: true },
      { text: "AI-powered insights", included: true },
      { text: "Custom workflows (10)", included: true },
      { text: "Priority email support", included: true },
      { text: "A/B testing", included: true },
      { text: "API access", included: false }
    ]
  },
  {
    name: "Enterprise",
    description: "Full power for large organizations",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    currency: "NGN",
    badge: "Contact Sales",
    badgeColor: "purple",
    icon: Building2,
    color: "purple",
    features: [
      { text: "Unlimited contacts", included: true, highlight: true },
      { text: "Unlimited emails", included: true, highlight: true },
      { text: "Supreme-AI full access", included: true, highlight: true },
      { text: "All channel campaigns", included: true },
      { text: "Unlimited workflows", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantee", included: true },
      { text: "On-premise option", included: true }
    ]
  }
];

export function PricingTiers() {
  const { theme } = useTheme();
  const [isYearly, setIsYearly] = useState(false);
  const isLight = theme === "light";

  const getColorClasses = (color: string, isPopular?: boolean) => {
    const colors = {
      blue: {
        bg: isLight ? "bg-blue-50" : "bg-blue-950/30",
        border: isPopular 
          ? isLight ? "border-blue-400" : "border-blue-600"
          : isLight ? "border-blue-200" : "border-blue-800",
        icon: isLight ? "bg-blue-100 text-blue-600" : "bg-blue-900/50 text-blue-400",
        button: isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
      },
      green: {
        bg: isLight ? "bg-green-50" : "bg-green-950/30",
        border: isPopular 
          ? isLight ? "border-green-400" : "border-green-600"
          : isLight ? "border-green-200" : "border-green-800",
        icon: isLight ? "bg-green-100 text-green-600" : "bg-green-900/50 text-green-400",
        button: isLight ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
      },
      purple: {
        bg: isLight ? "bg-purple-50" : "bg-purple-950/30",
        border: isPopular 
          ? isLight ? "border-purple-400" : "border-purple-600"
          : isLight ? "border-purple-200" : "border-purple-800",
        icon: isLight ? "bg-purple-100 text-purple-600" : "bg-purple-900/50 text-purple-400",
        button: isLight ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-white" : "bg-slate-900"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${
            !isYearly ? isLight ? "text-gray-900" : "text-gray-100" : "text-muted-foreground"
          }`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-green-600"
          />
          <span className={`text-sm font-medium ${
            isYearly ? isLight ? "text-gray-900" : "text-gray-100" : "text-muted-foreground"
          }`}>
            Yearly
            <Badge className="ml-2 bg-green-100 text-green-700 border-green-200">
              Save 20%
            </Badge>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const colors = getColorClasses(tier.color, tier.popular);
            
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={tier.popular ? "md:-mt-4 md:mb-4" : ""}
              >
                <Card className={`relative h-full p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                  colors.border
                } ${tier.popular ? "shadow-lg" : ""}`}>
                  {/* Popular Badge */}
                  {tier.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className={`px-3 py-1 ${
                        tier.badgeColor === "green" 
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-purple-500 text-white border-purple-600"
                      }`}>
                        {tier.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    colors.icon
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Tier Info */}
                  <h3 className={`text-2xl font-bold mb-2 ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className={`text-4xl font-bold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      {isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                    </div>
                    {tier.monthlyPrice !== "Custom" && (
                      <div className="text-sm text-muted-foreground">
                        per {isYearly ? "year" : "month"}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full mb-6 text-white ${colors.button}`}
                    size="lg"
                  >
                    {tier.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <div 
                        key={i}
                        className={`flex items-start gap-3 ${
                          feature.highlight ? "font-medium" : ""
                        }`}
                      >
                        {feature.included ? (
                          <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            feature.highlight 
                              ? isLight ? "text-green-600" : "text-green-400"
                              : "text-muted-foreground"
                          }`} />
                        ) : (
                          <X className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground opacity-40" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? isLight ? "text-gray-700" : "text-gray-300"
                            : "text-muted-foreground opacity-60"
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Currency Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          All prices shown in Nigerian Naira (₦). USD pricing available on request.
          <br />
          Volume discounts available for annual commitments.
        </p>
      </div>
    </section>
  );
}