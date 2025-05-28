"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  Eye, 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Globe, 
  Shield,
  ArrowRight,
  Radar,
  Activity,
  Layers,
  GitBranch,
  BarChart3,
  MessageSquare,
  Mail,
  Smartphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const intelligenceFeatures = [
  {
    category: "LEADPULSE INTELLIGENCE",
    badge: "Core Platform",
    icon: Radar,
    color: "from-blue-500 to-purple-600",
    features: [
      {
        icon: Eye,
        title: "Anonymous Visitor Tracking",
        description: "See every visitor before they convert. Track anonymous users across your entire customer journey with 99.9% accuracy.",
        stats: "Track 50M+ monthly visitors",
        highlight: true
      },
      {
        icon: Activity,
        title: "Real-time Behavioral Scoring", 
        description: "AI-powered scoring system that rates visitor intent in real-time based on 200+ behavioral signals.",
        stats: "78% prediction accuracy"
      },
      {
        icon: BarChart3,
        title: "Journey Visualization",
        description: "See the complete customer journey from first visit to conversion with heatmaps and flow analysis.",
        stats: "Map every touchpoint"
      }
    ]
  },
  {
    category: "PREDICTIVE AI ENGINE",
    badge: "AI-Powered",
    icon: Brain,
    color: "from-purple-500 to-pink-600",
    features: [
      {
        icon: Target,
        title: "Conversion Prediction",
        description: "Predict which visitors will convert with 78% accuracy. Get conversion probability scores in real-time.",
        stats: "78% accuracy rate",
        highlight: true
      },
      {
        icon: TrendingUp,
        title: "Revenue Opportunity Detection", 
        description: "Identify high-value prospects and predict their lifetime value before first conversion.",
        stats: "Spot 23% hidden revenue"
      },
      {
        icon: Layers,
        title: "Behavioral Pattern Analysis",
        description: "AI analyzes millions of data points to identify patterns that predict customer behavior.",
        stats: "200+ behavioral signals"
      }
    ]
  },
  {
    category: "AUTOMATED ORCHESTRATION",
    badge: "Automation",
    icon: GitBranch,
    color: "from-green-500 to-blue-600",
    features: [
      {
        icon: Zap,
        title: "Real-time Decision Engine",
        description: "Automatically trigger personalized responses based on visitor behavior and AI predictions.",
        stats: "Sub-second response time"
      },
      {
        icon: Users,
        title: "Multi-channel Optimization", 
        description: "Orchestrate personalized experiences across email, SMS, WhatsApp, and web in real-time.",
        stats: "5+ channel integration",
        highlight: true
      },
      {
        icon: Globe,
        title: "African Market Specialization",
        description: "Built specifically for African business context with local payment behaviors and cultural insights.",
        stats: "8 African countries"
      }
    ]
  }
];

const campaignTools = [
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Advanced email marketing with AI optimization"
  },
  {
    icon: Smartphone,
    title: "SMS & WhatsApp",
    description: "Native African messaging channels"
  },
  {
    icon: MessageSquare,
    title: "Multi-channel Workflows",
    description: "Drag-and-drop automation builder"
  }
];

export function IntelligenceFeaturesSection() {
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

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <section className={`py-20 ${isLight ? 'bg-slate-50' : 'bg-slate-950'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            Marketing Intelligence That{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Sees Everything
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-3xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
          >
            Stop flying blind. MarketSage Intelligence gives you X-ray vision into your customer journey, 
            predicts behavior with AI, and converts invisible revenue automatically.
          </motion.p>
        </div>

        {/* Main Intelligence Features */}
        <div className="space-y-16">
          {intelligenceFeatures.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
              className="relative"
            >
              {/* Category Header */}
              <div className="text-center mb-12">
                <Badge className={`px-4 py-2 mb-4 ${isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {category.badge}
                </Badge>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color}`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {category.category}
                  </h3>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: featureIndex * 0.1 }}
                    className={`relative p-6 rounded-xl border transition-all ${
                      feature.highlight 
                        ? isLight 
                          ? 'bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-xl hover:border-slate-400' 
                          : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-600/50 shadow-xl hover:border-slate-600/50'
                        : isLight
                          ? 'bg-white/50 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/50 border-slate-700/30 hover:border-slate-600/50'
                    }`}
                  >
                    {feature.highlight && (
                      <div className="absolute -top-3 left-6">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} bg-opacity-20`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className={`text-xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h4>
                    </div>

                    <p className={`mb-4 leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${isLight ? 'text-slate-600 border-slate-300' : 'text-slate-400 border-slate-600'}`}>
                        {feature.stats}
                      </Badge>
                      
                      {feature.highlight && (
                        <Button variant="ghost" size="sm" className={`p-0 ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}>
                          Learn more <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Campaign Tools - Downplayed */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={`mt-20 pt-16 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}
        >
          <div className="text-center mb-12">
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Oh, We Also Execute Campaigns
            </h3>
            <p className={`max-w-2xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Once our intelligence platform identifies and predicts your best prospects, 
              we automatically execute personalized campaigns across all channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {campaignTools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 border rounded-lg text-center ${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-900/30 border-slate-800/50'}`}
              >
                <div className={`p-3 rounded-lg inline-block mb-4 ${isLight ? 'bg-slate-100' : 'bg-slate-800/50'}`}>
                  <tool.icon className={`h-6 w-6 ${isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                </div>
                <h4 className={`text-lg font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>{tool.title}</h4>
                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise Security & Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className={`mt-20 pt-16 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/50'}`}
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-green-400" />
              <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Enterprise-Grade Security</h3>
            </div>
            <p className={`max-w-2xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Built for African enterprises with the highest security standards and local data residency.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "SOC 2 Certified", icon: Shield },
              { label: "GDPR Compliant", icon: Globe },
              { label: "99.9% Uptime", icon: Activity },
              { label: "African Data Centers", icon: Globe }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col items-center gap-3 p-4 border rounded-lg ${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-900/30 border-slate-800/50'}`}
              >
                <item.icon className="h-6 w-6 text-green-400" />
                <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <div className={`border rounded-2xl p-8 max-w-3xl mx-auto ${isLight ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20'}`}>
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Stop Losing Revenue to Invisible Visitors
            </h3>
            <p className={`mb-6 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Every minute you wait, prospects are leaving your site without converting. 
              See them, predict their behavior, and convert them automatically.
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Eye className="mr-2 h-5 w-5" />
              Start Seeing Your Invisible Revenue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 