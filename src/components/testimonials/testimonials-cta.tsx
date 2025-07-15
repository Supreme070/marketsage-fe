"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Star } from "lucide-react";

export function TestimonialsCTA() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className={`py-20 lg:py-28 relative overflow-hidden ${
      isLight ? "bg-gradient-to-br from-purple-50 to-blue-50" : "bg-gradient-to-br from-purple-950/30 to-blue-950/30"
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, ${
              isLight ? "#8b5cf6" : "#6d28d9"
            } 0, transparent 50%), radial-gradient(circle at 80% 20%, ${
              isLight ? "#3b82f6" : "#1e40af"
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
          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-6 w-6 fill-current ${
                isLight ? "text-yellow-500" : "text-yellow-400"
              }`} />
            ))}
          </div>

          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Join Africa's fastest-growing companies
          </h2>
          
          <p className={`text-lg lg:text-xl mb-10 ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            See why 50+ enterprises trust MarketSage to power their growth.
            <br />Start your success story today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className={`text-white ${
                isLight ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              Start Your Success Story
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
              See Live Demo
            </Button>
          </div>

          {/* Customer Quote */}
          <div className={`inline-flex items-center gap-4 px-6 py-4 rounded-full ${
            isLight 
              ? "bg-white/80 border border-gray-200" 
              : "bg-gray-900/80 border border-gray-800"
          }`}>
            <div className={`w-10 h-10 rounded-full ${
              isLight ? "bg-gray-200" : "bg-gray-700"
            }`} />
            <div className="text-left">
              <p className={`text-sm italic ${
                isLight ? "text-gray-700" : "text-gray-300"
              }`}>
                "Best decision we made for our marketing team"
              </p>
              <p className="text-xs text-muted-foreground">
                - Marketing Director, Leading Nigerian Bank
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}