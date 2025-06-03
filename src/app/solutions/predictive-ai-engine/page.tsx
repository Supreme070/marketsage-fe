"use client";

import { Brain, Target, TrendingUp, Users, Sparkles, AlertCircle, Zap, DollarSign } from "lucide-react";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Generate realistic prediction data
const generatePredictionData = () => ({
  id: Math.random().toString(36).substr(2, 9),
  prospect: `${["Lagos Bank", "Nairobi Fintech", "Cape Town Insurer", "Accra Telecom", "Kigali Startup", "Abuja Corp", "Dar Tech"][Math.floor(Math.random() * 7)]}`,
  industry: ["Banking", "Fintech", "Insurance", "Telecom", "Healthcare", "E-commerce", "Government"][Math.floor(Math.random() * 7)],
  conversionProb: Math.floor(Math.random() * 100),
  revenueOpportunity: Math.floor(Math.random() * 50000000) + 1000000, // 1M to 50M Naira
  signals: Math.floor(Math.random() * 15) + 5, // 5-20 signals
  timeToConvert: Math.floor(Math.random() * 30) + 1, // 1-30 days
  confidence: Math.floor(Math.random() * 40) + 60, // 60-100% confidence
  actions: ["Email nurture", "WhatsApp follow-up", "Sales call", "Demo booking", "Proposal needed"][Math.floor(Math.random() * 5)],
  riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
  lastActivity: ["Viewed pricing", "Downloaded case study", "Attended webinar", "Requested demo", "Visited competitors"][Math.floor(Math.random() * 5)]
});

