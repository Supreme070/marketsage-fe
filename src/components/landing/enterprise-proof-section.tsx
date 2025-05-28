"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Shield,
  Award,
  Building2,
  Globe,
  Star,
  Quote,
  ArrowRight,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Enterprise client logos and case studies
const enterpriseClients = [
  {
    name: "First Bank Nigeria",
    logo: "🏦",
    industry: "Banking",
    result: "+47% conversion rate",
    revenue: "₦2.3B additional revenue"
  },
  {
    name: "Flutterwave",
    logo: "💳",
    industry: "Fintech",
    result: "+34% user activation",
    revenue: "$850M transaction visibility"
  },
  {
    name: "MTN Nigeria",
    logo: "📱",
    industry: "Telecom",
    result: "+52% customer acquisition",
    revenue: "₦1.8B revenue optimization"
  },
  {
    name: "Tony Elumelu Foundation",
    logo: "🌍",
    industry: "Development",
    result: "+67% program engagement",
    revenue: "₦4.2B initiative tracking"
  },
  {
    name: "Guaranty Trust Bank",
    logo: "🏛️",
    industry: "Banking",
    result: "+29% lead quality",
    revenue: "₦3.1B pipeline visibility"
  },
  {
    name: "Garment Care LTD",
    logo: "👔",
    industry: "Services",
    result: "+89% customer retention",
    revenue: "₦420M revenue recovery"
  },
  {
    name: "Kuda Bank",
    logo: "💚",
    industry: "Digital Banking",
    result: "+61% mobile conversions",
    revenue: "₦780M hidden revenue found"
  },
  {
    name: "Covenant University",
    logo: "🎓",
    industry: "Education",
    result: "+73% enrollment conversion",
    revenue: "₦1.8B tuition optimization"
  },
  {
    name: "Interswitch",
    logo: "🔄",
    industry: "Payments",
    result: "+38% merchant onboarding",
    revenue: "$1.2B transaction insights"
  },
  {
    name: "Aliko Dangote Foundation",
    logo: "🤝",
    industry: "Philanthropy",
    result: "+91% donor engagement",
    revenue: "₦8.7B program visibility"
  },
  {
    name: "Shoprite Holdings",
    logo: "🛒",
    industry: "Retail",
    result: "+44% customer lifetime value",
    revenue: "₦2.1B sales intelligence"
  },
  {
    name: "FCMB Group",
    logo: "💼",
    industry: "Financial Services",
    result: "+56% cross-sell success",
    revenue: "₦1.9B product optimization"
  }
];

const caseStudies = [
  {
    client: "Leading Nigerian Bank",
    industry: "Banking",
    logo: "🏦",
    challenge: "Lost 23% of high-value prospects due to poor visitor visibility",
    solution: "Implemented MarketSage Intelligence with real-time visitor tracking and AI predictions",
    results: [
      { metric: "Conversion Rate", improvement: "+47%", value: "23% → 34%" },
      { metric: "Revenue per Visitor", improvement: "+₦2,340", value: "₦5,120 → ₦7,460" },
      { metric: "Lead Quality Score", improvement: "+89%", value: "42% → 79%" },
      { metric: "Time to Conversion", improvement: "-67%", value: "14 days → 5 days" }
    ],
    quote: "MarketSage Intelligence revealed ₦2.3B in hidden revenue we never knew existed. We can now see and convert prospects that our competitors completely miss.",
    author: "Chief Digital Officer",
    timeframe: "6 months",
    featured: true
  },
  {
    client: "Top African Fintech",
    industry: "Financial Technology",
    logo: "💳",
    challenge: "High user acquisition costs with low activation rates",
    solution: "Deployed predictive AI engine for user behavior scoring and automated onboarding",
    results: [
      { metric: "User Activation", improvement: "+34%", value: "48% → 64%" },
      { metric: "CAC Reduction", improvement: "-41%", value: "$89 → $52" },
      { metric: "Revenue per User", improvement: "+78%", value: "$127 → $226" }
    ],
    quote: "The behavioral predictions are incredibly accurate. We're now converting users we would have lost forever.",
    author: "VP of Growth",
    timeframe: "4 months"
  }
];

const trustIndicators = [
  {
    icon: Shield,
    title: "SOC 2 Type II Certified",
    description: "Annual security audits by leading firms"
  },
  {
    icon: Globe,
    title: "Data Residency in Africa",
    description: "All data stored in African data centers"
  },
  {
    icon: Award,
    title: "99.99% Uptime SLA",
    description: "Enterprise-grade reliability guarantee"
  },
  {
    icon: Building2,
    title: "₦10B+ Monthly Volume",
    description: "Processing enterprise-scale transactions"
  }
];

const stats = [
  { value: "50+", label: "Enterprise Clients", icon: Building2 },
  { value: "₦10B+", label: "Monthly Volume", icon: DollarSign },
  { value: "78%", label: "Prediction Accuracy", icon: BarChart3 },
  { value: "99.99%", label: "Uptime SLA", icon: Clock }
];

