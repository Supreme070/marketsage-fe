"use client";

import { TrendingUp, DollarSign, Eye, AlertTriangle, BarChart3, PieChart, Sparkles, Calculator, Target, Zap } from "lucide-react";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Generate realistic revenue opportunity data
const generateRevenueData = () => ({
  id: Math.random().toString(36).substr(2, 9),
  company: `${["Lagos Enterprise Bank", "Nairobi Fintech", "Cape Town Insurer", "Accra Telecom", "Kigali Tech Hub", "Abuja Gov Agency"][Math.floor(Math.random() * 6)]}`,
  opportunity: Math.floor(Math.random() * 5000000) + 500000, // 500K to 5M Naira
  status: ["Exit Intent", "High Value", "Research Phase", "Budget Approved", "Decision Pending", "Competitor Analysis"][Math.floor(Math.random() * 6)],
  urgency: ["Critical", "High", "Medium", "Low"][Math.floor(Math.random() * 4)],
  signals: ["Pricing comparison", "Competitor research", "Decision timeline", "Feature deep dive", "Team expansion", "Budget approved"][Math.floor(Math.random() * 6)],
  recovery: ["WhatsApp intervention", "Sales team alerted", "Nurture sequence", "CEO outreach", "Demo scheduled"][Math.floor(Math.random() * 5)],
  probability: Math.floor(Math.random() * 100),
  timeToClose: Math.floor(Math.random() * 30) + 1, // 1-30 days
  source: ["Website", "WhatsApp", "Email", "Social", "Referral"][Math.floor(Math.random() * 5)]
});

