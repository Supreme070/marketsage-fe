"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  Eye, 
  Brain, 
  TrendingUp, 
  ArrowRight,
  Clock,
  Shield,
  Users,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  Phone,
  Calendar,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const urgencyStats = [
  {
    icon: Clock,
    stat: "Every minute",
    description: "23% of your visitors leave invisible",
    color: "text-red-400"
  },
  {
    icon: TrendingUp,
    stat: "₦2.3B+",
    description: "Hidden revenue recovered this year",
    color: "text-green-400"
  },
  {
    icon: Users,
    stat: "50+ enterprises",
    description: "Already using MarketSage Intelligence",
    color: "text-blue-400"
  },
  {
    icon: Target,
    stat: "78% accuracy",
    description: "In predicting customer behavior",
    color: "text-purple-400"
  }
];

const ctaOptions = [
  {
    title: "Executive Demo",
    subtitle: "30-minute intelligence walkthrough",
    description: "See MarketSage Intelligence in action with your data",
    icon: Eye,
    cta: "Book Executive Demo",
    badge: "Most Popular",
    highlights: [
      "Live visitor tracking demo",
      "AI predictions with your data",
      "Revenue recovery calculation",
      "Enterprise pricing discussion"
    ]
  },
  {
    title: "Enterprise Consultation", 
    subtitle: "Strategic implementation planning",
    description: "Custom intelligence strategy for your business",
    icon: Building2,
    cta: "Schedule Consultation",
    badge: "Enterprise",
    highlights: [
      "Intelligence strategy planning",
      "Technical requirements review",
      "Integration roadmap",
      "ROI projections"
    ]
  }
];

export function IntelligenceCtaSection() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleQuickStart = async () => {
    if (!email || !company) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    
    // Reset form
    setEmail("");
    setCompany("");
  };

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <section className={`py-20 relative overflow-hidden ${isLight ? 'bg-gradient-to-b from-slate-50 to-white' : 'bg-gradient-to-b from-slate-950 to-slate-900'}`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-green-100/20' : 'bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-green-900/10'}`} />
      <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full ${isLight ? 'bg-gradient-to-b from-blue-200/10 to-transparent' : 'bg-gradient-to-b from-blue-500/5 to-transparent'}`} />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        {/* Urgency Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {urgencyStats.map((stat, index) => (
              <motion.div
                key={stat.stat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${isLight ? 'bg-slate-200/50' : 'bg-slate-800/50'} ${stat.color} mb-3`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.stat}</div>
                <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main CTA */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-6">
              <AlertTriangle className="h-4 w-4 mr-2" />
              You're Losing Revenue Every Second
            </Badge>
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Stop Watching Revenue{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Walk Away
              </span>
            </h2>
            
            <p className={`text-xl md:text-2xl max-w-4xl mx-auto mb-8 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              While you read this, your competitors are missing 23% of their revenue. 
              MarketSage Intelligence sees and converts what they can't.
            </p>

            <div className="flex items-center justify-center gap-4 text-lg">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span>30-day setup</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <Shield className="h-5 w-5" />
                <span>Enterprise security</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Star className="h-5 w-5" />
                <span>78% accuracy guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Options */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto"
        >
          {ctaOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`relative p-8 rounded-2xl border transition-all ${
                isLight ? 'hover:border-slate-400' : 'hover:border-slate-600/50'
              } hover:shadow-2xl ${
                option.badge === "Most Popular" 
                  ? isLight
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300' 
                    : 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30'
                  : isLight
                    ? 'bg-white/50 border-slate-300'
                    : 'bg-slate-800/50 border-slate-700/30'
              }`}
            >
              {option.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className={
                    option.badge === "Most Popular" 
                      ? "bg-blue-500 text-white border-0" 
                      : "bg-purple-500 text-white border-0"
                  }>
                    {option.badge}
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                  option.badge === "Most Popular" 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  <option.icon className="h-8 w-8" />
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{option.title}</h3>
                <p className={`mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{option.subtitle}</p>
                <p className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{option.description}</p>
              </div>

              <div className="space-y-3 mb-8">
                {option.highlights.map((highlight, highlightIndex) => (
                  <div key={highlightIndex} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{highlight}</span>
                  </div>
                ))}
              </div>

              <Button 
                size="lg"
                className={`w-full text-lg font-semibold ${
                  option.badge === "Most Popular"
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {option.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Start Form */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={`backdrop-blur-sm border rounded-2xl p-8 max-w-4xl mx-auto mb-16 ${
            isLight 
              ? 'bg-gradient-to-r from-white/80 to-slate-50/80 border-slate-300' 
              : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50'
          }`}
        >
          <div className="text-center mb-8">
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Or Get Your Revenue Recovery Report Now
            </h3>
            <p className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              See exactly how much hidden revenue you're losing. Get your custom report in 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="email"
              placeholder="Enterprise email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900' 
                  : 'bg-slate-800/50 border-slate-600 text-white'
              }`}
            />
            <Input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`h-12 ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900' 
                  : 'bg-slate-800/50 border-slate-600 text-white'
              }`}
            />
            <Button 
              onClick={handleQuickStart}
              disabled={!email || !company || isSubmitting}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white h-12 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Get Revenue Report
                </>
              )}
            </Button>
          </div>
          
          <p className={`text-sm text-center mt-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Free custom analysis • No commitment required • Enterprise data security
          </p>
        </motion.div>

        {/* Security & Urgency Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-6 w-6 text-green-400" />
              <div>
                <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>SOC 2 Certified</div>
                <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Enterprise security</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-6 w-6 text-blue-400" />
              <div>
                <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>30-Day Setup</div>
                <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Fast implementation</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <Target className="h-6 w-6 text-purple-400" />
              <div>
                <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>78% Accuracy</div>
                <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Prediction guarantee</div>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-6 max-w-3xl mx-auto ${
            isLight 
              ? 'bg-slate-100/50 border-slate-300' 
              : 'bg-slate-800/30 border-slate-700/30'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              <span className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Revenue Loss Alert</span>
            </div>
            <p className={`mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Every day you delay costs you 0.77% of your monthly revenue in missed opportunities. 
              That's ₦77,000 lost for every ₦10M in monthly revenue.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-red-400 font-medium">Live revenue loss in progress</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 