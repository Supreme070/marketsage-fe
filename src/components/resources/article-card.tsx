"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";

interface ArticleCardProps {
  title: string;
  description: string;
  image?: string;
  author?: string;
  date?: string;
  readTime?: string;
  slug: string;
  category?: string;
  categoryColor?: string;
  index?: number;
}

export function ArticleCard({
  title,
  description,
  image,
  author,
  date,
  readTime,
  slug,
  category,
  categoryColor = "#3B82F6",
  index = 0
}: ArticleCardProps) {
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
      {/* Featured image */}
      {image && (
        <Link href={`/resources/blog/${slug}`} className="block overflow-hidden">
          <div className="aspect-video relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${image})` }}
            />
          </div>
        </Link>
      )}
      
      {/* Content */}
      <div className="p-6">
        {category && (
          <span 
            className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-3"
            style={{ 
              backgroundColor: `${categoryColor}10`,
              color: categoryColor 
            }}
          >
            {category}
          </span>
        )}
        
        <Link href={`/resources/blog/${slug}`}>
          <h3 className={`text-xl font-semibold mb-3 group-hover:text-primary transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {title}
          </h3>
        </Link>
        
        <p className={`mb-4 line-clamp-2 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {description}
        </p>
        
        {/* Meta information */}
        <div className={`flex flex-wrap gap-4 text-sm ${
          isDark ? 'text-slate-500' : 'text-slate-500'
        }`}>
          {author && (
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{author}</span>
            </div>
          )}
          
          {date && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{date}</span>
            </div>
          )}
          
          {readTime && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{readTime}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 