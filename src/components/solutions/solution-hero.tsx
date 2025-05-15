"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SolutionIllustration } from "./solution-illustration";
import { SolutionVisual } from "./solution-visual";

interface SolutionHeroProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  image?: string;
  solutionType?: string;
}

export function SolutionHero({ 
  title, 
  description, 
  icon, 
  color, 
  image,
  solutionType
}: SolutionHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className={`relative py-20 overflow-hidden ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
      {/* Background gradient */}
      <div className={`absolute top-0 inset-x-0 h-[500px] ${isDark ? 'opacity-20' : 'opacity-10'}`} 
        style={{ 
          background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
        }}
      />
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center mb-6"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4`} 
                style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
              </div>
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`text-lg md:text-xl mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
            >
              {description}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" className="group">
                <span>Start Free Trial</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  See Demo
                </Button>
              </Link>
            </motion.div>
          </div>
          
          <div className="w-full md:w-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`rounded-xl overflow-hidden border ${isDark ? 'border-slate-800' : 'border-slate-200'} shadow-xl`}
            >
              {image ? (
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-auto"
                />
              ) : (
                <div className={`aspect-video w-full overflow-hidden`}>
                  <SolutionVisual 
                    type={solutionType || getTypeFromTitle(title)} 
                    color={color}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper function to determine solution type from title if not explicitly provided
function getTypeFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('workflow') || titleLower.includes('automation')) {
    return 'workflow-automation';
  } else if (titleLower.includes('analytic') || titleLower.includes('report')) {
    return 'analytics-reporting';
  } else if (titleLower.includes('audience') || titleLower.includes('segment')) {
    return 'audience-segmentation';
  } else if (titleLower.includes('channel') || titleLower.includes('message') || titleLower.includes('sms') || titleLower.includes('email')) {
    return 'omnichannel-messaging';
  } else if (titleLower.includes('email')) {
    return 'email-marketing';
  } else if (titleLower.includes('whatsapp')) {
    return 'whatsapp-marketing';
  } else if (titleLower.includes('crm') || titleLower.includes('integration')) {
    return 'crm-integration';
  }
  
  return 'default';
} 