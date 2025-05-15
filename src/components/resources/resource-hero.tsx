"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ResourceHeroProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgPattern?: string;
  cta?: {
    text: string;
    href: string;
  };
}

export function ResourceHero({ 
  title, 
  description, 
  icon, 
  color, 
  bgPattern,
  cta 
}: ResourceHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className={`relative py-20 overflow-hidden ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
      {/* Background pattern */}
      {bgPattern && (
        <div
          className="absolute inset-0 z-0 opacity-5"
          style={{ backgroundImage: `url(${bgPattern})` }}
        />
      )}
      
      {/* Background gradient */}
      <div 
        className={`absolute top-0 left-1/4 w-1/2 h-1/2 rounded-full blur-3xl ${isDark ? 'opacity-20' : 'opacity-10'}`} 
        style={{ background: `radial-gradient(circle at center, ${color}80 0%, transparent 70%)` }}
      />
      
      <div className="container relative z-10 px-4 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center mb-6"
        >
          <div 
            className={`w-16 h-16 rounded-xl flex items-center justify-center`}
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {icon}
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          {title}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-lg md:text-xl max-w-2xl mx-auto mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
        >
          {description}
        </motion.p>
        
        {cta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href={cta.href}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all group hover:gap-3 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-slate-900/10 hover:bg-slate-900/20 text-slate-900'
              }`}
              style={{ color }}
            >
              {cta.text}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
} 