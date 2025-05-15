"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, BarChart4, TrendingUp } from "lucide-react";

interface CaseStudyCardProps {
  title: string;
  companyName: string;
  industry: string;
  description: string;
  results: {
    label: string;
    value: string;
  }[];
  slug: string;
  logo?: string;
  index?: number;
}

export function CaseStudyCard({
  title,
  companyName,
  industry,
  description,
  results,
  slug,
  logo,
  index = 0
}: CaseStudyCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`group relative overflow-hidden rounded-xl ${
        isDark 
          ? 'bg-slate-900/60 border border-slate-800/60' 
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className={`text-sm font-medium mb-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {industry}
            </div>
            <Link href={`/resources/case-studies/${slug}`}>
              <h3 className={`text-xl font-semibold group-hover:text-primary transition-colors ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </h3>
            </Link>
            <div className={`text-base font-medium ${
              isDark ? 'text-primary-400' : 'text-primary-600'
            }`}>
              {companyName}
            </div>
          </div>
          
          {/* Logo */}
          {logo && (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${
              isDark ? 'bg-white/10' : 'bg-slate-100'
            }`}>
              <img src={logo} alt={companyName} className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
        
        {/* Description */}
        <p className={`mb-6 line-clamp-2 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {description}
        </p>
        
        {/* Results */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {results.map((result, i) => (
            <div key={i} className={`p-3 rounded-lg ${
              isDark ? 'bg-slate-800/50' : 'bg-slate-100/80'
            }`}>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {result.label}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={16} className="text-green-500" />
                <span className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {result.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Read more link */}
        <Link 
          href={`/resources/case-studies/${slug}`}
          className={`inline-flex items-center gap-1 text-sm font-medium ${
            isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
          }`}
        >
          Read Case Study 
          <ArrowUpRight size={14} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
} 