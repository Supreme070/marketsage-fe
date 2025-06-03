"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Brain, 
  TrendingUp, 
  ArrowRight, 
  Users, 
  MapPin, 
  Clock,
  Zap,
  Shield,
  Globe,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Star,
  Building2,
  Phone,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

// Live visitor data simulation
const generateVisitorData = () => ({
  id: Math.random().toString(36).substr(2, 9),
  location: ["Lagos, Nigeria", "Nairobi, Kenya", "Cape Town, SA", "Accra, Ghana", "Kigali, Rwanda"][Math.floor(Math.random() * 5)],
  behavior: ["Viewing pricing", "Reading case study", "Downloading whitepaper", "Browsing features", "Contact form"][Math.floor(Math.random() * 5)],
  score: Math.floor(Math.random() * 100),
  timeOnSite: Math.floor(Math.random() * 300) + 30,
  prediction: ["High intent", "Medium intent", "Research phase", "Ready to buy"][Math.floor(Math.random() * 4)],
  industry: ["Banking", "Fintech", "E-commerce", "Telecom", "Insurance"][Math.floor(Math.random() * 5)]
});

export function IntelligenceHeroSection() {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [liveVisitorCount, setLiveVisitorCount] = useState(234);
  const [activeCount, setActiveCount] = useState(228);
  const [totalToday, setTotalToday] = useState(919);
  const [revenueCounter, setRevenueCounter] = useState(847392);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeDemo, setActiveDemo] = useState<'visitors' | 'predictions' | 'revenue'>('visitors');
  const [mounted, setMounted] = useState(false);

  // Generate alert data
  const generateAlert = () => ({
    id: Math.random().toString(36).substr(2, 9),
    type: ["high_intent", "conversion", "exit_intent", "engagement"][Math.floor(Math.random() * 4)],
    message: [
      "High-intent visitor from Lagos viewing pricing",
      "Conversion prediction: 89% - Contact now",
      "Exit intent detected - Auto-engaging",
      "Enterprise visitor session: 12min+"
    ][Math.floor(Math.random() * 4)],
    timestamp: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    setMounted(true);
    
    // Initialize with some visitor data and alerts
    setVisitors(Array.from({ length: 5 }, generateVisitorData));
    setAlerts(Array.from({ length: 2 }, generateAlert));

    // Simulate live visitor count changes
    const visitorInterval = setInterval(() => {
      setLiveVisitorCount(prev => prev + Math.floor(Math.random() * 3) - 1);
      setActiveCount(prev => Math.max(150, prev + Math.floor(Math.random() * 6) - 2));
      setTotalToday(prev => prev + Math.floor(Math.random() * 8) + 2);
      
      // Add new visitor occasionally
      if (Math.random() > 0.7) {
        setVisitors(prev => [generateVisitorData(), ...prev.slice(0, 4)]);
      }

      // Add new alert occasionally
      if (Math.random() > 0.8) {
        setAlerts(prev => [generateAlert(), ...prev.slice(0, 1)]);
      }
    }, 3000);

    // Simulate revenue counter
    const revenueInterval = setInterval(() => {
      setRevenueCounter(prev => prev + Math.floor(Math.random() * 1000) + 500);
    }, 2000);

    return () => {
      clearInterval(visitorInterval);
      clearInterval(revenueInterval);
    };
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
    <section className={`relative overflow-hidden py-20 lg:py-32 ${isLight ? 'bg-gradient-to-b from-white to-slate-50' : 'bg-slate-950'}`}>
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(59,130,246,0.05)_50%,transparent_70%)]" />
        
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-20">
          <div className={`h-full w-full bg-[linear-gradient(rgba(59,130,246,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,${isLight ? 'white' : 'black'}_50%,transparent_100%)]`} />
        </div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Messaging */}
          <div className="max-w-2xl">
            {/* Enterprise badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Trusted by 50+ African Enterprises
              </Badge>
            </motion.div>

            {/* Main headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className={`mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${isLight ? 'text-slate-900' : 'text-white'}`}
            >
              See and Convert Your{" "}
              <motion.span 
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(20, 184, 166, 0.5)",
                    "0 0 20px rgba(20, 184, 166, 0.8)",
                    "0 0 30px rgba(20, 184, 166, 1)",
                    "0 0 20px rgba(20, 184, 166, 0.8)",
                    "0 0 10px rgba(20, 184, 166, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="text-teal-400"
              >
                Invisible
              </motion.span>{" "}
              <motion.span 
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(251, 191, 36, 0.5)",
                    "0 0 20px rgba(251, 191, 36, 0.8)",
                    "0 0 30px rgba(251, 191, 36, 1)",
                    "0 0 20px rgba(251, 191, 36, 0.8)",
                    "0 0 10px rgba(251, 191, 36, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                className="text-amber-400"
              >
                Revenue
              </motion.span>
            </motion.h1>
            
            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`mb-8 text-xl leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
            >
              The only Marketing Intelligence Platform built for African enterprises. 
              Track anonymous visitors, predict conversions, and stop losing 23% of your revenue to invisible prospects.
            </motion.p>

            {/* Live stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-8 grid grid-cols-2 gap-4"
            >
              <div className={`${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-900/50 border-slate-700/50'} backdrop-blur-sm border rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Live Visitors</span>
                </div>
                <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{liveVisitorCount.toLocaleString()}</div>
                <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>on African websites now</div>
              </div>
              
              <div className={`${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-900/50 border-slate-700/50'} backdrop-blur-sm border rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Revenue Tracked</span>
                </div>
                <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{revenueCounter.toLocaleString()}</div>
                <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>this hour</div>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur-md opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
                <Button 
                  size="default" 
                  className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 text-base font-semibold border-0 shadow-lg backdrop-blur-sm"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Eye className="h-5 w-5" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent font-semibold">
                      Discover Invisible Visitors
                    </span>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className={`absolute inset-0 rounded-lg blur-md opacity-25 group-hover:opacity-40 transition-opacity duration-300 ${
                  isLight 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                }`} />
                <Button 
                  size="default" 
                  variant="outline" 
                  className={`relative border-2 backdrop-blur-md px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300 ${
                    isLight 
                      ? 'border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300' 
                      : 'border-emerald-400/50 bg-slate-900/80 text-emerald-300 hover:bg-emerald-900/20 hover:border-emerald-300'
                  }`}
                  onClick={() => setActiveDemo('revenue')}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Target className="mr-2 h-5 w-5" />
                  </motion.div>
                  <span className={`font-semibold ${
                    isLight 
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent'
                  }`}>
                    Calculate Hidden Revenue
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Enterprise credentials */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className={`flex items-center gap-6 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>African Data Residency</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>₦10B+ Monthly Volume</span>
              </div>
            </motion.div>
          </div>

          {/* Right side - Live Demo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            {/* Demo container */}
            <div className={`${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/80 border-slate-700/50'} backdrop-blur-sm border rounded-xl p-6 shadow-2xl`}>
              {/* Demo tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'visitors', label: 'Live Visitors', icon: Users },
                  { id: 'predictions', label: 'AI Predictions', icon: Brain },
                  { id: 'revenue', label: 'Revenue Flow', icon: TrendingUp }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveDemo(id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeDemo === id 
                        ? 'bg-blue-600 text-white' 
                        : `${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Demo content */}
              <AnimatePresence mode="wait">
                {activeDemo === 'visitors' && (
                  <motion.div
                    key="visitors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Live Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.02, 1],
                          boxShadow: ["0 4px 6px -1px rgba(59, 130, 246, 0.1)", "0 8px 25px -5px rgba(59, 130, 246, 0.3)", "0 4px 6px -1px rgba(59, 130, 246, 0.1)"]
                        }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        className={`text-center p-3 rounded-lg border backdrop-blur-md ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/30'}`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            className="h-2 w-2 bg-green-400 rounded-full animate-pulse" 
                          />
                          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Active</span>
                        </div>
                        <motion.div 
                          key={activeCount}
                          initial={{ scale: 1.1, color: "#10b981" }}
                          animate={{ scale: 1, color: isLight ? "#0f172a" : "#ffffff" }}
                          transition={{ duration: 0.5 }}
                          className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}
                        >
                          {activeCount}
                        </motion.div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Now</div>
                      </motion.div>
                      
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.02, 1],
                          boxShadow: ["0 4px 6px -1px rgba(59, 130, 246, 0.1)", "0 8px 25px -5px rgba(59, 130, 246, 0.3)", "0 4px 6px -1px rgba(59, 130, 246, 0.1)"]
                        }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                        className={`text-center p-3 rounded-lg border backdrop-blur-md ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/30'}`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Globe className="h-3 w-3 text-blue-400" />
                          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Total</span>
                        </div>
                        <motion.div 
                          key={totalToday}
                          initial={{ scale: 1.1, color: "#3b82f6" }}
                          animate={{ scale: 1, color: isLight ? "#0f172a" : "#ffffff" }}
                          transition={{ duration: 0.5 }}
                          className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}
                        >
                          {totalToday}
                        </motion.div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Today</div>
                      </motion.div>
                      
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.02, 1],
                          boxShadow: ["0 4px 6px -1px rgba(139, 92, 246, 0.1)", "0 8px 25px -5px rgba(139, 92, 246, 0.3)", "0 4px 6px -1px rgba(139, 92, 246, 0.1)"]
                        }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                        className={`text-center p-3 rounded-lg border backdrop-blur-md ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/30'}`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Brain className="h-3 w-3 text-purple-400" />
                          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>AI</span>
                        </div>
                        <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>78%</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Accuracy</div>
                      </motion.div>
                      
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.02, 1],
                          boxShadow: ["0 4px 6px -1px rgba(16, 185, 129, 0.1)", "0 8px 25px -5px rgba(16, 185, 129, 0.3)", "0 4px 6px -1px rgba(16, 185, 129, 0.1)"]
                        }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
                        className={`text-center p-3 rounded-lg border backdrop-blur-md ${isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/30'}`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-3 w-3 text-green-400" />
                          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Revenue</span>
                        </div>
                        <div className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>+23%</div>
                        <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Lift</div>
                      </motion.div>
                    </div>

                    {/* Live Visitor Intelligence and Alerts Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Live Visitor Intelligence - Takes 2/3 of space */}
                      <div className="lg:col-span-2">
                        <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <Eye className="h-5 w-5 text-blue-400" />
                          Live Visitor Intelligence
                        </h4>
                        <div className="space-y-3">
                          {visitors.slice(0, 3).map((visitor, index) => (
                            <motion.div
                              key={visitor.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/30'}`}
                            >
                              <div className="flex-shrink-0">
                                <div className={`w-3 h-3 rounded-full ${
                                  visitor.score > 70 ? 'bg-green-400' :
                                  visitor.score > 40 ? 'bg-yellow-400' : 'bg-red-400'
                                } animate-pulse`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <MapPin className={`h-3 w-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                                  <span className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{visitor.location}</span>
                                  <Badge variant="outline" className={`text-xs ${isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-900/30 text-blue-300 border-blue-700'}`}>
                                    {visitor.score}
                                  </Badge>
                                </div>
                                <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{visitor.behavior} • {visitor.industry}</div>
                              </div>
                              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                                {Math.floor(visitor.timeOnSite / 60)}m
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Live Alerts - Takes 1/3 of space */}
                      <div className="lg:col-span-1">
                        <h5 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          <AlertTriangle className="h-3 w-3 text-orange-400" />
                          Live Alerts
                        </h5>
                        <div className="space-y-2">
                          {alerts.slice(0, 2).map((alert, index) => (
                            <motion.div
                              key={alert.id}
                              initial={{ opacity: 0, x: -20, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className={`flex items-start gap-2 p-2 rounded-lg border backdrop-blur-sm ${
                                isLight 
                                  ? 'bg-orange-50/80 border-orange-200/50' 
                                  : 'bg-orange-500/10 border-orange-500/20'
                              }`}
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                className="h-2 w-2 bg-orange-400 rounded-full mt-1 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className={`text-xs font-medium ${isLight ? 'text-orange-700' : 'text-orange-300'}`}>
                                  {alert.message}
                                </div>
                                <div className={`text-xs ${isLight ? 'text-orange-600/70' : 'text-orange-400/70'}`}>
                                  {alert.timestamp}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeDemo === 'predictions' && (
                  <motion.div
                    key="predictions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h4 className={`text-lg font-semibold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>AI Conversion Predictions</h4>
                    {visitors.slice(0, 3).map((visitor, index) => (
                      <motion.div
                        key={visitor.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/30'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{visitor.location}</span>
                          <Badge className={`${
                            visitor.prediction === 'Ready to buy' ? 'bg-green-500/20 text-green-600 border-green-200' :
                            visitor.prediction === 'High intent' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-200' :
                            'bg-blue-500/20 text-blue-600 border-blue-200'
                          } ${isLight ? 'dark:text-green-400 dark:border-green-700' : ''}`}>
                            {visitor.prediction}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-400" />
                          <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Conversion Probability: {visitor.score}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
                          <motion.div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${visitor.score}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeDemo === 'revenue' && (
                  <motion.div
                    key="revenue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <h4 className={`text-lg font-semibold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Real-time Revenue Tracking</h4>
                    <div className="space-y-4">
                      <div className={`flex items-center justify-between p-4 rounded-lg ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-500/10 border border-green-500/20'}`}>
                        <div>
                          <div className={`text-sm mb-1 ${isLight ? 'text-green-600' : 'text-green-400'}`}>Converted Today</div>
                          <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{(revenueCounter * 0.023).toLocaleString()}</div>
                        </div>
                        <TrendingUp className={`h-8 w-8 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                      </div>
                      
                      <div className={`flex items-center justify-between p-4 rounded-lg ${isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <div>
                          <div className={`text-sm mb-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Lost to Invisibility</div>
                          <div className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{(revenueCounter * 0.23).toLocaleString()}</div>
                        </div>
                        <Eye className={`h-8 w-8 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
                      </div>
                      
                      <div className={`text-center p-4 rounded-lg ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                        <div className={`text-sm mb-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Potential Recovery with MarketSage</div>
                        <div className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₦{(revenueCounter * 0.18).toLocaleString()}</div>
                        <div className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>78% of invisible revenue recovered</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full shadow-lg"
            >
              <Zap className="h-6 w-6" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}