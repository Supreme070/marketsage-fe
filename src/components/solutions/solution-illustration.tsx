"use client";

import { motion } from "framer-motion";
import { 
  Mail, MessageSquare, Users, Workflow, Database, BarChart3, LineChart, 
  PieChart, ChartBar, Zap, Settings, Target, Filter, BrainCircuit, Search,
  Send, Bell, ArrowUpRight, Megaphone, Phone, MailOpen, Speech, UserCheck
} from "lucide-react";
import { useTheme } from "next-themes";

interface SolutionIllustrationProps {
  type: string;
  className?: string;
}

export function SolutionIllustration({ type, className = "" }: SolutionIllustrationProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Different illustrations based on solution type
  switch (type) {
    case "workflow-automation":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-2 top-0 ${isDark ? "text-purple-500/80" : "text-purple-500/70"}`}
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Workflow size={45} />
          </motion.div>
          <motion.div 
            className={`absolute left-2 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/60"}`}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <Zap size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-0 bottom-0 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ y: [0, 4, 0], x: [0, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Settings size={30} />
          </motion.div>
        </div>
      );
      
    case "omnichannel-messaging":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-0 top-2 ${isDark ? "text-blue-500/80" : "text-blue-500/70"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mail size={42} />
          </motion.div>
          <motion.div 
            className={`absolute right-2 top-3 ${isDark ? "text-green-500/70" : "text-green-500/60"}`}
            animate={{ rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <MessageSquare size={32} />
          </motion.div>
          <motion.div 
            className={`absolute left-8 bottom-2 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <Phone size={26} />
          </motion.div>
        </div>
      );
      
    case "audience-segmentation":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-2 top-0 ${isDark ? "text-amber-500/80" : "text-amber-500/70"}`}
            animate={{ y: [0, -4, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Users size={40} />
          </motion.div>
          <motion.div 
            className={`absolute right-0 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/60"}`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <Filter size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-5 bottom-0 ${isDark ? "text-green-500/70" : "text-green-500/60"}`}
            animate={{ rotate: [0, 15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <Target size={28} />
          </motion.div>
        </div>
      );
      
    case "analytics-reporting":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-0 top-0 ${isDark ? "text-purple-500/80" : "text-purple-500/70"}`}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <BarChart3 size={38} />
          </motion.div>
          <motion.div 
            className={`absolute right-0 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/60"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <LineChart size={30} />
          </motion.div>
          <motion.div 
            className={`absolute left-6 bottom-0 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <PieChart size={28} />
          </motion.div>
        </div>
      );
      
    case "email-marketing":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-0 top-0 ${isDark ? "text-blue-500/80" : "text-blue-500/70"}`}
            animate={{ y: [0, -4, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <MailOpen size={40} />
          </motion.div>
          <motion.div 
            className={`absolute left-2 top-6 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Send size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-0 bottom-2 ${isDark ? "text-green-500/70" : "text-green-500/60"}`}
            animate={{ y: [0, 3, 0], x: [0, 3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <ChartBar size={26} />
          </motion.div>
        </div>
      );
      
    case "sms-messaging":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-0 top-0 ${isDark ? "text-green-500/80" : "text-green-500/70"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageSquare size={38} />
          </motion.div>
          <motion.div 
            className={`absolute left-0 top-5 ${isDark ? "text-primary-500/70" : "text-primary-500/60"}`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <Phone size={30} />
          </motion.div>
          <motion.div 
            className={`absolute left-4 bottom-0 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <Bell size={26} />
          </motion.div>
        </div>
      );
      
    case "whatsapp-marketing":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-0 top-0 ${isDark ? "text-green-500/80" : "text-green-500/70"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageSquare size={40} />
          </motion.div>
          <motion.div 
            className={`absolute left-0 top-6 ${isDark ? "text-blue-500/70" : "text-blue-500/60"}`}
            animate={{ rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          >
            <Speech size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-6 bottom-2 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ y: [0, 3, 0], x: [0, 3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <UserCheck size={26} />
          </motion.div>
        </div>
      );
      
    case "crm-integration":
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute left-0 top-0 ${isDark ? "text-blue-500/80" : "text-blue-500/70"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Database size={38} />
          </motion.div>
          <motion.div 
            className={`absolute right-2 top-6 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <ArrowUpRight size={28} />
          </motion.div>
          <motion.div 
            className={`absolute left-5 bottom-0 ${isDark ? "text-green-500/70" : "text-green-500/60"}`}
            animate={{ rotate: [0, 15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <Users size={26} />
          </motion.div>
        </div>
      );
      
    // Default illustration
    default:
      return (
        <div className={`relative ${className}`}>
          <motion.div 
            className={`absolute right-0 top-0 ${isDark ? "text-primary-500/80" : "text-primary-500/70"}`}
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrainCircuit size={38} />
          </motion.div>
          <motion.div 
            className={`absolute left-0 top-5 ${isDark ? "text-blue-500/70" : "text-blue-500/60"}`}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <Megaphone size={30} />
          </motion.div>
          <motion.div 
            className={`absolute left-5 bottom-0 ${isDark ? "text-amber-500/70" : "text-amber-500/60"}`}
            animate={{ y: [0, 3, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <Search size={26} />
          </motion.div>
        </div>
      );
  }
} 