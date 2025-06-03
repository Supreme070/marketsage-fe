"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  Mail, MessageSquare, Users, Workflow, Database, BarChart3, LineChart, 
  PieChart, ChartBar, Zap, Settings, Target, Filter, BrainCircuit, Search,
  Send, Bell, ArrowUpRight, Megaphone, Phone, MailOpen, Speech, UserCheck
} from "lucide-react";

interface SolutionVisualProps {
  type: string;
  color: string;
}

export function SolutionVisual({ type, color }: SolutionVisualProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bgBase = isDark ? 'from-slate-900 to-slate-800' : 'from-white to-slate-100';
  
  switch (type) {
    case "omnichannel-messaging":
      return (
        <div className={`w-full h-full bg-gradient-to-br ${bgBase} overflow-hidden relative`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 gap-4">
              {Array.from({ length: 60 }).map((_, i) => (
                <div 
                  key={i} 
                  className="rounded-full"
                  style={{ 
                    backgroundColor: color,
                    opacity: Math.random() * 0.4
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Main elements */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Large message bubble */}
            <motion.div 
              className="absolute top-[30%] left-[25%] w-20 h-16 rounded-tl-xl rounded-tr-xl rounded-br-xl bg-blue-500/80"
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            >
              <div className="p-3">
                <motion.div 
                  className="w-full h-2 bg-white/80 rounded-full mb-2"
                  initial={{ width: "30%" }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                />
                <motion.div 
                  className="w-full h-2 bg-white/80 rounded-full"
                  initial={{ width: "60%" }}
                  animate={{ width: "40%" }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                />
              </div>
            </motion.div>
            
            {/* Email element */}
            <motion.div 
              className="absolute top-[20%] right-[20%] w-24 h-16 bg-white/90 rounded-md shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.3 }}
            >
              <div className="p-2">
                <div className="h-2 bg-blue-400 rounded-full mb-1.5" />
                <div className="h-1.5 bg-slate-300 rounded-full mb-1.5" />
                <div className="h-1.5 bg-slate-300 rounded-full mb-1.5" />
                <div className="h-1.5 bg-slate-300 rounded-full" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                <Mail className="w-3 h-3 text-white" />
              </div>
            </motion.div>
            
            {/* SMS message */}
            <motion.div 
              className="absolute bottom-[25%] left-[35%] w-16 h-14 rounded-tl-xl rounded-tr-xl rounded-bl-xl bg-green-500/80"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.6 }}
            >
              <div className="p-2">
                <motion.div 
                  className="w-full h-1.5 bg-white/80 rounded-full mb-1.5"
                  initial={{ width: "60%" }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                />
                <motion.div 
                  className="w-full h-1.5 bg-white/80 rounded-full"
                  initial={{ width: "40%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                />
              </div>
            </motion.div>
            
            {/* Central connecting element */}
            <motion.div 
              className="w-24 h-24 rounded-full flex items-center justify-center relative"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              style={{ backgroundColor: `${color}20` }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}40` }}>
                <MessageSquare className="w-8 h-8" style={{ color }} />
              </div>
              
              {/* Orbiting elements */}
              <motion.div 
                className="absolute -top-4 left-8 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 text-white"
                animate={{ 
                  x: [0, 10, 0, -10, 0],
                  y: [0, -10, 0, 10, 0]
                }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Mail className="w-3 h-3" />
              </motion.div>
              
              <motion.div 
                className="absolute top-10 -right-2 w-6 h-6 rounded-full flex items-center justify-center bg-green-500 text-white"
                animate={{ 
                  x: [0, 10, 0, -10, 0],
                  y: [0, 10, 0, -10, 0]
                }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
              >
                <MessageSquare className="w-3 h-3" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-2 left-6 w-6 h-6 rounded-full flex items-center justify-center bg-amber-500 text-white"
                animate={{ 
                  x: [0, -10, 0, 10, 0],
                  y: [0, 10, 0, -10, 0]
                }}
                transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
              >
                <Phone className="w-3 h-3" />
              </motion.div>
            </motion.div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid meet">
              <motion.path 
                d="M120,120 C150,140 180,130 200,150"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="5 3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
              />
              <motion.path 
                d="M200,150 C220,170 240,160 280,130"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="5 3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: 0.3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
              />
              <motion.path 
                d="M200,150 C190,180 180,190 140,195"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="5 3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
              />
            </svg>
          </div>
        </div>
      );
      
    case "workflow-automation":
      return (
        <div className={`w-full h-full bg-gradient-to-br ${bgBase} overflow-hidden relative`}>
          {/* Background grid */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 gap-6">
              {Array.from({ length: 60 }).map((_, i) => (
                <div 
                  key={i} 
                  className="rounded"
                  style={{ 
                    backgroundColor: color,
                    opacity: Math.random() * 0.3
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Main workflow diagram */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Central node */}
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}40` }}
              animate={{ 
                boxShadow: [
                  `0 0 0 0px ${color}20`,
                  `0 0 0 10px ${color}10`,
                  `0 0 0 0px ${color}20`
                ]
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Workflow className="w-10 h-10" style={{ color }} />
            </motion.div>
            
            {/* Connected workflow nodes */}
            <div className="absolute inset-0">
              {/* Node 1 */}
              <motion.div 
                className="absolute top-[20%] left-[30%] w-14 h-14 bg-purple-600/90 rounded-lg shadow-lg flex items-center justify-center text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <Mail className="w-6 h-6" />
              </motion.div>
              
              {/* Node 2 */}
              <motion.div 
                className="absolute top-[30%] right-[25%] w-14 h-14 bg-blue-500/90 rounded-lg shadow-lg flex items-center justify-center text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.4, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <Users className="w-6 h-6" />
              </motion.div>
              
              {/* Node 3 */}
              <motion.div 
                className="absolute bottom-[25%] left-[25%] w-14 h-14 bg-green-500/90 rounded-lg shadow-lg flex items-center justify-center text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.8, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <MessageSquare className="w-6 h-6" />
              </motion.div>
              
              {/* Node 4 */}
              <motion.div 
                className="absolute bottom-[35%] right-[30%] w-14 h-14 bg-amber-500/90 rounded-lg shadow-lg flex items-center justify-center text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              >
                <BarChart3 className="w-6 h-6" />
              </motion.div>
              
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid meet">
                {/* Path animation for flow lines */}
                <motion.path 
                  d="M125,90 C150,110 175,130 200,150"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.path 
                  d="M275,105 C250,120 225,135 200,150"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1.5, delay: 0.3, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.path 
                  d="M125,210 C150,190 175,170 200,150"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1.5, delay: 0.6, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.path 
                  d="M275,195 C250,180 225,165 200,150"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1.5, delay: 0.9, repeat: Number.POSITIVE_INFINITY }}
                />
                
                {/* Animated dots along paths to show data flow */}
                <motion.circle
                  cx="0" cy="0" r="3" fill={color}
                  animate={{ 
                    cx: [125, 150, 175, 200],
                    cy: [90, 110, 130, 150],
                  }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="0" cy="0" r="3" fill={color}
                  animate={{ 
                    cx: [275, 250, 225, 200],
                    cy: [105, 120, 135, 150],
                  }}
                  transition={{ duration: 1.2, delay: 0.3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="0" cy="0" r="3" fill={color}
                  animate={{ 
                    cx: [125, 150, 175, 200],
                    cy: [210, 190, 170, 150],
                  }}
                  transition={{ duration: 1.2, delay: 0.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="0" cy="0" r="3" fill={color}
                  animate={{ 
                    cx: [275, 250, 225, 200],
                    cy: [195, 180, 165, 150],
                  }}
                  transition={{ duration: 1.2, delay: 0.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </div>
        </div>
      );
      
    case "analytics-reporting":
      return (
        <div className={`w-full h-full bg-gradient-to-br ${bgBase} overflow-hidden relative`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1/2 grid grid-cols-12 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="rounded-t-md w-full"
                    style={{ 
                      backgroundColor: color,
                      height: `${Math.random() * 100}%`
                    }}
                    animate={{ height: [`${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: i * 0.1 }}
                  ></motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main data visualization elements */}
          <div className="relative z-10 w-full h-full p-6">
            {/* Header area with title and controls */}
            <div className="w-full h-8 mb-4 flex items-center justify-between">
              <motion.div 
                className="w-24 h-4 rounded-md"
                style={{ backgroundColor: `${color}60` }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              <div className="flex space-x-2">
                <motion.div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#10b981" }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                />
                <motion.div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.7 }}
                />
                <motion.div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#f59e0b" }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.9 }}
                />
              </div>
            </div>
            
            {/* Main chart area */}
            <div className="relative w-full h-40 mb-6">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-400/30" />
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-400/30" />
              
              {/* Line chart */}
              <svg className="absolute inset-0" viewBox="0 0 400 150" preserveAspectRatio="none">
                <motion.path
                  d="M0,120 C40,100 80,140 120,60 C160,20 200,80 240,40 C280,60 320,20 360,70 C400,90 440,110 480,95"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
                <motion.path
                  d="M0,140 C40,130 80,145 120,110 C160,90 200,130 240,100 C280,80 320,105 360,120 C400,110 440,130 480,125"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
                />
                
                {/* Data points */}
                {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x, i) => (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={i % 2 === 0 ? 60 : 100}
                    r="4"
                    fill="#3b82f6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  />
                ))}
              </svg>
            </div>
            
            {/* Stats cards */}
            <div className="flex justify-between">
              <motion.div 
                className="w-20 h-16 p-2 rounded-md shadow-md" 
                style={{ backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-full h-2 mb-2 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />
                <div className="w-3/4 h-1.5 mb-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
                <div className="w-1/2 h-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
              </motion.div>
              
              <motion.div 
                className="w-20 h-16 p-2 rounded-md shadow-md" 
                style={{ backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-full h-2 mb-2 rounded-sm" style={{ backgroundColor: "#10b981" }} />
                <div className="w-2/3 h-1.5 mb-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
                <div className="w-3/4 h-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
              </motion.div>
              
              <motion.div 
                className="w-20 h-16 p-2 rounded-md shadow-md" 
                style={{ backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="w-full h-2 mb-2 rounded-sm" style={{ backgroundColor: "#f59e0b" }} />
                <div className="w-1/2 h-1.5 mb-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
                <div className="w-1/3 h-1.5 rounded-sm" style={{ backgroundColor: isDark ? '#475569' : '#e2e8f0' }} />
              </motion.div>
            </div>
            
            {/* Floating data points */}
            <motion.div 
              className="absolute top-10 right-14 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${color}` }}
              animate={{ 
                y: [0, -10, 0],
                x: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <PieChart className="w-4 h-4 text-white" />
            </motion.div>
            
            <motion.div 
              className="absolute bottom-12 left-20 w-6 h-6 rounded-full flex items-center justify-center bg-blue-500"
              animate={{ 
                y: [0, 8, 0],
                x: [0, -5, 0]
              }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
            >
              <BarChart3 className="w-3 h-3 text-white" />
            </motion.div>
          </div>
        </div>
      );
      
    case "audience-segmentation":
      return (
        <div className={`w-full h-full bg-gradient-to-br ${bgBase} overflow-hidden relative`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-3">
              {Array.from({ length: 64 }).map((_, i) => (
                <div 
                  key={i} 
                  className="rounded-full"
                  style={{ 
                    backgroundColor: color,
                    opacity: Math.random() * 0.5
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Main segmentation visualization */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Central audience pool */}
            <motion.div 
              className="w-32 h-32 rounded-full flex items-center justify-center relative"
              style={{ 
                background: `radial-gradient(circle at center, ${color}, ${color}90)`,
                boxShadow: `0 0 20px ${color}50` 
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Small user icons to represent audience */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  const radius = 10;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  
                  return (
                    <motion.div 
                      key={i}
                      className="absolute w-5 h-5 flex items-center justify-center"
                      initial={{ 
                        x: 0, 
                        y: 0, 
                        opacity: 0.6 
                      }}
                      animate={{ 
                        x: x, 
                        y: y, 
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Number.POSITIVE_INFINITY, 
                        repeatType: "reverse", 
                        delay: i * 0.2
                      }}
                    >
                      <Users className="w-4 h-4 text-white" />
                    </motion.div>
                  );
                })}
              </div>
              
              <Users className="w-12 h-12 text-white/90" />
            </motion.div>
            
            {/* Segment groups radiating out */}
            <div className="absolute inset-0">
              {/* Segment 1 - Top Left */}
              <motion.div 
                className="absolute top-[20%] left-[22%] w-16 h-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: `radial-gradient(circle at center, #f59e0b, #f59e0b90)`,
                  boxShadow: `0 0 15px #f59e0b50` 
                }}
                initial={{ opacity: 0, scale: 0.8, x: 30, y: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <Users className="w-8 h-8 text-white/90" />
              </motion.div>
              
              {/* Segment 2 - Top Right */}
              <motion.div 
                className="absolute top-[20%] right-[22%] w-16 h-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: `radial-gradient(circle at center, #3b82f6, #3b82f690)`,
                  boxShadow: `0 0 15px #3b82f650` 
                }}
                initial={{ opacity: 0, scale: 0.8, x: -30, y: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <Users className="w-8 h-8 text-white/90" />
              </motion.div>
              
              {/* Segment 3 - Bottom Left */}
              <motion.div 
                className="absolute bottom-[20%] left-[22%] w-16 h-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: `radial-gradient(circle at center, #10b981, #10b98190)`,
                  boxShadow: `0 0 15px #10b98150` 
                }}
                initial={{ opacity: 0, scale: 0.8, x: 30, y: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                <Users className="w-8 h-8 text-white/90" />
              </motion.div>
              
              {/* Segment 4 - Bottom Right */}
              <motion.div 
                className="absolute bottom-[20%] right-[22%] w-16 h-16 rounded-full flex items-center justify-center"
                style={{ 
                  background: `radial-gradient(circle at center, #8b5cf6, #8b5cf690)`,
                  boxShadow: `0 0 15px #8b5cf650` 
                }}
                initial={{ opacity: 0, scale: 0.8, x: -30, y: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <Users className="w-8 h-8 text-white/90" />
              </motion.div>
              
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" fill="none" preserveAspectRatio="xMidYMid meet">
                {/* Line to Segment 1 */}
                <motion.path 
                  d="M200,150 L120,90"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                
                {/* Line to Segment 2 */}
                <motion.path 
                  d="M200,150 L280,90"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                
                {/* Line to Segment 3 */}
                <motion.path 
                  d="M200,150 L120,210"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
                
                {/* Line to Segment 4 */}
                <motion.path 
                  d="M200,150 L280,210"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  transition={{ duration: 1, delay: 0.9 }}
                />
                
                {/* Data flow animations */}
                <motion.circle
                  cx="200" cy="150" r="3" fill="#f59e0b"
                  animate={{ 
                    cx: [200, 160, 120],
                    cy: [150, 120, 90],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
                />
                
                <motion.circle
                  cx="200" cy="150" r="3" fill="#3b82f6"
                  animate={{ 
                    cx: [200, 240, 280],
                    cy: [150, 120, 90],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2, delay: 0.5 }}
                />
                
                <motion.circle
                  cx="200" cy="150" r="3" fill="#10b981"
                  animate={{ 
                    cx: [200, 160, 120],
                    cy: [150, 180, 210],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2, delay: 1 }}
                />
                
                <motion.circle
                  cx="200" cy="150" r="3" fill="#8b5cf6"
                  animate={{ 
                    cx: [200, 240, 280],
                    cy: [150, 180, 210],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2, delay: 1.5 }}
                />
              </svg>
              
              {/* Segment labels */}
              <div className="absolute top-[10%] left-[15%] bg-amber-100/90 dark:bg-amber-950/90 text-amber-900 dark:text-amber-300 text-xs px-2 py-1 rounded-md shadow-sm">
                Age 25-34
              </div>
              
              <div className="absolute top-[10%] right-[15%] bg-blue-100/90 dark:bg-blue-950/90 text-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-md shadow-sm">
                High Value
              </div>
              
              <div className="absolute bottom-[10%] left-[15%] bg-green-100/90 dark:bg-green-950/90 text-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-md shadow-sm">
                Lagos
              </div>
              
              <div className="absolute bottom-[10%] right-[15%] bg-purple-100/90 dark:bg-purple-950/90 text-purple-900 dark:text-purple-300 text-xs px-2 py-1 rounded-md shadow-sm">
                New Users
              </div>
            </div>
          </div>
        </div>
      );
      
    // Add more solution types here
      
    default:
      return (
        <div className={`w-full h-full bg-gradient-to-br ${bgBase} flex items-center justify-center`}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            {getDefaultIcon(type)}
          </div>
        </div>
      );
  }
}

// Helper function to get default icon based on type
function getDefaultIcon(type: string) {
  switch (type) {
    case "workflow-automation":
      return <Workflow size={36} />;
    case "analytics-reporting":
      return <BarChart3 size={36} />;
    case "audience-segmentation":
      return <Users size={36} />;
    case "email-marketing":
      return <Mail size={36} />;
    case "sms-messaging":
      return <MessageSquare size={36} />;
    case "whatsapp-marketing":
      return <MessageSquare size={36} />;
    case "crm-integration":
      return <Database size={36} />;
    default:
      return <BrainCircuit size={36} />;
  }
}