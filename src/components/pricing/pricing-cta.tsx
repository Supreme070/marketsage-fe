"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MessageSquare } from "lucide-react";

export function PricingCTA() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className={`py-20 lg:py-28 relative overflow-hidden ${
      isLight ? "bg-gradient-to-br from-blue-50 to-green-50" : "bg-gradient-to-br from-blue-950/30 to-green-950/30"
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${
              isLight ? "#3b82f6" : "#1e40af"
            } 0, transparent 50%), radial-gradient(circle at 80% 20%, ${
              isLight ? "#10b981" : "#064e3b"
            } 0, transparent 50%)`
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Ready to transform your marketing?
          </h2>
          
          <p className={`text-lg lg:text-xl mb-10 ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            Join 50+ African enterprises already seeing their invisible revenue.
            <br />Start your 14-day free trial today. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className={`text-white ${
                isLight ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className={`${
                isLight 
                  ? "border-gray-300 hover:bg-gray-50" 
                  : "border-gray-700 hover:bg-gray-800"
              }`}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book a Demo
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${
                isLight ? "bg-green-100" : "bg-green-900/50"
              }`}>
                <MessageSquare className={`h-4 w-4 ${
                  isLight ? "text-green-600" : "text-green-400"
                }`} />
              </div>
              <span className={isLight ? "text-gray-700" : "text-gray-300"}>
                24/7 support for Growth & Enterprise
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex -space-x-2`}>
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 ${
                      isLight 
                        ? "bg-gray-200 border-white" 
                        : "bg-gray-700 border-slate-900"
                    }`}
                  />
                ))}
              </div>
              <span className={isLight ? "text-gray-700" : "text-gray-300"}>
                Join 50+ happy customers
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}