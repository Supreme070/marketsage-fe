"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { TrendingUp, Users, Globe, Zap } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "847%",
    label: "Average ROI",
    sublabel: "in first 12 months"
  },
  {
    icon: Users,
    value: "50+",
    label: "Enterprise Clients",
    sublabel: "across Africa"
  },
  {
    icon: Globe,
    value: "15",
    label: "African Countries",
    sublabel: "actively using MarketSage"
  },
  {
    icon: Zap,
    value: "10B+",
    label: "Messages Sent",
    sublabel: "monthly across all channels"
  }
];

export function TestimonialsStats() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className={`py-16 ${
      isLight ? "bg-gray-50" : "bg-slate-950"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  isLight ? "bg-blue-100" : "bg-blue-900/50"
                }`}>
                  <Icon className={`h-6 w-6 ${
                    isLight ? "text-blue-600" : "text-blue-400"
                  }`} />
                </div>
                <h3 className={`text-3xl lg:text-4xl font-bold mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}>
                  {stat.value}
                </h3>
                <p className={`font-medium ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}>
                  {stat.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}