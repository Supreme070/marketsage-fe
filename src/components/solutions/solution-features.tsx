"use client";

import { useTheme } from "next-themes";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface SolutionFeaturesProps {
  title: string;
  description: string;
  features: FeatureItem[];
  color: string;
  image?: string;
}

export function SolutionFeatures({ title, description, features, color, image }: SolutionFeaturesProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: "-100px" });
  const descInView = useInView(descRef, { once: true, margin: "-100px" });
  
  return (
    <section className={`py-20 ${isDark ? 'bg-background/50' : 'bg-white'}`}>
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            ref={titleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
            style={{ color }}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            ref={descRef}
            initial={{ opacity: 0, y: 20 }}
            animate={descInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
          >
            {description}
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={index}
              color={color}
            />
          ))}
        </div>
        
        {image && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className={`rounded-xl overflow-hidden border ${isDark ? 'border-slate-800' : 'border-slate-200'} shadow-xl`}
          >
            <img src={image} alt={title} className="w-full h-auto" />
          </motion.div>
        )}
      </div>
    </section>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon, 
  index,
  color
}: { 
  title: string;
  description: string;
  icon?: React.ReactNode;
  index: number;
  color: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
      }}
      className={`p-6 rounded-xl ${
        isDark 
          ? 'bg-slate-900/60 border border-slate-800/60' 
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      {icon ? (
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      ) : (
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <CheckCircle2 className="h-6 w-6" />
        </div>
      )}
      
      <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      
      <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {description}
      </p>
    </motion.div>
  );
} 