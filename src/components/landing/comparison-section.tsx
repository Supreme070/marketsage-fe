"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  Check, 
  X, 
  Eye, 
  Brain, 
  Zap, 
  Target,
  AlertTriangle,
  Crown,
  Shield,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const comparisonData = [
  {
    category: "Visitor Intelligence",
    items: [
      {
        feature: "Anonymous Visitor Tracking",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "See every visitor before they convert"
      },
      {
        feature: "Real-time Behavioral Scoring",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "AI-powered intent scoring with 200+ signals"
      },
      {
        feature: "Journey Visualization",
        traditional: "limited",
        marketsage: true,
        description: "Complete customer journey mapping"
      },
      {
        feature: "Cross-Device Tracking",
        traditional: false,
        marketsage: true,
        description: "Track users across all devices"
      }
    ]
  },
  {
    category: "AI Predictions",
    items: [
      {
        feature: "Conversion Prediction",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "78% accuracy in predicting conversions"
      },
      {
        feature: "Revenue Opportunity Detection",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "Identify hidden revenue opportunities"
      },
      {
        feature: "Behavioral Pattern Analysis",
        traditional: "basic",
        marketsage: true,
        description: "Advanced AI pattern recognition"
      },
      {
        feature: "Lifetime Value Prediction",
        traditional: false,
        marketsage: true,
        description: "Predict customer value before conversion"
      }
    ]
  },
  {
    category: "Revenue Recovery",
    items: [
      {
        feature: "Invisible Revenue Detection",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "Find 23% of revenue you're missing"
      },
      {
        feature: "Real-time Decision Engine",
        traditional: false,
        marketsage: true,
        description: "Automated responses to visitor behavior"
      },
      {
        feature: "Multi-channel Orchestration",
        traditional: "limited",
        marketsage: true,
        description: "Unified experience across all channels"
      },
      {
        feature: "Revenue Attribution",
        traditional: "basic",
        marketsage: true,
        description: "Complete revenue journey attribution"
      }
    ]
  },
  {
    category: "African Market",
    items: [
      {
        feature: "WhatsApp Business Integration",
        traditional: false,
        marketsage: true,
        description: "Native African messaging channels"
      },
      {
        feature: "Local Payment Behavior Understanding",
        traditional: false,
        marketsage: true,
        highlight: true,
        description: "Built for African business context"
      },
      {
        feature: "African Data Residency",
        traditional: false,
        marketsage: true,
        description: "Data stays in Africa for compliance"
      },
      {
        feature: "Multi-language Support",
        traditional: "limited",
        marketsage: true,
        description: "English, French, Hausa, Yoruba, Igbo"
      }
    ]
  },
  {
    category: "Enterprise Features",
    items: [
      {
        feature: "SOC 2 Certification",
        traditional: "varies",
        marketsage: true,
        description: "Enterprise-grade security"
      },
      {
        feature: "99.99% Uptime SLA",
        traditional: "varies",
        marketsage: true,
        description: "Mission-critical reliability"
      },
      {
        feature: "Dedicated Support",
        traditional: "paid",
        marketsage: true,
        description: "Enterprise support included"
      },
      {
        feature: "Custom Integrations",
        traditional: "limited",
        marketsage: true,
        description: "API-first architecture"
      }
    ]
  }
];

const traditionalTools = [
  "Mailchimp", "Sendinblue", "HubSpot", "Marketo", "Pardot"
];

