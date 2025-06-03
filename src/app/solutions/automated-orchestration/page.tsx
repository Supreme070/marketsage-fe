"use client";

import { Zap, Settings, Target, Workflow, BarChart3, Clock, Cpu, Network, Globe, MessageSquare, Mail, Smartphone } from "lucide-react";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Generate realistic orchestration data
const generateOrchestrationData = () => ({
  id: Math.random().toString(36).substr(2, 9),
  prospect: `${["Enterprise Bank Lead", "Fintech Prospect", "Insurance Executive", "Telecom Manager", "E-commerce Director", "Government Official"][Math.floor(Math.random() * 6)]}`,
  trigger: ["High-intent behavior", "Pricing page visit", "Case study download", "Demo request", "Competitor research", "Budget timeline"][Math.floor(Math.random() * 6)],
  action: ["WhatsApp + Email", "SMS + Call", "Email sequence", "Multi-channel", "Social + Email", "Direct outreach"][Math.floor(Math.random() * 6)],
  channel: ["WhatsApp", "Email", "SMS", "Multi-channel", "Web Push", "Voice"][Math.floor(Math.random() * 6)],
  status: ["Executing", "Optimizing", "Monitoring", "Adapting"][Math.floor(Math.random() * 4)],
  progress: Math.floor(Math.random() * 100),
  performance: Math.floor(Math.random() * 50) + 50, // 50-100% performance
  nextStep: ["CEO follow-up", "A/B testing", "Behavioral update", "Channel switch", "Timing optimization"][Math.floor(Math.random() * 5)],
  timeRemaining: Math.floor(Math.random() * 12) + 1 // 1-12 hours
});

