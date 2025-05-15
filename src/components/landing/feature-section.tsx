"use client";

import { 
  ShoppingCart, 
  Filter, 
  BarChart3, 
  Settings, 
  Store, 
  Building2,
  UtensilsCrossed,
  Users,
  Clock,
  Zap, 
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquare,
  MessageCircle,
  Workflow
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function FeatureSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  const features = [
    {
      icon: Workflow,
      title: "Visual Workflow Builder",
      description:
        "Create sophisticated marketing automations through an intuitive drag-and-drop interface. No coding required.",
      link: "#",
      color: isLight ? "bg-primary/15 text-primary-600 shadow-primary/10" : "bg-primary/10 text-primary"
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description:
        "Design beautiful emails with our visual editor and automate sending based on customer behaviors and preferences.",
      link: "#",
      color: isLight ? "bg-blue-500/15 text-blue-600 shadow-blue-500/10" : "bg-blue-500/10 text-blue-500"
    },
    {
      icon: MessageSquare,
      title: "SMS Campaigns",
      description:
        "Reach your Nigerian customers instantly with targeted SMS messages that achieve 98% open rates.",
      link: "#",
      color: isLight ? "bg-accent/15 text-accent-600 shadow-accent/10" : "bg-accent/10 text-accent"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Marketing",
      description:
        "Leverage Africa's most popular messaging platform for high-engagement marketing and customer service.",
      link: "#",
      color: isLight ? "bg-green-500/15 text-green-600 shadow-green-500/10" : "bg-green-500/10 text-green-500"
    },
    {
      icon: Filter,
      title: "Smart Segmentation",
      description:
        "Group customers using detailed filters that matter to African markets, like location, language, and mobile network.",
      link: "#",
      color: isLight ? "bg-indigo-500/15 text-indigo-600 shadow-indigo-500/10" : "bg-indigo-500/10 text-indigo-500"
    },
    {
      icon: BarChart3,
      title: "Localized Analytics",
      description:
        "Access insights tailored to the Nigerian market with metrics that matter to your business goals.",
      link: "#",
      color: isLight ? "bg-purple-500/15 text-purple-600 shadow-purple-500/10" : "bg-purple-500/10 text-purple-500"
    }
  ];

  // Business case studies
  const businessResults = [
    {
      icon: Store,
      title: "Retail Chain",
      before: [
        "Manual email campaigns taking 3 days to prepare",
        "12% average conversion rate",
        "No personalization capabilities"
      ],
      after: [
        "Automated campaigns set up in hours",
        "32% conversion rate - 2.6x improvement",
        "Personalized recommendations for each customer"
      ],
      metrics: "+183% Revenue Growth",
      color: isLight ? "border-primary/30 bg-white shadow-lg shadow-primary/5" : "border-primary/20"
    },
    {
      icon: Building2,
      title: "Fintech Startup",
      before: [
        "5% user activation rate after signup",
        "Separate systems for email and SMS",
        "No follow-up sequences"
      ],
      after: [
        "43% user activation rate - 8.6x improvement",
        "Unified multi-channel communication",
        "Automated onboarding sequences"
      ],
      metrics: "+320% User Retention",
      color: isLight ? "border-accent/30 bg-white shadow-lg shadow-accent/5" : "border-accent/20"
    },
    {
      icon: UtensilsCrossed,
      title: "Restaurant Chain",
      before: [
        "Mass SMS campaigns with no targeting",
        "8% response rate to promotions",
        "No customer visit tracking"
      ],
      after: [
        "Targeted WhatsApp campaigns by location and preferences",
        "37% response rate - 4.6x improvement",
        "Customer loyalty program automation"
      ],
      metrics: "+156% Repeat Customers",
      color: isLight ? "border-green-500/30 bg-white shadow-lg shadow-green-500/5" : "border-green-500/20"
    }
  ];

  return (
    <section className={`py-24 ${isLight ? 'bg-gray-50' : 'bg-background'}`}>
      <div className="container px-4 mx-auto">
        {/* Main features */}
        <div 
          className={`mb-32 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="mb-16 text-center">
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 font-heading ${isLight ? 'text-gray-900' : ''}`}>
              Multi-Channel Marketing <span className="text-primary">Simplified</span>
            </h2>
            <p className={`max-w-3xl mx-auto text-lg ${isLight ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Our all-in-one platform helps Nigerian businesses connect with customers across all channels—email, SMS, and WhatsApp—with powerful automation workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group hover:translate-y-[-5px] transition-all duration-300 ${
                  isLight 
                    ? 'bg-white shadow-md hover:shadow-lg border border-gray-100 rounded-xl p-6' 
                    : 'feature-card'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className={`w-14 h-14 mb-5 rounded-lg flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${isLight ? 'text-gray-900' : ''}`}>{feature.title}</h3>
                <p className={`mb-4 ${isLight ? 'text-gray-600' : 'text-muted-foreground'}`}>{feature.description}</p>
                <Link 
                  href={feature.link} 
                  className={`${isLight ? 'text-primary-600' : 'text-primary'} font-medium hover:text-primary-600 inline-flex items-center group-hover:underline`}
                >
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        {/* Real results section */}
        <div
          className={`pt-16 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 font-heading ${isLight ? 'text-gray-900' : ''}`}>
              Real Results for Nigerian Businesses
            </h2>
            <p className={`max-w-3xl mx-auto text-lg ${isLight ? 'text-gray-600' : 'text-muted-foreground'}`}>
              See how businesses like yours transformed their marketing performance with MarketSage.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {businessResults.map((business, index) => (
              <div 
                key={index} 
                className={`rounded-xl border overflow-hidden ${business.color} ${isLight ? 'shadow-lg' : 'bg-card'}`}
                style={{ transitionDelay: `${index * 100 + 400}ms` }}
              >
                {/* Business header */}
                <div className={`p-6 flex items-center gap-4 border-b ${isLight ? 'border-gray-200' : 'border-border'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-primary ${
                    isLight ? 'bg-gray-50 shadow-sm' : 'bg-secondary-900/30'
                  }`}>
                    <business.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{business.title}</h3>
                </div>
                
                {/* Before MarketSage */}
                <div className={`p-6 border-b ${
                  isLight ? 'border-gray-200 bg-gray-50/70' : 'border-border bg-card/50'
                }`}>
                  <h4 className={`text-lg font-medium mb-4 ${
                    isLight ? 'text-gray-700' : 'text-foreground/80'
                  }`}>Before MarketSage</h4>
                  <ul className="space-y-3">
                    {business.before.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <span className={`${
                          isLight ? 'text-gray-600' : 'text-foreground/70'
                        }`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* After MarketSage */}
                <div className={`p-6 ${isLight ? 'bg-white' : 'bg-card'}`}>
                  <h4 className={`text-lg font-medium mb-4 ${
                    isLight ? 'text-gray-700' : 'text-foreground/80'
                  }`}>After MarketSage</h4>
                  <ul className="space-y-3">
                    {business.after.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className={`${
                          isLight ? 'text-gray-600' : 'text-foreground/70'
                        }`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Metrics */}
                <div className={`p-4 text-center ${
                  isLight ? 'bg-primary/10' : 'bg-primary/5'
                }`}>
                  <p className={`text-xl font-bold ${isLight ? 'text-primary-600' : 'text-primary'}`}>{business.metrics}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 