export default function RevenueIntelligencePage() {
  // Define primary color for this solution
  const primaryColor = "#F59E0B"; // Orange
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const solutionType = "revenue-intelligence";
  
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [totalHiddenRevenue, setTotalHiddenRevenue] = useState(12800000);
  const [recoveredRevenue, setRecoveredRevenue] = useState(47200000);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with revenue opportunity data
    setOpportunities(Array.from({ length: 6 }, generateRevenueData));

    // Simulate live revenue tracking
    const interval = setInterval(() => {
      setTotalHiddenRevenue(prev => prev + Math.floor(Math.random() * 100000));
      setRecoveredRevenue(prev => prev + Math.floor(Math.random() * 50000));
      
      if (Math.random() > 0.7) {
        setOpportunities(prev => [generateRevenueData(), ...prev.slice(0, 5)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Define features for this solution
  const features = [
    {
      title: "Hidden Revenue Detection",
      description: "Identify the 23% of revenue walking away unnoticed. Our AI scans every visitor interaction to find missed opportunities and revenue leaks.",
      icon: <Eye className="h-6 w-6" />,
    },
    {
      title: "Revenue Recovery Analytics",
      description: "Track and recover lost revenue with precision. Get detailed analytics on where revenue is lost and how to recover it with 78% success rate.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "Opportunity Scoring",
      description: "AI-powered scoring system that ranks revenue opportunities by potential value, probability of conversion, and urgency of intervention required.",
      icon: <Calculator className="h-6 w-6" />,
    },
    {
      title: "Revenue Attribution",
      description: "Complete revenue attribution across all touchpoints and channels to understand the true ROI of every marketing activity and customer interaction.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Real-time Revenue Alerts",
      description: "Instant alerts when high-value prospects show exit intent or when revenue opportunities require immediate attention from your sales team.",
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    {
      title: "African Market Intelligence",
      description: "Specialized revenue intelligence for African markets including payment behavior patterns, industry benchmarks, and regional revenue optimization.",
      icon: <DollarSign className="h-6 w-6" />,
    },
  ];

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  return (
    <>
      {/* Hero Section with 3D Revenue Funnel */}
      <section className="relative pt-24 pb-24 bg-slate-950 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                  Revenue Intelligence
                </h1>
              </div>
              <p className="text-lg text-slate-300 max-w-lg">
                Stop losing 23% of your revenue. Detect hidden opportunities, recover lost revenue, and optimize every customer interaction for maximum value.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#" className="px-6 py-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg text-sm font-semibold text-white shadow-lg hover:brightness-110 transition">
                  Start Free Trial
                </a>
                <a href="#" className="px-6 py-3 border border-slate-600 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition backdrop-blur">
                  See Demo
                </a>
              </div>
            </div>
            {/* 3D Revenue Funnel (hero version) */}
            <div className="relative h-[360px] w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col items-center justify-center gap-4">
              {/* Hidden Revenue */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-28 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-full flex items-center justify-center opacity-60"
              >
                <span className="text-[10px] text-white font-bold">Hidden</span>
              </motion.div>
              {/* Detection */}
              <motion.div
                animate={{ rotate: [0, 6, -6, 0], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
                className="w-20 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center opacity-70"
              >
                <Eye className="h-3 w-3 text-white" />
              </motion.div>
              {/* Recovered */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.6 }}
                className="w-14 h-6 bg-gradient-to-r from-yellow-500 to-green-500 rounded-b-full flex items-center justify-center opacity-80"
              >
                <span className="text-[10px] text-white font-bold">Recovered</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      <SolutionFeatures
        title="See Every Revenue Opportunity"
        description="Don't let revenue walk away. Our Revenue Intelligence platform identifies, tracks, and recovers the hidden revenue opportunities your competitors can't see."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      {/* 3D Revenue Intelligence Dashboard Section */}
      <section className="relative py-20 bg-slate-950 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(245,158,11,0.05)_50%,transparent_70%)]" />
          
          {/* Animated revenue flow */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full">
              {/* Revenue stream visualizations */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-16 bg-orange-400 opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 90 - 45}deg)`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-white"
          >
            Live Revenue Intelligence Dashboard
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            Watch our AI detect hidden revenue opportunities in real-time, track recovery efforts, 
            and optimize every interaction for maximum revenue capture across African markets.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3D Revenue Flow Visualization */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[500px] relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <DollarSign className="h-5 w-5 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Revenue Intelligence Tracking
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-300">
                        ₦{(totalHiddenRevenue / 1000000).toFixed(1)}M Detected
                      </span>
                    </div>
                  </div>
                  
                  {/* 3D Revenue Funnel Visualization */}
                  <div className="absolute inset-4 bg-gradient-to-br from-orange-900/20 via-red-900/10 to-yellow-900/20 rounded-xl">
                    {/* Revenue Funnel Stages */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {/* Top of funnel - Hidden opportunities */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className="w-32 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-full opacity-60 flex items-center justify-center mb-4"
                      >
                        <span className="text-xs text-white font-bold">Hidden Revenue</span>
                      </motion.div>
                      
                      {/* Middle - Detection */}
                      <motion.div
                        animate={{ 
                          scale: [0.9, 1.2, 0.9],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                        className="w-24 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-70 flex items-center justify-center mb-4"
                      >
                        <Eye className="h-4 w-4 text-white" />
                      </motion.div>
                      
                      {/* Bottom - Recovery */}
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 1
                        }}
                        className="w-16 h-8 bg-gradient-to-r from-yellow-500 to-green-500 rounded-b-full opacity-80 flex items-center justify-center"
                      >
                        <span className="text-xs text-white font-bold">Recovered</span>
                      </motion.div>
                    </div>
                    
                    {/* Revenue opportunity bubbles floating around */}
                    <AnimatePresence>
                      {opportunities.slice(0, 4).map((opportunity, index) => (
                        <motion.div
                          key={opportunity.id}
                          initial={{ scale: 0, opacity: 0, x: -100 }}
                          animate={{ 
                            scale: 1, 
                            opacity: 1, 
                            x: 0,
                            y: [0, -10, 0]
                          }}
                          exit={{ scale: 0, opacity: 0, x: 100 }}
                          transition={{ 
                            duration: 0.8, 
                            delay: index * 0.2,
                            y: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                          }}
                          className="absolute"
                          style={{
                            right: `${10 + (index % 2) * 25}%`,
                            top: `${20 + index * 20}%`,
                          }}
                        >
                          <div className="bg-slate-800/90 border border-slate-600/50 rounded-lg p-2 text-xs text-white min-w-[140px]">
                            <div className="font-semibold text-orange-400">{opportunity.company}</div>
                            <div className="text-slate-300">₦{(opportunity.opportunity / 1000000).toFixed(1)}M</div>
                            <div className={`text-xs font-medium ${
                              opportunity.urgency === 'Critical' ? 'text-red-400' :
                              opportunity.urgency === 'High' ? 'text-orange-400' :
                              opportunity.urgency === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {opportunity.urgency} Priority
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Recovery success indicators */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-slate-800/70 rounded-lg p-3">
                        <div className="text-xs text-slate-300 mb-2">Revenue Recovery Status</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-orange-400 font-bold">₦{(totalHiddenRevenue / 1000000).toFixed(1)}M</div>
                            <div className="text-slate-400">Detected</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold">78%</div>
                            <div className="text-slate-400">Recovery Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-bold">₦{(recoveredRevenue / 1000000).toFixed(1)}M</div>
                            <div className="text-slate-400">Recovered</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Revenue Opportunities Feed */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    Revenue Opportunities
                  </h4>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <AnimatePresence>
                      {opportunities.map((opportunity, index) => (
                        <motion.div
                          key={opportunity.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              opportunity.urgency === 'Critical' ? 'bg-red-400' :
                              opportunity.urgency === 'High' ? 'bg-orange-400' :
                              opportunity.urgency === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                            } animate-pulse`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {opportunity.company}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 flex-shrink-0">
                                  {opportunity.source}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-400 mb-2">
                                {opportunity.status} • {opportunity.signals}
                              </div>
                              
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-lg font-bold text-orange-400">
                                  ₦{(opportunity.opportunity / 1000000).toFixed(1)}M
                                </span>
                                <span className={`text-xs font-bold ${
                                  opportunity.probability > 80 ? 'text-green-400' :
                                  opportunity.probability > 60 ? 'text-yellow-400' : 'text-orange-400'
                                }`}>
                                  {opportunity.probability}% likely
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">
                                  Close in {opportunity.timeToClose} days
                                </span>
                                <span className={`text-xs font-medium ${
                                  opportunity.urgency === 'Critical' ? 'text-red-400' :
                                  opportunity.urgency === 'High' ? 'text-orange-400' :
                                  opportunity.urgency === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {opportunity.urgency}
                                </span>
                              </div>
                              
                              <div className="text-xs text-blue-400 font-medium">
                                Action: {opportunity.recovery}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Revenue Intelligence Summary */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                    Intelligence Summary
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { 
                        label: "Hidden Revenue Detected", 
                        value: `₦${(totalHiddenRevenue / 1000000).toFixed(1)}M`, 
                        icon: Eye, 
                        color: "text-orange-400", 
                        bg: "bg-orange-500/20",
                        change: "Last 30 days"
                      },
                      { 
                        label: "Recovery Success Rate", 
                        value: "78%", 
                        icon: Target, 
                        color: "text-green-400", 
                        bg: "bg-green-500/20",
                        change: "Above industry avg"
                      },
                      { 
                        label: "Total Recovered", 
                        value: `₦${(recoveredRevenue / 1000000).toFixed(1)}M`, 
                        icon: TrendingUp, 
                        color: "text-blue-400", 
                        bg: "bg-blue-500/20",
                        change: "Last 6 months"
                      },
                      { 
                        label: "Alert Response Time", 
                        value: "< 5min", 
                        icon: Zap, 
                        color: "text-purple-400", 
                        bg: "bg-purple-500/20",
                        change: "Real-time alerts"
                      },
                    ].map((metric, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`p-2 ${metric.bg} rounded-lg`}>
                          <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-400">{metric.label}</div>
                          <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                          <div className="text-xs text-slate-500">{metric.change}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <SolutionCTA
        title="Ready to Recover Your Hidden Revenue?"
        description="Stop watching millions in revenue walk away. Start detecting and recovering hidden opportunities with our AI-powered Revenue Intelligence platform."
        color={primaryColor}
      />
    </>
  );
} 