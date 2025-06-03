"use client";

import { motion } from "framer-motion";
import { 
  BarChart, BookOpen, FileText, Mail, MessageSquare, Users, 
  Workflow, Database, Bot, Zap, BarChart3, LineChart, PieChart,
  FolderKanban, Settings, Filter, BrainCircuit
} from "lucide-react";
import { useTheme } from "next-themes";

interface DocIllustrationProps {
  category: string;
  className?: string;
}

export function DocIllustration({ category, className = "" }: DocIllustrationProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Handle different categories with custom illustrations
  switch (category) {
    case "getting-started":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-0 top-3 h-16 w-16 ${isDark ? "text-primary-500/80" : "text-primary-500/60"}`}
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 5, 0]
             }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <BookOpen size={40} />
          </motion.div>
          <motion.div 
            className={`absolute left-2 bottom-3 h-8 w-8 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ 
              y: [0, 3, 0],
              x: [0, 2, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
          >
            <Zap size={24} />
          </motion.div>
          <motion.div 
            className={`absolute right-2 bottom-1 h-10 w-10 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          >
            <Settings size={28} />
          </motion.div>
        </div>
      );
      
    case "workflow-builder":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-2 top-3 ${isDark ? "text-primary-500/90" : "text-primary-500/70"}`}
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Workflow size={40} />
          </motion.div>
          <motion.div 
            className={`absolute left-2 top-6 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }}
          >
            <FolderKanban size={24} />
          </motion.div>
          <motion.div 
            className={`absolute left-5 bottom-2 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ y: [0, 3, 0], x: [0, 3, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
          >
            <Zap size={24} />
          </motion.div>
        </div>
      );
      
    case "email-campaigns":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-3 top-2 ${isDark ? "text-blue-500/80" : "text-blue-500/60"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Mail size={40} />
          </motion.div>
          <motion.div 
            className={`absolute right-5 top-8 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
          >
            <BarChart size={20} />
          </motion.div>
          <motion.div 
            className={`absolute right-2 bottom-2 ${isDark ? "text-green-500/70" : "text-green-500/50"}`}
            animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          >
            <Users size={24} />
          </motion.div>
        </div>
      );
      
    case "sms-whatsapp":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-3 top-3 ${isDark ? "text-green-500/80" : "text-green-500/60"}`}
            animate={{ y: [0, -4, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <MessageSquare size={38} />
          </motion.div>
          <motion.div 
            className={`absolute right-3 top-6 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
          >
            <MessageSquare size={20} />
          </motion.div>
          <motion.div 
            className={`absolute left-6 bottom-2 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          >
            <Zap size={24} />
          </motion.div>
        </div>
      );
      
    case "audience-segmentation":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-2 top-2 ${isDark ? "text-amber-500/80" : "text-amber-500/60"}`}
            animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Users size={38} />
          </motion.div>
          <motion.div 
            className={`absolute right-2 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
          >
            <Filter size={24} />
          </motion.div>
          <motion.div 
            className={`absolute left-6 bottom-1 ${isDark ? "text-green-500/70" : "text-green-500/50"}`}
            animate={{ rotate: [0, 15, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.7 }}
          >
            <Database size={22} />
          </motion.div>
        </div>
      );
      
    case "analytics-reporting":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-0 top-3 ${isDark ? "text-purple-500/80" : "text-purple-500/60"}`}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <BarChart3 size={34} />
          </motion.div>
          <motion.div 
            className={`absolute right-0 top-2 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
          >
            <LineChart size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-6 bottom-0 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          >
            <PieChart size={24} />
          </motion.div>
        </div>
      );
      
    // Default illustration for any other categories or specific guides
    default:
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-2 top-2 ${isDark ? "text-primary-500/80" : "text-primary-500/60"}`}
            animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <FileText size={32} />
          </motion.div>
          <motion.div 
            className={`absolute left-3 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/50"}`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
          >
            <Bot size={22} />
          </motion.div>
          <motion.div 
            className={`absolute left-2 bottom-2 ${isDark ? "text-amber-500/70" : "text-amber-500/50"}`}
            animate={{ rotate: [0, 10, 0], y: [0, 2, 0] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.7 }}
          >
            <BrainCircuit size={22} />
          </motion.div>
        </div>
      );
  }
} 