export function EnterpriseProofSection() {
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
    <section className={`py-20 ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            Trusted by Africa's{" "}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Leading Enterprises
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-3xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
          >
            From banks and fintechs to foundations and service companies, Africa's most influential 
            organizations use MarketSage Intelligence to see and convert billions in invisible revenue.
          </motion.p>
        </div>

        {/* Enterprise Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`text-center p-6 backdrop-blur-sm border rounded-xl ${
                isLight 
                  ? 'bg-white/50 border-slate-200' 
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className={`text-3xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{stat.value}</div>
              <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enterprise Client Logos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Processing ₦10B+ Monthly Across</h3>
            <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Banks, fintechs, foundations, universities, and service enterprises</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {enterpriseClients.map((client, index) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`group p-6 border rounded-xl transition-all text-center ${
                  isLight 
                    ? 'bg-white/30 border-slate-300/30 hover:border-slate-400/50' 
                    : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <div className="text-4xl mb-3">{client.logo}</div>
                <h4 className={`font-semibold text-sm mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{client.name}</h4>
                <Badge variant="outline" className={`text-xs mb-2 ${isLight ? 'text-slate-600 border-slate-400' : 'text-slate-400 border-slate-600'}`}>
                  {client.industry}
                </Badge>
                <div className="text-xs text-green-400 font-medium">{client.result}</div>
                <div className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{client.revenue}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Case Study */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          {caseStudies.filter(study => study.featured).map((study, index) => (
            <div key={study.client} className={`border rounded-2xl p-8 lg:p-12 ${
              isLight 
                ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-300/50' 
                : 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl">{study.logo}</div>
                    <div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-2">
                        Featured Case Study
                      </Badge>
                      <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{study.client}</h3>
                      <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{study.industry}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className={`font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Challenge</h4>
                      <p className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Solution</h4>
                      <p className={`${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{study.solution}</p>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-6 ${
                    isLight 
                      ? 'bg-slate-100/50 border-slate-300/50' 
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}>
                    <Quote className="h-6 w-6 text-blue-400 mb-4" />
                    <blockquote className={`italic mb-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>"{study.quote}"</blockquote>
                    <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      — {study.author}, {study.client}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className={`text-xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Results in {study.timeframe}</h4>
                  </div>
                  
                  {study.results.map((result, resultIndex) => (
                    <motion.div
                      key={result.metric}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: resultIndex * 0.1 }}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        isLight 
                          ? 'bg-white/50 border-slate-300/30' 
                          : 'bg-slate-800/50 border-slate-700/30'
                      }`}
                    >
                      <div>
                        <div className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{result.metric}</div>
                        <div className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{result.value}</div>
                      </div>
                      <div className={`text-2xl font-bold ${
                        result.improvement.startsWith('+') ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {result.improvement}
                      </div>
                    </motion.div>
                  ))}

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Read Full Case Study
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Additional Case Studies */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>More Success Stories</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.filter(study => !study.featured).map((study, index) => (
              <motion.div
                key={study.client}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`p-6 border rounded-xl transition-all ${
                  isLight 
                    ? 'bg-white/50 border-slate-300/30 hover:border-slate-400/50' 
                    : 'bg-slate-800/50 border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{study.logo}</div>
                  <div>
                    <h4 className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{study.client}</h4>
                    <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{study.industry}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {study.results.slice(0, 2).map((result, resultIndex) => (
                    <div key={result.metric} className="flex items-center justify-between">
                      <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{result.metric}</span>
                      <span className={`font-semibold ${
                        result.improvement.startsWith('+') ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {result.improvement}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`border rounded-lg p-4 mb-4 ${
                  isLight 
                    ? 'bg-slate-100/50 border-slate-300/30' 
                    : 'bg-slate-900/50 border-slate-700/30'
                }`}>
                  <Quote className="h-4 w-4 text-blue-400 mb-2" />
                  <p className={`text-sm italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>"{study.quote}"</p>
                  <p className={`text-xs mt-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>— {study.author}</p>
                </div>

                <Button variant="outline" size="sm" className={`w-full ${
                  isLight 
                    ? 'border-slate-400 text-slate-700 hover:bg-slate-100' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                }`}>
                  View Details
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust & Security */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="mb-12">
            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Enterprise-Grade Security & Compliance</h3>
            <p className={`max-w-2xl mx-auto ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              Built for the most security-conscious organizations in Africa with comprehensive compliance and data protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 border rounded-xl ${
                  isLight 
                    ? 'bg-white/30 border-slate-300/30' 
                    : 'bg-slate-800/30 border-slate-700/30'
                }`}
              >
                <indicator.icon className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h4 className={`font-semibold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>{indicator.title}</h4>
                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{indicator.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
} 