"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SolutionCTAProps {
  title: string;
  description: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  primaryLink?: string;
  secondaryLink?: string;
  color: string;
}

export function SolutionCTA({ 
  title, 
  description, 
  primaryCTA = "Start Free Trial", 
  secondaryCTA = "Contact Sales",
  primaryLink = "/register",
  secondaryLink = "/contact",
  color 
}: SolutionCTAProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <section className={`py-20 ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
      <div className="container px-4 mx-auto">
        <div className={`rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'} border ${isDark ? 'border-slate-800' : 'border-slate-200'} p-10 md:p-16 relative overflow-hidden`}>
          {/* Background gradient blob */}
          <div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: color }}
          />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`text-3xl md:text-4xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className={`text-lg mb-10 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {description}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href={primaryLink}>
                <Button size="lg" className="group w-full sm:w-auto" style={{ backgroundColor: color }}>
                  <span>{primaryCTA}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              
              <Link href={secondaryLink}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto" 
                  style={{ borderColor: `${color}50`, color }}
                >
                  {secondaryCTA}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
} 