"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, File, FileText, FolderOpen } from "lucide-react";

interface DocItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  slug: string;
  isCategory?: boolean;
  items?: number;
  index?: number;
}

export function DocItem({
  title,
  description,
  icon,
  slug,
  isCategory = false,
  items,
  index = 0
}: DocItemProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <Link
        href={`/resources/documentation/${slug}`}
        className={`block p-5 rounded-xl border transition-all group hover:shadow-md ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            {icon || (isCategory ? 
              <FolderOpen className={isDark ? "text-blue-400" : "text-blue-500"} size={20} /> : 
              <FileText className={isDark ? "text-primary-400" : "text-primary-500"} size={20} />
            )}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </h3>
              
              <ArrowRight 
                size={16} 
                className={`transition-transform group-hover:translate-x-1 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`} 
              />
            </div>
            
            {description && (
              <p className={`mt-1 text-sm line-clamp-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {description}
              </p>
            )}
            
            {isCategory && items && (
              <div className={`mt-2 text-xs ${
                isDark ? 'text-slate-500' : 'text-slate-500'
              }`}>
                {items} {items === 1 ? 'article' : 'articles'}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 