export default function AutomatedOrchestrationPage() {
  // Define primary color for this solution
  const primaryColor = "#10B981"; // Emerald
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const solutionType = "automated-orchestration";
  
  const [orchestrations, setOrchestrations] = useState<any[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState(89);
  const [decisionsPerMin, setDecisionsPerMin] = useState(347);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with orchestration data
    setOrchestrations(Array.from({ length: 6 }, generateOrchestrationData));

    // Simulate live orchestration updates
    const interval = setInterval(() => {
      setActiveWorkflows(prev => prev + Math.floor(Math.random() * 3) - 1);
      setDecisionsPerMin(prev => prev + Math.floor(Math.random() * 10) - 5);
      
      if (Math.random() > 0.6) {
        setOrchestrations(prev => [generateOrchestrationData(), ...prev.slice(0, 5)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Define features for this solution
  const features = [
    {
      title: "Real-time Decision Engine",
      description: "AI-powered engine that makes instant decisions based on visitor behavior, scoring, and intent signals to trigger the perfect action at the perfect moment.",
      icon: <Cpu className="h-6 w-6" />,
    },
    {
      title: "Multi-channel Optimization",
      description: "Automatically optimize across email, SMS, WhatsApp, and web channels to deliver the right message through the most effective channel for each prospect.",
      icon: <Network className="h-6 w-6" />,
    },
    {
      title: "Behavioral Triggers",
      description: "Set up intelligent triggers based on 200+ behavioral signals that automatically launch personalized campaigns when prospects show high intent.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Dynamic Workflow Adaptation",
      description: "Workflows that automatically adapt and optimize based on real-time performance data and changing customer behavior patterns.",
      icon: <Workflow className="h-6 w-6" />,
    },
    {
      title: "African Market Intelligence",
      description: "Built-in intelligence for African markets including optimal timing, cultural preferences, payment behaviors, and regulatory compliance.",
      icon: <Target className="h-6 w-6" />,
    },
    {
      title: "Performance Analytics",
      description: "Real-time analytics showing orchestration performance, channel effectiveness, conversion rates, and revenue attribution across all touchpoints.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
  ];

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  return (
    <>
      {/* Hero Section with 3D Orchestration Hub */}
      <section className="relative pt-24 pb-24 bg-slate-950 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <Settings className="h-6 w-6 text-emerald-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                  Automated Orchestration
                </h1>
              </div>
              <p className="text-lg text-slate-300 max-w-lg">
                Let AI orchestrate perfect customer experiences. Real-time decisions, multi-channel optimization, and automated workflows that adapt to African markets.
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
            {/* 3D Orchestration Hub (hero version) */}
            <div className="relative h-[360px] w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
              {/* Central Decision Hub */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center opacity-60"
              >
                <Cpu className="h-6 w-6 text-white" />
              </motion.div>
              {/* Channel nodes */}
              {[
                { icon: MessageSquare, angle: 0, color: "bg-green-400" },
                { icon: Mail, angle: 60, color: "bg-blue-400" },
                { icon: Smartphone, angle: 120, color: "bg-purple-400" },
                { icon: Globe, angle: 180, color: "bg-orange-400" },
                { icon: Zap, angle: 240, color: "bg-pink-400" },
                { icon: Target, angle: 300, color: "bg-cyan-400" },
              ].map((channel, idx) => (
                <motion.div
                  key={`hub-node-${idx}`}
                  className={`absolute w-3 h-3 ${channel.color} rounded-full`}
                  style={{
                    left: `${50 + 35 * Math.cos((channel.angle * Math.PI) / 180)}%`,
                    top: `${50 + 35 * Math.sin((channel.angle * Math.PI) / 180)}%`,
                    transform: 'translate(-50%,-50%)'
                  }}
                  animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, delay: idx * 0.3, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <SolutionFeatures
        title="AI That Orchestrates Perfect Customer Journeys"
        description="Stop manual campaign management. Our AI orchestration engine automatically optimizes every customer interaction across channels in real-time."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      {/* 3D Orchestration Engine Demo Section */}
      <section className="relative py-20 bg-slate-950 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(16,185,129,0.05)_50%,transparent_70%)]" />
          
          {/* Animated workflow connections */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full">
              {/* Workflow connection lines */}
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-20 bg-emerald-400 opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
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
            Live Orchestration Engine in Action
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            Watch our AI orchestration engine make real-time decisions, optimize across channels, 
            and automatically adapt workflows for maximum performance across African markets.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3D Orchestration Flow Visualization */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[500px] relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Settings className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Real-time Orchestration
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-300">
                        {decisionsPerMin} Decisions/min
                      </span>
                    </div>
                  </div>
                  
                  {/* 3D Workflow Visualization */}
                  <div className="absolute inset-4 bg-gradient-to-br from-emerald-900/20 via-blue-900/10 to-purple-900/20 rounded-xl">
                    {/* Central Decision Hub */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ 
                          duration: 6, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full opacity-60 flex items-center justify-center"
                      >
                        <Cpu className="h-6 w-6 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Channel nodes around the hub */}
                    {[
                      { icon: MessageSquare, name: "WhatsApp", angle: 0, color: "from-green-400 to-green-600" },
                      { icon: Mail, name: "Email", angle: 60, color: "from-blue-400 to-blue-600" },
                      { icon: Smartphone, name: "SMS", angle: 120, color: "from-purple-400 to-purple-600" },
                      { icon: Globe, name: "Web", angle: 180, color: "from-orange-400 to-orange-600" },
                      { icon: Zap, name: "Push", angle: 240, color: "from-pink-400 to-pink-600" },
                      { icon: Target, name: "Social", angle: 300, color: "from-cyan-400 to-cyan-600" },
                    ].map((channel, index) => (
                      <motion.div
                        key={index}
                        className="absolute"
                        style={{
                          left: `${50 + 35 * Math.cos((channel.angle * Math.PI) / 180)}%`,
                          top: `${50 + 35 * Math.sin((channel.angle * Math.PI) / 180)}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                          scale: [0.8, 1.1, 0.8],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.5,
                        }}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-br ${channel.color} rounded-full flex items-center justify-center shadow-lg`}>
                          <channel.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-white font-medium">
                          {channel.name}
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Data flow lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {Array.from({ length: 6 }).map((_, index) => {
                        const angle = (index * 60) * Math.PI / 180;
                        const startX = 50;
                        const startY = 50;
                        const endX = 50 + 35 * Math.cos(angle);
                        const endY = 50 + 35 * Math.sin(angle);
                        
                        return (
                          <motion.line
                            key={index}
                            x1={`${startX}%`}
                            y1={`${startY}%`}
                            x2={`${endX}%`}
                            y2={`${endY}%`}
                            stroke="rgba(16, 185, 129, 0.4)"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ 
                              duration: 2, 
                              repeat: Number.POSITIVE_INFINITY,
                              delay: index * 0.3
                            }}
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Performance indicators */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-slate-800/70 rounded-lg p-3">
                        <div className="text-xs text-slate-300 mb-2">Orchestration Performance</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-emerald-400 font-bold">{activeWorkflows}</div>
                            <div className="text-slate-400">Active</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-bold">94%</div>
                            <div className="text-slate-400">Efficiency</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-400 font-bold">6.2x</div>
                            <div className="text-slate-400">ROI</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Orchestration Feed */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-emerald-400" />
                    Live Orchestrations
                  </h4>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <AnimatePresence>
                      {orchestrations.map((orchestration, index) => (
                        <motion.div
                          key={orchestration.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              orchestration.status === 'Executing' ? 'bg-emerald-400' :
                              orchestration.status === 'Optimizing' ? 'bg-blue-400' :
                              orchestration.status === 'Adapting' ? 'bg-purple-400' : 'bg-yellow-400'
                            } animate-pulse`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {orchestration.prospect}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                                  {orchestration.channel}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-400 mb-2">
                                Trigger: {orchestration.trigger}
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-300">
                                  {orchestration.action}
                                </span>
                                <span className={`text-xs font-bold ${
                                  orchestration.performance > 80 ? 'text-green-400' :
                                  orchestration.performance > 60 ? 'text-yellow-400' : 'text-blue-400'
                                }`}>
                                  {orchestration.performance}% perf
                                </span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                                <motion.div 
                                  className={`h-1.5 rounded-full ${
                                    orchestration.status === 'Executing' ? 'bg-emerald-400' :
                                    orchestration.status === 'Optimizing' ? 'bg-blue-400' :
                                    orchestration.status === 'Adapting' ? 'bg-purple-400' : 'bg-yellow-400'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${orchestration.progress}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                  Next: {orchestration.nextStep}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {orchestration.timeRemaining}h
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Channel Performance Summary */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    Channel Performance
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { 
                        label: "WhatsApp Success", 
                        value: "92%", 
                        icon: MessageSquare, 
                        color: "text-green-400", 
                        bg: "bg-green-500/20",
                        change: "African preference"
                      },
                      { 
                        label: "Email Open Rate", 
                        value: "78%", 
                        icon: Mail, 
                        color: "text-blue-400", 
                        bg: "bg-blue-500/20",
                        change: "Above industry avg"
                      },
                      { 
                        label: "SMS Delivery", 
                        value: "99.8%", 
                        icon: Smartphone, 
                        color: "text-purple-400", 
                        bg: "bg-purple-500/20",
                        change: "Carrier optimized"
                      },
                      { 
                        label: "Multi-channel ROI", 
                        value: "6.2x", 
                        icon: Network, 
                        color: "text-orange-400", 
                        bg: "bg-orange-500/20",
                        change: "vs single channel"
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
        title="Ready to Automate Perfect Customer Journeys?"
        description="Stop manual workflow management. Let our AI orchestration engine optimize every customer interaction across channels for maximum conversion."
        color={primaryColor}
      />
    </>
  );
} 