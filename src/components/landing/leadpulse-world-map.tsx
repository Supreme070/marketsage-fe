"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorldMapGlobe } from "./world-map-globe";
import { 
  Globe2, 
  Users, 
  TrendingUp, 
  Zap, 
  Eye,
  Target,
  Activity,
  MapPin,
  Signal,
  UserCheck,
  DollarSign,
  Timer
} from "lucide-react";

interface Visitor {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  score: number;
  value: string;
  status: "hot" | "warm" | "cold";
  device: string;
  timeOnSite: string;
  isIdentified: boolean;
  behavior: string;
}

export function LeadPulseWorldMap() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeVisitor, setActiveVisitor] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState(234);
  const [revenueOpportunity, setRevenueOpportunity] = useState(2500000);

  // African-focused visitor data
  const [visitors] = useState<Visitor[]>([
    // Nigeria
    { id: "ng-1", lat: 6.5244, lng: 3.3792, city: "Lagos", country: "Nigeria", score: 92, value: "₦450,000", status: "hot", device: "iPhone 14 Pro", timeOnSite: "12:34", isIdentified: false, behavior: "Viewing pricing page" },
    { id: "ng-2", lat: 9.0579, lng: 7.4951, city: "Abuja", country: "Nigeria", score: 78, value: "₦320,000", status: "warm", device: "Desktop Chrome", timeOnSite: "08:12", isIdentified: true, behavior: "Downloaded whitepaper" },
    { id: "ng-3", lat: 7.3775, lng: 3.9470, city: "Ibadan", country: "Nigeria", score: 85, value: "₦280,000", status: "hot", device: "Samsung S23", timeOnSite: "15:45", isIdentified: false, behavior: "Comparing features" },
    
    // Kenya
    { id: "ke-1", lat: -1.2921, lng: 36.8219, city: "Nairobi", country: "Kenya", score: 88, value: "₦380,000", status: "hot", device: "iPad Pro", timeOnSite: "10:23", isIdentified: true, behavior: "Scheduling demo" },
    { id: "ke-2", lat: -4.0435, lng: 39.6682, city: "Mombasa", country: "Kenya", score: 72, value: "₦250,000", status: "warm", device: "Android", timeOnSite: "06:45", isIdentified: false, behavior: "Reading case studies" },
    
    // South Africa
    { id: "za-1", lat: -26.2041, lng: 28.0473, city: "Johannesburg", country: "South Africa", score: 90, value: "₦520,000", status: "hot", device: "MacBook Pro", timeOnSite: "18:20", isIdentified: true, behavior: "In checkout process" },
    { id: "za-2", lat: -33.9249, lng: 18.4241, city: "Cape Town", country: "South Africa", score: 75, value: "₦300,000", status: "warm", device: "Windows Laptop", timeOnSite: "09:15", isIdentified: false, behavior: "Exploring integrations" },
    
    // Egypt
    { id: "eg-1", lat: 30.0444, lng: 31.2357, city: "Cairo", country: "Egypt", score: 82, value: "₦340,000", status: "warm", device: "iPhone 13", timeOnSite: "11:30", isIdentified: true, behavior: "Watching product demo" },
    
    // Ghana
    { id: "gh-1", lat: 5.6037, lng: -0.1870, city: "Accra", country: "Ghana", score: 79, value: "₦290,000", status: "warm", device: "Desktop Firefox", timeOnSite: "07:50", isIdentified: false, behavior: "Comparing pricing tiers" },
    
    // Other markets
    { id: "uk-1", lat: 51.5074, lng: -0.1278, city: "London", country: "UK", score: 65, value: "₦180,000", status: "cold", device: "iPhone 12", timeOnSite: "03:20", isIdentified: false, behavior: "First-time visitor" },
    { id: "us-1", lat: 40.7128, lng: -74.0060, city: "New York", country: "USA", score: 70, value: "₦220,000", status: "warm", device: "Chrome Desktop", timeOnSite: "05:15", isIdentified: false, behavior: "Reading blog posts" },
    { id: "ae-1", lat: 25.2048, lng: 55.2708, city: "Dubai", country: "UAE", score: 76, value: "₦310,000", status: "warm", device: "Samsung Galaxy", timeOnSite: "09:30", isIdentified: true, behavior: "Viewing customer stories" },
  ]);

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

    const section = document.getElementById("leadpulse-world-map");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [mounted]);

  // Animate counters
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setVisitorCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(200, Math.min(300, prev + change));
      });
      setRevenueOpportunity(prev => {
        const change = Math.floor(Math.random() * 100000) - 50000;
        return Math.max(2000000, Math.min(3000000, prev + change));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!mounted) {
    return null;
  }

  const isLight = theme === "light";
  const hotVisitors = visitors.filter(v => v.status === "hot").slice(0, 4);

  return (
    <section
      id="leadpulse-world-map"
      className={`relative py-24 lg:py-32 overflow-hidden ${
        isLight ? "bg-white" : "bg-slate-950"
      }`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          isLight 
            ? "bg-gradient-to-br from-blue-50/30 via-white to-green-50/20" 
            : "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30"
        }`} />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <Badge 
              variant="secondary" 
              className={`mb-4 ${
                isLight 
                  ? "bg-blue-100 text-blue-700 border-blue-200" 
                  : "bg-blue-900/50 text-blue-300 border-blue-800"
              }`}
            >
              <Eye className="h-3 w-3 mr-1" />
              LEADPULSE INTELLIGENCE
            </Badge>
            
            <h2 className={`text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              See Your Invisible Revenue
            </h2>
            
            <p className={`text-lg lg:text-xl ${
              isLight ? "text-gray-600" : "text-gray-400"
            }`}>
              Real-time visitor intelligence across African markets
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Panel - Stats and Visitors */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              {/* Live Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className={`p-6 border transition-all duration-300 hover:scale-[1.02] ${
                  isLight 
                    ? "bg-white/80 border-gray-200 shadow-lg hover:shadow-xl" 
                    : "bg-gray-900/50 border-gray-800 backdrop-blur-sm"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <Users className={`h-5 w-5 ${isLight ? "text-blue-600" : "text-blue-400"}`} />
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                  </div>
                  <motion.p 
                    className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-gray-100"}`}
                    key={visitorCount}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {visitorCount}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Visitors online</p>
                </Card>

                <Card className={`p-6 border transition-all duration-300 hover:scale-[1.02] ${
                  isLight 
                    ? "bg-white/80 border-gray-200 shadow-lg hover:shadow-xl" 
                    : "bg-gray-900/50 border-gray-800 backdrop-blur-sm"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className={`h-5 w-5 ${isLight ? "text-green-600" : "text-green-400"}`} />
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <motion.p 
                    className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-gray-100"}`}
                    key={revenueOpportunity}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    ₦{(revenueOpportunity / 1000000).toFixed(1)}M
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Revenue opportunities</p>
                </Card>
              </div>

              {/* Conversion Flow */}
              <Card className={`p-6 border ${
                isLight 
                  ? "bg-gradient-to-br from-blue-50/50 to-green-50/30 border-blue-200/50" 
                  : "bg-gradient-to-br from-blue-950/20 to-green-950/20 border-blue-800/50"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                  Visitor Journey Flow
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isLight ? "bg-gray-200" : "bg-gray-800"}`}>
                      <Eye className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Anonymous Visitors</span>
                        <span className="text-sm text-muted-foreground">{visitorCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isLight ? "bg-yellow-100" : "bg-yellow-900/50"}`}>
                      <Target className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Engaged (Score > 70)</span>
                        <span className="text-sm text-muted-foreground">89</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="bg-yellow-500 h-1.5 rounded-full" 
                          initial={{ width: "0%" }}
                          animate={{ width: "38%" }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isLight ? "bg-green-100" : "bg-green-900/50"}`}>
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Identified Leads</span>
                        <span className="text-sm text-muted-foreground">34</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          initial={{ width: "0%" }}
                          animate={{ width: "14.5%" }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Hot Visitors List */}
              <Card className={`p-6 border ${
                isLight 
                  ? "bg-white/80 border-gray-200 shadow-lg" 
                  : "bg-gray-900/50 border-gray-800 backdrop-blur-sm"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                    High-Value Visitors
                  </h3>
                  <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {hotVisitors.map((visitor, index) => (
                      <motion.div
                        key={visitor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeVisitor === visitor.id
                            ? isLight 
                              ? "border-green-400 bg-green-50 shadow-md" 
                              : "border-green-600 bg-green-950/30"
                            : isLight 
                              ? "border-gray-200 hover:border-gray-300 hover:shadow-sm" 
                              : "border-gray-700 hover:border-gray-600"
                        }`}
                        onMouseEnter={() => setActiveVisitor(visitor.id)}
                        onMouseLeave={() => setActiveVisitor(null)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {visitor.city}, {visitor.country}
                              </span>
                              {visitor.isIdentified && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    isLight 
                                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                                      : "bg-blue-900/50 text-blue-300 border-blue-800"
                                  }`}
                                >
                                  Identified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Signal className="h-3 w-3" />
                                Score: {visitor.score}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {visitor.timeOnSite}
                              </span>
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">
                              {visitor.behavior}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              isLight ? "text-green-700" : "text-green-400"
                            }`}>
                              {visitor.value}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {visitor.device}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>

            {/* Right Panel - World Map */}
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Card className={`relative h-[600px] border overflow-hidden ${
                isLight 
                  ? "bg-gradient-to-br from-gray-50 to-blue-50/30 border-gray-200 shadow-2xl" 
                  : "bg-gradient-to-br from-slate-900 to-blue-950/20 border-gray-800"
              }`}>
                {/* Map Container */}
                <div className="absolute inset-0 p-4">
                  <WorldMapGlobe 
                    markers={visitors.map(v => ({
                      id: v.id,
                      lat: v.lat,
                      lng: v.lng,
                      status: v.status,
                      pulseDelay: Math.random() * 2
                    }))}
                    onMarkerHover={setActiveVisitor}
                    activeMarkerId={activeVisitor}
                  />
                </div>

                {/* Overlay Elements */}
                <div className="absolute top-4 left-4 z-10">
                  <Badge className={`${
                    isLight 
                      ? "bg-white/90 text-gray-700 border-gray-200" 
                      : "bg-gray-900/90 text-gray-300 border-gray-700"
                  } backdrop-blur-sm`}>
                    <Globe2 className="h-3 w-3 mr-1" />
                    Real-time Global View
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className={`p-4 rounded-lg backdrop-blur-md ${
                    isLight 
                      ? "bg-white/80 border border-gray-200" 
                      : "bg-gray-900/80 border border-gray-700"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Market Concentration</span>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-green-500/20 flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full bg-green-500" />
                        </div>
                        <span className="text-muted-foreground">Hot Leads</span>
                      </div>
                      <div className="text-center">
                        <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full bg-yellow-500" />
                        </div>
                        <span className="text-muted-foreground">Warm Leads</span>
                      </div>
                      <div className="text-center">
                        <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full bg-gray-500" />
                        </div>
                        <span className="text-muted-foreground">Cold Traffic</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Card for Active Visitor */}
                <AnimatePresence>
                  {activeVisitor && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-20 right-4 z-20"
                    >
                      <Card className={`p-4 w-64 ${
                        isLight 
                          ? "bg-white border-gray-200 shadow-xl" 
                          : "bg-gray-900 border-gray-700"
                      }`}>
                        {(() => {
                          const visitor = visitors.find(v => v.id === activeVisitor);
                          if (!visitor) return null;
                          
                          return (
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">{visitor.city}</h4>
                                  <p className="text-sm text-muted-foreground">{visitor.country}</p>
                                </div>
                                <Badge 
                                  variant={visitor.status === "hot" ? "default" : "secondary"}
                                  className={
                                    visitor.status === "hot" 
                                      ? "bg-green-500 text-white" 
                                      : visitor.status === "warm"
                                        ? "bg-yellow-500 text-white"
                                        : ""
                                  }
                                >
                                  {visitor.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Score:</span>
                                  <span className="font-medium">{visitor.score}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Value:</span>
                                  <span className="font-medium text-green-600">{visitor.value}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Device:</span>
                                  <span className="font-medium">{visitor.device}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span className="font-medium">{visitor.timeOnSite}</span>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground">Current Activity:</p>
                                <p className="text-sm mt-1">{visitor.behavior}</p>
                              </div>
                            </>
                          );
                        })()}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}