"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Zap, Shield } from "lucide-react";

export function PricingHeader() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className={`relative py-16 lg:py-24 overflow-hidden ${
      isLight ? "bg-gray-50" : "bg-slate-950"
    }`}>
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          isLight 
            ? "bg-gradient-to-br from-blue-50/50 via-white to-green-50/30" 
            : "bg-gradient-to-br from-blue-950/20 via-slate-950 to-green-950/20"
        }`} />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Badge 
            variant="secondary" 
            className={`mb-4 ${
              isLight 
                ? "bg-blue-100 text-blue-700 border-blue-200" 
                : "bg-blue-900/50 text-blue-300 border-blue-800"
            }`}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            TRANSPARENT PRICING
          </Badge>
          
          <h1 className={`text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Pricing that scales with your growth
          </h1>
          
          <p className={`text-lg lg:text-xl mb-8 ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            Start free, upgrade as you grow. No hidden fees, no surprises.
            <br />Built for African enterprises.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-green-100" : "bg-green-900/50"
              }`}>
                <Zap className={`h-4 w-4 ${
                  isLight ? "text-green-600" : "text-green-400"
                }`} />
              </div>
              <span className="font-medium">14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-blue-100" : "bg-blue-900/50"
              }`}>
                <Shield className={`h-4 w-4 ${
                  isLight ? "text-blue-600" : "text-blue-400"
                }`} />
              </div>
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-purple-100" : "bg-purple-900/50"
              }`}>
                <DollarSign className={`h-4 w-4 ${
                  isLight ? "text-purple-600" : "text-purple-400"
                }`} />
              </div>
              <span className="font-medium">Pay in Naira or USD</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}