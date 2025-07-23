"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock,
  CheckCircle2,
  TrendingUp,
  Users,
  Globe,
  Zap,
  Building2,
  Award,
  ArrowRight,
  Mail,
  MessageSquare,
  Phone,
  Workflow,
  Database,
  Cloud,
  Sparkles
} from "lucide-react";

interface SuccessMetric {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

interface EnterpriseFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}

const successMetrics: SuccessMetric[] = [
  { label: "Revenue Growth", value: "312%", change: "+₦2.4B", icon: TrendingUp },
  { label: "Active Users", value: "50K+", change: "Across Africa", icon: Users },
  { label: "Messages Sent", value: "10M+", change: "Monthly", icon: MessageSquare },
  { label: "ROI Average", value: "847%", change: "In 6 months", icon: Award }
];

const enterpriseFeatures: EnterpriseFeature[] = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2, ISO 27001, GDPR compliant",
    badge: "Bank-grade"
  },
  {
    icon: Mail,
    title: "Multi-Channel Reach",
    description: "Email, SMS, WhatsApp unified",
    badge: "All-in-one"
  },
  {
    icon: Workflow,
    title: "Visual Automation",
    description: "Drag-drop workflow builder",
    badge: "No-code"
  },
  {
    icon: Database,
    title: "African Integrations",
    description: "Paystack, Flutterwave, M-Pesa",
    badge: "Local-first"
  }
];

const clientLogos = [
  { name: "Access Bank", sector: "Banking" },
  { name: "Jumia", sector: "E-commerce" },
  { name: "Andela", sector: "Tech" },
  { name: "Kobo360", sector: "Logistics" },
  { name: "Flutterwave", sector: "Fintech" },
  { name: "54gene", sector: "Healthcare" }
];