export function ComparisonSection() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  const renderCheckmark = (value: boolean | string, isMarketSage: boolean = false) => {
    if (value === true) {
      return (
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
          isMarketSage ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          <Check className="h-5 w-5" />
        </div>
      );
    } else if (value === false) {
      return (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400">
          <X className="h-5 w-5" />
        </div>
      );
    } else if (value === "limited" || value === "basic" || value === "varies" || value === "paid") {
      return (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }
    return null;
  };

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <section className={`py-20 ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            MarketSage Intelligence vs{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Traditional Tools
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-3xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
          >
            See why enterprises choose intelligence over basic automation. 
            Compare what you get with MarketSage vs traditional marketing tools.
          </motion.p>
        </div>

        {/* Comparison Table Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`backdrop-blur-sm border rounded-t-xl p-6 ${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}
        >
          <div className="grid grid-cols-3 gap-8 items-center">
            <div className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Capability</div>
            <div className="text-center">
              <div className={`text-sm mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Traditional Marketing Tools</div>
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                {traditionalTools.join(", ")}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>MarketSage Intelligence</span>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                Enterprise Intelligence Platform
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Comparison Categories */}
        <div className={`backdrop-blur-sm border-x ${isLight ? 'bg-white/30 border-slate-200' : 'bg-slate-800/30 border-slate-700/50'}`}>
          {comparisonData.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              className={`border-b last:border-b-0 ${isLight ? 'border-slate-200' : 'border-slate-700/30'}`}
            >
              {/* Category Header */}
              <div className={`p-4 border-b ${isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-800/50 border-slate-700/30'}`}>
                <div className="flex items-center gap-3">
                  {category.category === "Visitor Intelligence" && <Eye className="h-5 w-5 text-blue-400" />}
                  {category.category === "AI Predictions" && <Brain className="h-5 w-5 text-purple-400" />}
                  {category.category === "Revenue Recovery" && <TrendingUp className="h-5 w-5 text-green-400" />}
                  {category.category === "African Market" && <Target className="h-5 w-5 text-orange-400" />}
                  {category.category === "Enterprise Features" && <Shield className="h-5 w-5 text-blue-400" />}
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{category.category}</h3>
                </div>
              </div>

              {/* Category Items */}
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: itemIndex * 0.05 }}
                  className={`grid grid-cols-3 gap-8 p-4 items-center transition-colors ${
                    isLight ? 'hover:bg-slate-100/50' : 'hover:bg-slate-700/20'
                  } ${
                    item.highlight 
                      ? isLight 
                        ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-blue-500/50' 
                        : 'bg-gradient-to-r from-blue-900/10 to-purple-900/10 border-l-4 border-blue-500/50' 
                      : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className={`font-medium ${item.highlight ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-700' : 'text-slate-300')}`}>
                      {item.feature}
                      {item.highlight && (
                        <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          Key Differentiator
                        </Badge>
                      )}
                    </div>
                    <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{item.description}</div>
                  </div>
                  
                  <div className="text-center">
                    {renderCheckmark(item.traditional)}
                    {item.traditional === "limited" && (
                      <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Limited</div>
                    )}
                    {item.traditional === "basic" && (
                      <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Basic</div>
                    )}
                    {item.traditional === "varies" && (
                      <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Varies</div>
                    )}
                    {item.traditional === "paid" && (
                      <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Paid Add-on</div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    {renderCheckmark(item.marketsage, true)}
                    {item.highlight && (
                      <div className="text-xs text-green-400 mt-1 font-medium">✓ Included</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Bottom Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className={`border rounded-b-xl p-8 ${isLight ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200' : 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20'}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                The Unfair Advantage for African Enterprises
              </h3>
              <p className={`mb-6 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                While your competitors use basic marketing automation, you'll have enterprise-grade 
                marketing intelligence that sees and converts revenue they completely miss.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>See 23% more revenue opportunities</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>78% accuracy in conversion predictions</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Built specifically for African markets</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Enterprise security & compliance</span>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right">
              <div className={`border rounded-xl p-6 mb-6 ${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <div className={`text-sm mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Traditional Tools Price Range</div>
                <div className={`text-2xl font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>₦50K - ₦100K/month</div>
                <div className="text-xs text-red-400">+ Limited intelligence capabilities</div>
                
                <div className={`my-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}></div>
                
                <div className="text-sm text-blue-400 mb-2">MarketSage Intelligence</div>
                <div className={`text-3xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Enterprise Pricing</div>
                <div className="text-xs text-green-400">Full intelligence platform included</div>
              </div>

              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold w-full"
              >
                <Eye className="mr-2 h-5 w-5" />
                Get Enterprise Intelligence Pricing
              </Button>
              
              <p className={`text-sm mt-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Custom pricing for enterprise volumes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 