export default function PredictiveAIEnginePage() {
  // Define primary color for this solution
  const primaryColor = "#8B5CF6"; // Purple
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const solutionType = "predictive-ai-engine";
  
  const [predictions, setPredictions] = useState<any[]>([]);
  const [totalOpportunity, setTotalOpportunity] = useState(12800000);
  const [mounted, setMounted] = useState(false);
  const [processingCount, setProcessingCount] = useState(1247);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with prediction data
    setPredictions(Array.from({ length: 6 }, generatePredictionData));

    // Simulate live AI processing
    const interval = setInterval(() => {
      setProcessingCount(prev => prev + Math.floor(Math.random() * 5) + 1);
      setTotalOpportunity(prev => prev + Math.floor(Math.random() * 500000));
      
      if (Math.random() > 0.7) {
        setPredictions(prev => [generatePredictionData(), ...prev.slice(0, 5)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Define features for this solution
  const features = [
    {
      title: "Conversion Prediction",
      description: "AI analyzes 200+ behavioral signals to predict conversion probability with 78% accuracy. Know which prospects will convert before they do.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "Revenue Opportunity Detection",
      description: "Automatically identify and quantify revenue opportunities hidden in your traffic. Discover millions in untapped potential revenue.",
      icon: <DollarSign className="h-6 w-6" />,
    },
    {
      title: "Behavioral Pattern Analysis",
      description: "Deep learning algorithms analyze visitor behavior patterns to identify high-intent prospects and predict their next actions.",
      icon: <Target className="h-6 w-6" />,
    },
    {
      title: "Real-time Scoring Engine",
      description: "Get instant prospect scores updated in real-time as visitors interact with your content. Never miss a hot lead again.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Predictive Analytics Dashboard",
      description: "Comprehensive dashboard showing conversion forecasts, revenue predictions, and AI-powered insights for strategic decision making.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "Intent Signal Recognition",
      description: "Advanced AI recognizes buying intent signals across multiple touchpoints including WhatsApp, email, website, and social media.",
      icon: <AlertCircle className="h-6 w-6" />,
    },
  ];

  if (!mounted) {
    return <div className="h-screen bg-slate-950" />;
  }

  return (
    <>
      {/* Hero Section with 3D Neural Network */}
      <section className="relative pt-24 pb-24 bg-slate-950 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                  Predictive AI Engine
                </h1>
              </div>
              <p className="text-lg text-slate-300 max-w-lg">
                See the future of your revenue. AI-powered predictions that identify which prospects will convert, when they'll buy, and how much they're worth.
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
            {/* 3D Neural Network (hero version) */}
            <div className="relative h-[360px] w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
              {/* Central AI node */}
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "linear" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center opacity-60"
              >
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
              {/* Floating data nodes */}
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={`hero-node-${i}`}
                  className="absolute w-2.5 h-2.5 bg-purple-400 rounded-full"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <SolutionFeatures
        title="Predict Revenue Before It Happens"
        description="Stop guessing. Start knowing. Our AI engine analyzes millions of data points to predict conversions with 78% accuracy, helping you focus on prospects that will actually buy."
        features={features}
        color={primaryColor}
        solutionType={solutionType}
      />
      
      {/* 3D AI Prediction Dashboard Section */}
      <section className="relative py-20 bg-slate-950 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(139,92,246,0.05)_50%,transparent_70%)]" />
          
          {/* Animated neural network background */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full">
              {/* Neural network nodes */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
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
            AI Prediction Engine in Action
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            Watch our AI analyze visitor behavior patterns and predict conversions in real-time. 
            See revenue opportunities identified before your competitors even know they exist.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3D AI Processing Visualization */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[500px] relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Brain className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        AI Prediction Processing
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-300">
                        {processingCount} Predictions/min
                      </span>
                    </div>
                  </div>
                  
                  {/* 3D Neural Network Visualization */}
                  <div className="absolute inset-4 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-pink-900/20 rounded-xl">
                    {/* Central AI Brain */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut"
                        }}
                        className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-50 flex items-center justify-center"
                      >
                        <Brain className="h-8 w-8 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Data streams flowing into AI */}
                    {Array.from({ length: 8 }).map((_, index) => (
                      <motion.div
                        key={index}
                        className="absolute"
                        style={{
                          left: `${20 + (index % 4) * 20}%`,
                          top: `${20 + Math.floor(index / 4) * 60}%`,
                        }}
                        animate={{
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.25,
                        }}
                      >
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                      </motion.div>
                    ))}
                    
                    {/* Prediction outputs */}
                    <AnimatePresence>
                      {predictions.slice(0, 4).map((prediction, index) => (
                        <motion.div
                          key={prediction.id}
                          initial={{ scale: 0, opacity: 0, x: 200 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0, opacity: 0, x: -200 }}
                          transition={{ duration: 0.8, delay: index * 0.2 }}
                          className="absolute"
                          style={{
                            right: `${10 + (index % 2) * 20}%`,
                            top: `${20 + (index % 2) * 40}%`,
                          }}
                        >
                          <div className="bg-slate-800/90 border border-slate-600/50 rounded-lg p-2 text-xs text-white min-w-[120px]">
                            <div className="font-semibold text-purple-400">{prediction.prospect}</div>
                            <div className="text-slate-300">{prediction.conversionProb}% likely</div>
                            <div className="text-green-400">₦{(prediction.revenueOpportunity / 1000000).toFixed(1)}M</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Processing indicators */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-slate-800/70 rounded-lg p-3">
                        <div className="text-xs text-slate-300 mb-2">AI Processing Status</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-purple-400 font-bold">200+</div>
                            <div className="text-slate-400">Signals</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-bold">78%</div>
                            <div className="text-slate-400">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-bold">&lt;1s</div>
                            <div className="text-slate-400">Response</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Predictions Feed */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    Live Predictions
                  </h4>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <AnimatePresence>
                      {predictions.map((prediction, index) => (
                        <motion.div
                          key={prediction.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              prediction.conversionProb > 80 ? 'bg-green-400' :
                              prediction.conversionProb > 60 ? 'bg-yellow-400' : 'bg-purple-400'
                            } animate-pulse`} />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {prediction.prospect}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                                  {prediction.industry}
                                </span>
                              </div>
                              
                              <div className="text-xs text-slate-400 mb-2">
                                {prediction.lastActivity} • {prediction.signals} signals
                              </div>
                              
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${
                                  prediction.conversionProb > 80 ? 'text-green-400' :
                                  prediction.conversionProb > 60 ? 'text-yellow-400' : 'text-purple-400'
                                }`}>
                                  {prediction.conversionProb}% likely
                                </span>
                                <span className="text-sm font-bold text-green-400">
                                  ₦{(prediction.revenueOpportunity / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                  {prediction.timeToConvert} days to convert
                                </span>
                                <span className={`text-xs font-medium ${
                                  prediction.confidence > 85 ? 'text-green-400' :
                                  prediction.confidence > 70 ? 'text-yellow-400' : 'text-purple-400'
                                }`}>
                                  {prediction.confidence}% confidence
                                </span>
                              </div>
                              
                              <div className="text-xs mt-1 text-blue-400 font-medium">
                                Recommended: {prediction.actions}
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
                    <DollarSign className="h-5 w-5 text-purple-400" />
                    Revenue Intelligence
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { 
                        label: "Opportunities Identified", 
                        value: `₦${(totalOpportunity / 1000000).toFixed(1)}M`, 
                        icon: Target, 
                        color: "text-green-400", 
                        bg: "bg-green-500/20",
                        change: "+12% today"
                      },
                      { 
                        label: "Prediction Accuracy", 
                        value: "78%", 
                        icon: Brain, 
                        color: "text-purple-400", 
                        bg: "bg-purple-500/20",
                        change: "Industry leading"
                      },
                      { 
                        label: "Active Predictions", 
                        value: `${processingCount}`, 
                        icon: Zap, 
                        color: "text-blue-400", 
                        bg: "bg-blue-500/20",
                        change: "Processing now"
                      },
                      { 
                        label: "Revenue Recovery", 
                        value: "₦47.2M", 
                        icon: TrendingUp, 
                        color: "text-orange-400", 
                        bg: "bg-orange-500/20",
                        change: "Last 6 months"
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
        title="Ready to Predict Your Revenue?"
        description="Stop leaving money on the table. Start predicting which prospects will convert and focus your efforts on opportunities that will actually close."
        color={primaryColor}
      />
    </>
  );
} 