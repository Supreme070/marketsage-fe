"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Building2, TrendingUp, Star } from "lucide-react";

export function TestimonialsHero() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className={`py-16 lg:py-24 ${
      isLight ? "bg-white" : "bg-slate-900"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Featured Testimonial */}
          <Card className={`relative p-8 lg:p-12 border-2 overflow-hidden ${
            isLight 
              ? "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200" 
              : "bg-gradient-to-br from-blue-950/30 to-purple-950/30 border-blue-800"
          }`}>
            {/* Quote Icon */}
            <Quote className={`absolute top-8 right-8 h-24 w-24 ${
              isLight ? "text-blue-100" : "text-blue-950/50"
            }`} />
            
            <div className="relative z-10">
              {/* Company Info */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    isLight ? "bg-white shadow-md" : "bg-slate-800"
                  }`}>
                    <Building2 className={`h-8 w-8 ${
                      isLight ? "text-blue-600" : "text-blue-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      Access Bank Nigeria
                    </h3>
                    <p className="text-muted-foreground">
                      Leading Financial Institution
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`h-4 w-4 fill-current ${
                          isLight ? "text-yellow-500" : "text-yellow-400"
                        }`} />
                      ))}
                    </div>
                  </div>
                </div>
                
                <Badge className={`${
                  isLight 
                    ? "bg-green-100 text-green-700 border-green-200" 
                    : "bg-green-900/50 text-green-300 border-green-800"
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  312% ROI
                </Badge>
              </div>

              {/* Main Quote */}
              <blockquote className={`text-2xl lg:text-3xl font-medium mb-8 ${
                isLight ? "text-gray-800" : "text-gray-200"
              }`}>
                "MarketSage transformed how we engage with our customers. The AI-powered insights helped us achieve{" "}
                <span className={isLight ? "text-blue-600" : "text-blue-400"}>312% revenue growth</span> in just 6 months. 
                It's not just a tool; it's our competitive advantage in the African market."
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${
                    isLight ? "bg-gray-200" : "bg-gray-700"
                  }`} />
                  <div>
                    <p className={`font-semibold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      Adebayo Ogunlesi
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Head of Digital Banking
                    </p>
                  </div>
                </div>
                
                {/* Results */}
                <div className="hidden lg:flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      85%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Open Rate
                    </p>
                  </div>
                  <div className={`w-px h-12 ${
                    isLight ? "bg-gray-300" : "bg-gray-700"
                  }`} />
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      3.2M
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customers Reached
                    </p>
                  </div>
                  <div className={`w-px h-12 ${
                    isLight ? "bg-gray-300" : "bg-gray-700"
                  }`} />
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      isLight ? "text-gray-900" : "text-gray-100"
                    }`}>
                      ₦2.4B
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue Added
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Results */}
              <div className="flex lg:hidden items-center gap-4 mt-6 pt-6 border-t">
                <div className="flex-1 text-center">
                  <p className={`text-xl font-bold ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    85%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Open Rate
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className={`text-xl font-bold ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    3.2M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reached
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className={`text-xl font-bold ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    ₦2.4B
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Revenue
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}