"use client";

import { Eye, Radar, Activity, Users, MapPin, Brain, Target, BarChart3, Sparkles } from "lucide-react";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Generate realistic visitor data
const generateVisitorData = () => ({
  id: Math.random().toString(36).substr(2, 9),
  location: ["Lagos, Nigeria", "Nairobi, Kenya", "Cape Town, SA", "Accra, Ghana", "Kigali, Rwanda", "Abuja, Nigeria", "Dar es Salaam, TZ"][Math.floor(Math.random() * 7)],
  behavior: ["Viewing pricing page", "Reading case study", "Downloading whitepaper", "Browsing features", "Contact form started", "Demo request", "Feature comparison"][Math.floor(Math.random() * 7)],
  score: Math.floor(Math.random() * 100),
  timeOnSite: Math.floor(Math.random() * 300) + 30,
  prediction: ["Convert within 24h", "High intent prospect", "Research phase", "Needs nurturing"][Math.floor(Math.random() * 4)],
  industry: ["Banking", "Fintech", "E-commerce", "Telecom", "Insurance", "Healthcare", "Government"][Math.floor(Math.random() * 7)],
  coordinates: {
    x: Math.random() * 100,
    y: Math.random() * 100
  }
});

export default function LeadPulseIntelligencePage() {
  // Define primary color for this solution
  const primaryColor = "#3B82F6"; // Blue
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const solutionType = "leadpulse-intelligence";
  
  const [visitors, setVisitors] = useState<any[]>([]);
  const [liveCount, setLiveCount] = useState(247);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with visitor data
    setVisitors(Array.from({ length: 6 }, generateVisitorData));

    // Simulate live updates
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 3) - 1);
      
      if (Math.random() > 0.6) {
        setVisitors(prev => [generateVisitorData(), ...prev.slice(0, 5)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Define features for this solution
  const features = [
    {
      title: "Anonymous Visitor Tracking",
      description: "See every visitor before they convert. Track anonymous users across your entire customer journey with 99.9% accuracy and real-time behavioral monitoring.",
      icon: <Eye className="h-6 w-6" />,
    },
    {
      title: "Real-time Behavioral Scoring",
      description: "AI-powered scoring system that rates visitor intent in real-time based on 200+ behavioral signals including page views, time on site, and interaction patterns.",
      icon: <Activity className="h-6 w-6" />,
    },
    {
      title: "Journey Visualization",
      description: "See the complete customer journey from first visit to conversion with interactive heatmaps, flow analysis, and touchpoint mapping.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Geographic Intelligence",
      description: "Real-time visitor location tracking with African market insights, including city-level data and regional behavior patterns.",
      icon: <MapPin className="h-6 w-6" />,
    },
    {
      title: "Behavioral Pattern Recognition",
      description: "Advanced AI analyzes visitor behavior patterns to identify high-intent prospects and predict conversion likelihood with 78% accuracy.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "Industry Classification",
      description: "Automatically classify visitors by industry (Banking, Fintech, Telecom, etc.) to enable targeted marketing and personalized experiences.",
      icon: <Target className="h-6 w-6" />,
    },
  ];

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  return (
    <>
      {/* Live Intelligence Demo Section - Now Hero */}
      <section className="relative pt-24 pb-20 bg-slate-950 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(59,130,246,0.05)_50%,transparent_70%)]" />
          
          {/* Animated grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(rgba(59,130,246,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
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
            Live Visitor Intelligence in Action
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            Watch as LeadPulse Intelligence tracks real anonymous visitors across African markets, 
            scores their behavior, and predicts conversion probability in real-time.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3D Visitor Map Visualization */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[500px] relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Radar className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Real-time Visitor Tracking
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-300">
                        {liveCount} Active Visitors
                      </span>
                    </div>
                  </div>
                  
                  {/* 3D Map Background */}
                  <div className="absolute inset-4 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-green-900/20 rounded-xl">
                    {/* Africa continent outline (simplified) */}
                    <svg className="w-full h-full opacity-30" viewBox="0 0 400 300">
                      <path
                        d="M180 50 L220 60 L250 80 L270 120 L260 160 L240 200 L200 220 L160 210 L140 180 L130 140 L150 100 L180 50"
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </svg>
                    
                    {/* Animated visitor dots */}
                    <AnimatePresence>
                      {visitors.map((visitor, index) => (
                        <motion.div
                          key={visitor.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="absolute"
                          style={{
                            left: `${visitor.coordinates.x}%`,
                            top: `${visitor.coordinates.y}%`,
                          }}
                        >
                          {/* Pulsing dot */}
                          <div className="relative">
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                visitor.score > 80 ? 'bg-green-400' :
                                visitor.score > 60 ? 'bg-yellow-400' : 'bg-blue-400'
                              }`}
                            />
                            <div 
                              className={`absolute inset-0 rounded-full animate-ping ${
                                visitor.score > 80 ? 'bg-green-400' :
                                visitor.score > 60 ? 'bg-yellow-400' : 'bg-blue-400'
                              } opacity-75`}
                            />
                            
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
                              <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-white whitespace-nowrap">
                                <div className="font-semibold">{visitor.location}</div>
                                <div className="text-slate-300">{visitor.behavior}</div>
                                <div className={`font-bold ${
                                  visitor.score > 80 ? 'text-green-400' :
                                  visitor.score > 60 ? 'text-yellow-400' : 'text-blue-400'
                                }`}>
                                  Score: {visitor.score}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Connection lines between visitors */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {visitors.slice(0, 3).map((visitor, index) => (
                        <motion.line
                          key={`line-${visitor.id}`}
                          x1={`${visitor.coordinates.x}%`}
                          y1={`${visitor.coordinates.y}%`}
                          x2={`${visitors[(index + 1) % visitors.length]?.coordinates.x || 50}%`}
                          y2={`${visitors[(index + 1) % visitors.length]?.coordinates.y || 50}%`}
                          stroke="rgba(59, 130, 246, 0.3)"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Real-time Activity Feed */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Live Activity Feed
                  </h4>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <AnimatePresence>
                      {visitors.map((visitor, index) => (
                        <motion.div
                          key={visitor.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              visitor.score > 80 ? 'bg-green-400' :
                              visitor.score > 60 ? 'bg-yellow-400' : 'bg-blue-400'
                            } animate-pulse`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {visitor.location}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex-shrink-0">
                                  {visitor.industry}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-400 mb-2">
                                {visitor.behavior}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold ${
                                  visitor.score > 80 ? 'text-green-400' :
                                  visitor.score > 60 ? 'text-yellow-400' : 'text-blue-400'
                                }`}>
                                  {visitor.score}% likely
                                </span>
                                <span className="text-xs text-slate-500">
                                  {Math.floor(visitor.timeOnSite / 60)}m {visitor.timeOnSite % 60}s
                                </span>
                              </div>
                              
                              <div className={`text-xs mt-1 font-medium ${
                                visitor.score > 80 ? 'text-green-400' :
                                visitor.score > 60 ? 'text-yellow-400' : 'text-blue-400'
                              }`}>
                                {visitor.prediction}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Intelligence Metrics */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Intelligence Metrics
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { label: "Prediction Accuracy", value: "78%", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/20" },
                      { label: "African Coverage", value: "8 Countries", icon: MapPin, color: "text-green-400", bg: "bg-green-500/20" },
                      { label: "Behavioral Signals", value: "200+", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/20" },
                      { label: "Enterprise Clients", value: "50+", icon: Users, color: "text-orange-400", bg: "bg-orange-500/20" },
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
      
      <SolutionFeatures
        title="See the Invisible 23% of Your Traffic"
        description="Stop flying blind. LeadPulse Intelligence reveals anonymous visitors, tracks their behavior, and scores their conversion potential in real-time."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      <SolutionCTA
        title="Ready to See Your Invisible Visitors?"
        description="Stop losing 23% of your revenue to anonymous visitors. Start tracking, scoring, and converting every prospect with LeadPulse Intelligence."
        color={primaryColor}
      />
    </>
  );
} 