export function AfricanSuccessSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeMetric, setActiveMetric] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("african-success");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [mounted]);

  // Rotate through metrics
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % successMetrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!mounted) return null;

  const isLight = theme === "light";

  return (
    <section
      id="african-success"
      className={`relative py-24 lg:py-32 overflow-hidden ${
        isLight ? "bg-gray-50" : "bg-slate-900"
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          isLight 
            ? "bg-gradient-to-br from-green-50/50 via-white to-blue-50/50" 
            : "bg-gradient-to-br from-green-950/20 via-slate-900 to-blue-950/20"
        }`} />
        
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23000000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <Badge 
              variant="secondary" 
              className={`mb-4 ${
                isLight 
                  ? "bg-green-100 text-green-700 border-green-200" 
                  : "bg-green-900/50 text-green-300 border-green-800"
              }`}
            >
              <Globe className="h-3 w-3 mr-1" />
              POWERING AFRICAN ENTERPRISE
            </Badge>
            
            <h2 className={`text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Trusted by Africa's Leading Brands
            </h2>
            
            <p className={`text-lg lg:text-xl ${
              isLight ? "text-gray-600" : "text-gray-400"
            }`}>
              Enterprise-grade features delivering exceptional results across the continent
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Left: Success Metrics & Case Study */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              {/* Rotating Success Metrics */}
              <Card className={`p-8 border transition-all duration-300 ${
                isLight 
                  ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-200/50 shadow-lg" 
                  : "bg-gradient-to-br from-green-950/30 to-blue-950/30 border-green-800/50"
              }`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                      Success by Numbers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Real results from real African businesses
                    </p>
                  </div>
                  <Sparkles className={`h-8 w-8 ${isLight ? "text-green-600" : "text-green-400"}`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {successMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    const isActive = index === activeMetric;
                    
                    return (
                      <motion.div
                        key={metric.label}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          isActive
                            ? isLight 
                              ? "border-green-400 bg-white shadow-md scale-105" 
                              : "border-green-600 bg-slate-800/50 scale-105"
                            : isLight 
                              ? "border-gray-200 bg-white/50" 
                              : "border-gray-700 bg-slate-800/30"
                        }`}
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`h-4 w-4 ${
                            isActive 
                              ? isLight ? "text-green-600" : "text-green-400"
                              : "text-muted-foreground"
                          }`} />
                          <span className="text-xs text-muted-foreground">{metric.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${
                          isActive 
                            ? isLight ? "text-green-700" : "text-green-400"
                            : isLight ? "text-gray-900" : "text-gray-100"
                        }`}>
                          {metric.value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {metric.change}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* Featured Case Study */}
              <Card className={`p-6 border ${
                isLight 
                  ? "bg-white border-gray-200 shadow-lg" 
                  : "bg-gray-900/50 border-gray-800 backdrop-blur-sm"
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isLight ? "bg-blue-100" : "bg-blue-900/50"
                  }`}>
                    <Building2 className={`h-6 w-6 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                      Access Bank Nigeria
                    </h4>
                    <p className="text-sm text-muted-foreground">Banking & Financial Services</p>
                  </div>
                </div>
                
                <blockquote className={`italic mb-4 ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  "MarketSage transformed our customer engagement. We achieved 312% revenue growth 
                  in 6 months through intelligent automation and personalized campaigns."
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Adebayo Ogunlesi</p>
                    <p className="text-xs text-muted-foreground">Head of Digital Banking</p>
                  </div>
                  <Badge className={`${
                    isLight 
                      ? "bg-green-100 text-green-700" 
                      : "bg-green-900/50 text-green-300"
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    312% Growth
                  </Badge>
                </div>
              </Card>
            </motion.div>

            {/* Right: Enterprise Features */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <h3 className={`text-xl font-semibold mb-4 ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                Enterprise-Grade Platform
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Card className={`p-5 h-full border transition-all duration-300 hover:scale-[1.02] ${
                        isLight 
                          ? "bg-white border-gray-200 hover:shadow-lg" 
                          : "bg-gray-900/50 border-gray-800 hover:bg-gray-900/70"
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isLight ? "bg-gray-100" : "bg-gray-800"
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              isLight ? "text-gray-700" : "text-gray-300"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium text-sm ${
                                isLight ? "text-gray-900" : "text-gray-100"
                              }`}>
                                {feature.title}
                              </h4>
                              {feature.badge && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    isLight 
                                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                                      : "bg-blue-900/50 text-blue-300 border-blue-800"
                                  }`}
                                >
                                  {feature.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Security Certifications */}
              <Card className={`p-6 border ${
                isLight 
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50" 
                  : "bg-gradient-to-r from-blue-950/30 to-purple-950/30 border-blue-800/50"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-semibold ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                    Security & Compliance
                  </h4>
                  <Lock className={`h-5 w-5 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {["SOC 2", "ISO 27001", "GDPR"].map((cert) => (
                    <div 
                      key={cert}
                      className={`text-center p-3 rounded-lg ${
                        isLight ? "bg-white/80" : "bg-slate-800/50"
                      }`}
                    >
                      <CheckCircle2 className={`h-5 w-5 mx-auto mb-1 ${
                        isLight ? "text-green-600" : "text-green-400"
                      }`} />
                      <span className="text-xs font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Client Logos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className={`p-8 rounded-2xl ${
              isLight 
                ? "bg-white border border-gray-200" 
                : "bg-gray-900/50 border border-gray-800"
            }`}
          >
            <p className="text-sm text-center text-muted-foreground mb-6">
              Trusted by leading African enterprises
            </p>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
              {clientLogos.map((client, index) => (
                <motion.div
                  key={client.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="text-center"
                >
                  <div className={`h-16 w-16 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                    isLight ? "bg-gray-100" : "bg-gray-800"
                  }`}>
                    <Building2 className={`h-8 w-8 ${
                      isLight ? "text-gray-400" : "text-gray-600"
                    }`} />
                  </div>
                  <p className="text-xs font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.sector}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}