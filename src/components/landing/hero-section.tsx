"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart, PieChart, ArrowUpRight, Users, Zap, ArrowRight } from "lucide-react";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#2DD4BF] py-16 md:py-20">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-10 z-0"
        style={{ 
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "30px 30px" 
        }}
      />

      <div className={`container relative z-10 mx-auto px-4 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex flex-col md:flex-row items-center">
          {/* Left column - Text content */}
          <div className="w-full md:w-1/2 text-left mb-12 md:mb-0 md:pr-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white" 
                style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              Advanced email<br />
              marketing platform at<br />
              fraction of the cost.
            </h1>
            
            <p className="text-lg text-white/90 mb-8" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              All the tools and advanced email marketing features you need, 
              without breaking the bank. Connect with your audience effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row w-full gap-3">
              <Link href="/register" className="w-full sm:w-auto">
                <button className="h-12 w-full px-6 rounded bg-[#FBBF24] text-[#111827] font-bold flex items-center justify-center hover:bg-[#F59E0B] transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                  Get Started Free
                </button>
              </Link>
              <Link href="#pricing" className="w-full sm:w-auto">
                <button className="h-12 w-full px-6 rounded bg-[#1E3A8A]/20 text-white font-medium flex items-center justify-center hover:bg-[#1E3A8A]/30 transition-colors border border-white/20"
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
          
          {/* Right column - Infograph Display */}
          <div 
            className={`w-full md:w-1/2 transition-all duration-1000 delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
          >
            <div className="relative rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800 border border-white/20">
              {/* Dashboard Header */}
              <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <div className="font-semibold text-gray-700 dark:text-white flex items-center">
                  <BarChart3 className="h-5 w-5 text-[#2DD4BF] mr-2" />
                  <span>MarketSage Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    Live Data
                  </span>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="p-5">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Opens</span>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">64.8%</div>
                    <div className="text-xs text-green-500 flex items-center mt-1">
                      <span>+12.4%</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Clicks</span>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">24.2%</div>
                    <div className="text-xs text-green-500 flex items-center mt-1">
                      <span>+7.8%</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Conversions</span>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">8.7%</div>
                    <div className="text-xs text-green-500 flex items-center mt-1">
                      <span>+3.2%</span>
                    </div>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="bg-white dark:bg-gray-700/30 rounded-lg p-4 mb-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Campaign Performance</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</div>
                  </div>
                  
                  <div className="h-40 relative">
                    {/* SVG Chart */}
                    <svg className="w-full h-full" viewBox="0 0 300 100">
                      {/* Grid lines */}
                      <line x1="0" y1="25" x2="300" y2="25" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="75" x2="300" y2="75" stroke="#e5e7eb" strokeWidth="1" />
                      
                      {/* Line chart for opens */}
                      <path
                        d="M0,70 C20,60 40,40 60,35 C80,30 100,45 120,40 C140,35 160,25 180,15 C200,5 220,20 240,15 C260,10 280,5 300,10"
                        fill="none"
                        stroke="#2DD4BF"
                        strokeWidth="2"
                      />
                      
                      {/* Line chart for clicks */}
                      <path
                        d="M0,80 C20,75 40,70 60,65 C80,60 100,75 120,70 C140,65 160,60 180,55 C200,50 220,60 240,55 C260,50 280,45 300,40"
                        fill="none"
                        stroke="#FBBF24"
                        strokeWidth="2"
                      />
                      
                      {/* Line chart for conversions */}
                      <path
                        d="M0,90 C20,88 40,85 60,82 C80,79 100,85 120,82 C140,79 160,77 180,74 C200,71 220,78 240,75 C260,72 280,70 300,67"
                        fill="none"
                        stroke="#1E3A8A"
                        strokeWidth="2"
                      />
                    </svg>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-start mt-4 space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#2DD4BF] rounded-full mr-1"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Opens</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#FBBF24] rounded-full mr-1"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Clicks</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[#1E3A8A] rounded-full mr-1"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Conversions</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Marketing Automation Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-[#2DD4BF]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Active Automations</div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white">12 Workflows</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Engaging Customers</div>
                      <div className="text-sm font-medium text-gray-800 dark:text-white">+6.2k This Week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 