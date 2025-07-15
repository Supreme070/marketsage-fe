"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Star } from "lucide-react";

export function TestimonialsHeader() {
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
            ? "bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30" 
            : "bg-gradient-to-br from-purple-950/20 via-slate-950 to-blue-950/20"
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
                ? "bg-purple-100 text-purple-700 border-purple-200" 
                : "bg-purple-900/50 text-purple-300 border-purple-800"
            }`}
          >
            <Heart className="h-3 w-3 mr-1" />
            CUSTOMER LOVE
          </Badge>
          
          <h1 className={`text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
            isLight ? "text-gray-900" : "text-gray-100"
          }`}>
            Loved by African enterprises
          </h1>
          
          <p className={`text-lg lg:text-xl mb-8 ${
            isLight ? "text-gray-600" : "text-gray-400"
          }`}>
            Real stories from real businesses achieving extraordinary results
            <br />with MarketSage across Africa.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-yellow-100" : "bg-yellow-900/50"
              }`}>
                <Star className={`h-4 w-4 ${
                  isLight ? "text-yellow-600" : "text-yellow-400"
                }`} />
              </div>
              <span className="font-medium">4.9/5 Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-green-100" : "bg-green-900/50"
              }`}>
                <Users className={`h-4 w-4 ${
                  isLight ? "text-green-600" : "text-green-400"
                }`} />
              </div>
              <span className="font-medium">50+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                isLight ? "bg-blue-100" : "bg-blue-900/50"
              }`}>
                <Heart className={`h-4 w-4 ${
                  isLight ? "text-blue-600" : "text-blue-400"
                }`} />
              </div>
              <span className="font-medium">95% Retention Rate</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}