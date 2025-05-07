"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

export function PricingSection() {
  const [annually, setAnnually] = useState(true);
  
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small businesses just getting started",
      monthlyPrice: 49,
      annualPrice: 39,
      currency: "$",
      features: [
        "Up to 1,000 contacts",
        "Unlimited email campaigns",
        "SMS campaigns (pay as you go)",
        "Basic segmentation",
        "Standard templates",
        "Email support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      description: "For growing businesses with advanced needs",
      monthlyPrice: 99,
      annualPrice: 79,
      currency: "$",
      features: [
        "Up to 10,000 contacts",
        "Unlimited email campaigns",
        "SMS campaigns (discounted rates)",
        "WhatsApp integration",
        "Advanced segmentation",
        "Visual workflow builder",
        "Custom templates",
        "Priority email & chat support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations",
      monthlyPrice: 249,
      annualPrice: 199,
      currency: "$",
      features: [
        "Unlimited contacts",
        "Unlimited email campaigns",
        "Premium SMS rates",
        "Advanced WhatsApp features",
        "AI-powered segmentation",
        "Custom integrations",
        "Dedicated success manager",
        "24/7 priority support",
        "Advanced security features"
      ],
      cta: "Contact Sales",
      ctaLink: "#",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that's right for your business. All plans include a 14-day free trial.
          </p>
          
          {/* Pricing Toggle */}
          <div className="flex items-center space-x-3 bg-muted/50 rounded-full p-1 mb-4">
            <button
              onClick={() => setAnnually(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !annually 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnually(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                annually 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual <span className="text-xs text-primary">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl border ${
                plan.popular 
                  ? 'border-primary shadow-lg shadow-primary/10' 
                  : 'border-border'
              } bg-card p-6 flex flex-col h-full`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {plan.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.currency}{annually ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-muted-foreground ml-1">
                  /mo {annually && 'billed annually'}
                </span>
              </div>
              <ul className="mb-8 space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href={plan.ctaLink || "/register"} 
                className="mt-auto"
              >
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Need a custom solution? <Link href="#" className="text-primary font-medium hover:underline">Contact our sales team</Link> to discuss your specific requirements.
          </p>
        </div>
      </div>
    </section>
  );
} 