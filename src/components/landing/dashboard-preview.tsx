"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  Activity, 
  Brain, 
  Eye, 
  Globe, 
  TrendingUp,
  Users,
  Zap,
  MessageSquare,
  Mail,
  Smartphone,
  Bot,
  AlertCircle,
  CheckCircle,
  Timer,
  Target,
  Workflow,
  GitBranch,
  Play,
  Pause,
  ChevronRight,
  BarChart3,
  LineChart,
  Map,
  MousePointer,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DashboardPreview() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeVisitor, setActiveVisitor] = useState(0);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [aiDecision, setAiDecision] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate data
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisitor((prev) => (prev + 1) % 5);
      setWorkflowStep((prev) => (prev + 1) % 4);
      setAiDecision((prev) => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null;
  }

  const isLight = theme === "light";

  // Sample visitor data
  const visitors = [
    { id: 1, location: "Lagos, Nigeria", device: "iPhone 14", score: 92, value: "₦125,000", status: "hot" },
    { id: 2, location: "Nairobi, Kenya", device: "Samsung S23", score: 78, value: "₦85,000", status: "warm" },
    { id: 3, location: "Accra, Ghana", device: "Desktop Chrome", score: 65, value: "₦45,000", status: "cold" },
    { id: 4, location: "Cairo, Egypt", device: "iPad Pro", score: 88, value: "₦110,000", status: "hot" },
    { id: 5, location: "Cape Town, SA", device: "Android", score: 71, value: "₦62,000", status: "warm" },
  ];

  // Workflow steps
  const workflowSteps = [
    { id: "trigger", label: "Visitor Score > 80", icon: Target, status: workflowStep >= 0 ? "active" : "idle" },
    { id: "condition", label: "Check Engagement", icon: GitBranch, status: workflowStep >= 1 ? "active" : "idle" },
    { id: "action1", label: "Send WhatsApp", icon: MessageSquare, status: workflowStep >= 2 ? "active" : "idle" },
    { id: "action2", label: "Trigger Email", icon: Mail, status: workflowStep >= 3 ? "active" : "idle" },
  ];

  // AI decisions
  const aiDecisions = [
    { action: "Send VIP offer to high-value visitor", confidence: 92, impact: "+45% conversion", risk: "low" },
    { action: "Switch channel to WhatsApp", confidence: 87, impact: "3x response rate", risk: "low" },
    { action: "Pause underperforming campaign", confidence: 95, impact: "Save ₦500K", risk: "medium" },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="max-w-7xl mx-auto"
      >

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Connection Lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Lines will be drawn here */}
            <motion.path
              d="M 380 200 Q 640 200 900 200"
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </svg>

          {/* LeadPulse Dashboard - SEEING */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10"
          >
            <Card className={`h-full border transition-all duration-500 hover:scale-[1.02] relative overflow-hidden noise-texture ${isLight ? "border-blue-200/30 bg-gradient-to-br from-white/95 via-white/90 to-blue-50/20 shadow-xl shadow-blue-100/30" : "border-blue-500/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/20"} backdrop-blur-xl`}>
              <CardHeader className="pb-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg font-semibold tracking-tight">LeadPulse Intelligence</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                    SEEING
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground font-medium">234 visitors online</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-6">
                {/* Visitor List */}
                <div className="space-y-2">
                  {visitors.slice(0, 3).map((visitor, index) => (
                    <motion.div
                      key={visitor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.5 + index * 0.15,
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        activeVisitor === index 
                          ? isLight ? "border-blue-400/50 bg-blue-50/50 shadow-sm" : "border-blue-500/50 bg-blue-950/30"
                          : isLight ? "border-gray-200/50 bg-white/50" : "border-gray-800/50 bg-gray-900/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Globe className="h-8 w-8 text-gray-400" />
                            <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
                              visitor.status === "hot" ? "bg-red-500" : 
                              visitor.status === "warm" ? "bg-yellow-500" : "bg-gray-400"
                            } ${visitor.status === "hot" ? "animate-pulse" : ""}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{visitor.location}</p>
                            <p className="text-xs text-muted-foreground font-light">{visitor.device}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className={`text-base font-bold ${isLight ? "text-[hsl(var(--premium-green))]" : "text-green-500"}`}>{visitor.score}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">{visitor.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mini Heatmap */}
                <div className={`p-3 rounded-lg border transition-all duration-200 ${isLight ? "border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/30" : "border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Live Heatmap</span>
                    <MousePointer className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-10 gap-0.5">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-sm ${
                          Math.random() > 0.7 ? "bg-red-500" :
                          Math.random() > 0.4 ? "bg-yellow-500" :
                          Math.random() > 0.2 ? "bg-green-500" : "bg-gray-300"
                        }`}
                        style={{ opacity: 0.3 + Math.random() * 0.7 }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Supreme-AI Dashboard - THINKING */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative z-10"
          >
            <Card className={`h-full border transition-all duration-500 hover:scale-[1.02] relative overflow-hidden noise-texture ${isLight ? "border-purple-200/30 bg-gradient-to-br from-white/95 via-white/90 to-purple-50/20 shadow-xl shadow-purple-100/30" : "border-purple-500/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-purple-950/20"} backdrop-blur-xl`}>
              <CardHeader className="pb-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg font-semibold tracking-tight">Supreme-AI Decisions</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                    THINKING
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Zap className={`h-3 w-3 ${isLight ? "text-yellow-600" : "text-yellow-500"} animate-pulse`} />
                    <span className="text-sm text-muted-foreground font-medium">847 decisions/min</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-6">
                {/* AI Decisions */}
                <div className="space-y-3">
                  {aiDecisions.map((decision, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        delay: 0.7 + index * 0.15,
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        aiDecision === index 
                          ? isLight ? "border-purple-400/50 bg-purple-50/50 shadow-sm" : "border-purple-500/50 bg-purple-950/30"
                          : isLight ? "border-gray-200/50 bg-white/50" : "border-gray-800/50 bg-gray-900/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Bot className="h-4 w-4 text-purple-500 mt-0.5" />
                        <Badge 
                          variant={decision.risk === "low" ? "default" : "secondary"}
                          className={decision.risk === "low" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}
                        >
                          {decision.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{decision.action}</p>
                      <div className="flex items-center justify-between">
                        <Progress value={decision.confidence} className={`h-1.5 flex-1 mr-3 ${isLight ? "bg-gray-200" : "bg-gray-700"}`} />
                        <span className="text-xs text-green-600 font-medium">{decision.impact}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Neural Network Mini Visual */}
                <div className={`p-3 rounded-lg border transition-all duration-200 ${isLight ? "border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/30" : "border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Neural Activity</span>
                    <Activity className="h-3 w-3 text-muted-foreground animate-pulse" />
                  </div>
                  <div className="flex items-center justify-center gap-2 h-12">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-full w-1 rounded-full ${isLight ? "bg-gradient-to-t from-purple-600 to-purple-400" : "bg-gradient-to-t from-purple-500 to-purple-300"}`}
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          animation: `pulse ${1 + i * 0.2}s ease-in-out infinite`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Workflow Dashboard - ACTING */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="relative z-10"
          >
            <Card className={`h-full border transition-all duration-500 hover:scale-[1.02] relative overflow-hidden noise-texture ${isLight ? "border-orange-200/30 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/20 shadow-xl shadow-orange-100/30" : "border-orange-500/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-orange-950/20"} backdrop-blur-xl`}>
              <CardHeader className="pb-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg font-semibold tracking-tight">Workflow Automation</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                    ACTING
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Play className={`h-3 w-3 ${isLight ? "text-green-600" : "text-green-500"}`} />
                    <span className="text-sm text-muted-foreground font-medium">12 workflows active</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-6">
                {/* Workflow Steps */}
                <div className="space-y-2">
                  {workflowSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.9 + index * 0.15,
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className="relative"
                    >
                      {index < workflowSteps.length - 1 && (
                        <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                          step.status === "active" ? "bg-green-500" : "bg-gray-300"
                        }`} />
                      )}
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        step.status === "active" 
                          ? isLight ? "border-green-400/50 bg-green-50/50 shadow-sm" : "border-green-500/50 bg-green-950/30"
                          : isLight ? "border-gray-200/50 bg-white/50" : "border-gray-800/50 bg-gray-900/30"
                      }`}>
                        <div className={`p-2 rounded-full ${
                          step.status === "active" 
                            ? "bg-green-500 text-white" 
                            : isLight ? "bg-gray-200 text-gray-500" : "bg-gray-700 text-gray-400"
                        }`}>
                          <step.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.label}</p>
                        </div>
                        {step.status === "active" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Channel Stats */}
                <div className={`grid grid-cols-3 gap-2 p-3 rounded-lg border transition-all duration-200 ${isLight ? "border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/30" : "border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30"}`}>
                  <div className="text-center">
                    <Mail className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-medium">Email</p>
                    <p className="text-sm font-bold">32.4%</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-xs font-medium">WhatsApp</p>
                    <p className="text-sm font-bold">89.3%</p>
                  </div>
                  <div className="text-center">
                    <Smartphone className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <p className="text-xs font-medium">SMS</p>
                    <p className="text-sm font-bold">98.7%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}