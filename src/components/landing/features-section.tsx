"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { 
  Zap, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Workflow, 
  SlidersHorizontal, 
  Smartphone, 
  CheckCircle2, 
  FlaskConical, 
  Bot, 
  Layers,
  Database,
  LineChart,
  ScrollText,
  BarChart4,
  BrainCircuit,
  UserCog,
  BarChartHorizontal
} from "lucide-react";
import { WorkflowDemo } from "@/components/landing/workflow-demo";
import { getOptimizedSettings } from "@/lib/animation";

// Feature groups with titles, descriptions, and bullet points
const featureGroups = [
  {
    id: "workflow-builder",
    title: "Visual Workflow Builder",
    description: "Create sophisticated marketing journeys with our intuitive drag-and-drop interface. No coding required.",
    icon: <Workflow className="h-6 w-6" />,
    color: "text-primary",
    bgColor: "bg-primary",
    features: [
      { text: "Intuitive drag-and-drop interface", icon: <CheckCircle2 size={16} /> },
      { text: "Pre-built templates for quick setup", icon: <CheckCircle2 size={16} /> },
      { text: "Real-time workflow testing", icon: <CheckCircle2 size={16} /> }
    ]
  },
  {
    id: "multi-channel",
    title: "Multi-Channel Campaigns",
    description: "Seamlessly manage Email, SMS, and WhatsApp campaigns from a single platform with unified analytics.",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    features: [
      { text: "Unified inbox for all channels", icon: <CheckCircle2 size={16} /> },
      { text: "WhatsApp Business API integration", icon: <CheckCircle2 size={16} /> },
      { text: "Bulk SMS with delivery tracking", icon: <CheckCircle2 size={16} /> }
    ]
  },
  {
    id: "segmentation",
    title: "Smart Contact Segmentation",
    description: "Target the right audience with AI-powered segmentation based on behavior, demographics, and engagement.",
    icon: <Users className="h-6 w-6" />,
    color: "text-green-500",
    bgColor: "bg-green-500",
    features: [
      { text: "Dynamic audience segmentation", icon: <CheckCircle2 size={16} /> },
      { text: "Behavioral targeting rules", icon: <CheckCircle2 size={16} /> },
      { text: "Custom field support", icon: <CheckCircle2 size={16} /> }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Performance",
    description: "Make data-driven decisions with comprehensive analytics that track campaign performance in real-time.",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    features: [
      { text: "Real-time performance dashboards", icon: <CheckCircle2 size={16} /> },
      { text: "Conversion tracking", icon: <CheckCircle2 size={16} /> },
      { text: "A/B testing capabilities", icon: <CheckCircle2 size={16} /> }
    ]
  }
];

// All individual features for the feature grid
const features = [
  {
    icon: <Workflow className="h-6 w-6" />,
    title: "Drag & Drop Workflows",
    description: "Design complex marketing journeys without code using our intuitive visual builder.",
    color: "text-primary",
    bgColor: "bg-primary",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* Workflow diagram */}
        <motion.div 
          className={`absolute left-3 top-3 w-8 h-8 rounded-lg ${isDark ? 'bg-primary-600/50' : 'bg-primary-500/30'} flex items-center justify-center`}
          animate={{ 
            y: [0, -4, 0],
            boxShadow: [
              '0 0 0 rgba(0, 0, 0, 0)',
              '0 4px 6px rgba(0, 0, 0, 0.1)',
              '0 0 0 rgba(0, 0, 0, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
        >
          <Zap size={16} className="text-primary" />
        </motion.div>
        
        {/* Connection line */}
        <motion.div 
          className={`absolute left-12 top-7 h-0.5 w-10 ${isDark ? 'bg-primary-600/50' : 'bg-primary-500/50'}`}
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 1, delay: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
        />
        
        {/* Second node */}
        <motion.div 
          className={`absolute left-[5.5rem] top-3 w-8 h-8 rounded-lg ${isDark ? 'bg-blue-600/50' : 'bg-blue-500/30'} flex items-center justify-center`}
          animate={{ 
            y: [0, -4, 0],
            boxShadow: [
              '0 0 0 rgba(0, 0, 0, 0)',
              '0 4px 6px rgba(0, 0, 0, 0.1)',
              '0 0 0 rgba(0, 0, 0, 0)'
            ]
          }}
          transition={{ duration: 2, delay: 0.3, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
        >
          <Mail size={16} className="text-blue-500" />
        </motion.div>
        
        {/* Connection line */}
        <motion.div 
          className={`absolute left-[9.5rem] top-7 h-0.5 w-10 ${isDark ? 'bg-blue-600/50' : 'bg-blue-500/50'}`}
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 1, delay: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
        />
        
        {/* Third node */}
        <motion.div 
          className={`absolute left-[13rem] top-3 w-8 h-8 rounded-lg ${isDark ? 'bg-green-600/50' : 'bg-green-500/30'} flex items-center justify-center`}
          animate={{ 
            y: [0, -4, 0],
            boxShadow: [
              '0 0 0 rgba(0, 0, 0, 0)',
              '0 4px 6px rgba(0, 0, 0, 0.1)',
              '0 0 0 rgba(0, 0, 0, 0)'
            ]
          }}
          transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
        >
          <CheckCircle2 size={16} className="text-green-500" />
        </motion.div>
      </div>
    )
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email Campaigns",
    description: "Create, send, and track beautiful email campaigns with our powerful editor.",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* Email diagram */}
        <motion.div 
          className={`absolute left-6 top-2 w-12 h-10 rounded-md ${isDark ? 'bg-blue-600/40' : 'bg-blue-500/20'} border ${isDark ? 'border-blue-500/40' : 'border-blue-400/40'} flex items-center justify-center`}
          animate={{ 
            y: [0, -3, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <div className={`w-8 h-1 mb-1 rounded-sm ${isDark ? 'bg-blue-500/60' : 'bg-blue-600/40'}`} />
          <div className={`w-6 h-1 mb-1 rounded-sm ${isDark ? 'bg-blue-500/60' : 'bg-blue-600/40'}`} />
          <div className={`w-7 h-1 rounded-sm ${isDark ? 'bg-blue-500/60' : 'bg-blue-600/40'}`} />
        </motion.div>
        
        {/* Send animation */}
        <motion.div
          className="absolute left-[4.5rem] top-5"
          animate={{ 
            x: [0, 40, 80],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        >
          <div className={`w-5 h-0.5 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
          <div className={`w-2 h-2 ${isDark ? 'border-blue-400' : 'border-blue-500'} border-t border-r transform rotate-45 -mt-1 ml-3`} />
        </motion.div>
        
        {/* Recipient */}
        <motion.div 
          className={`absolute right-6 top-2 w-10 h-10 rounded-full overflow-hidden border-2 ${isDark ? 'border-blue-600/60' : 'border-blue-500/40'}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1, 0.8],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.5, delay: 1.5 }}
        >
          <div className={`absolute inset-0 ${isDark ? 'bg-blue-700/40' : 'bg-blue-300/40'}`} />
          <div className={`absolute bottom-0 w-full h-4 ${isDark ? 'bg-blue-600/60' : 'bg-blue-500/40'}`} />
          <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full ${isDark ? 'bg-blue-500/80' : 'bg-blue-600/40'}`} />
        </motion.div>
      </div>
    )
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "SMS & WhatsApp",
    description: "Reach your customers through SMS and WhatsApp with personalized messages.",
    color: "text-green-500",
    bgColor: "bg-green-500",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* Phone */}
        <motion.div 
          className={`absolute left-6 top-2 w-8 h-12 rounded-lg ${isDark ? 'bg-green-900/40' : 'bg-green-700/20'} border ${isDark ? 'border-green-600/40' : 'border-green-500/40'}`}
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 rounded-sm ${isDark ? 'bg-green-400/80' : 'bg-green-500/70'}`} />
          <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${isDark ? 'border border-green-400/80' : 'border border-green-500/70'}`} />
        </motion.div>
        
        {/* Message bubbles */}
        <motion.div
          className={`absolute left-[4.5rem] top-2 w-6 h-4 rounded-md ${isDark ? 'bg-green-500/40' : 'bg-green-500/30'}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 1],
            opacity: [0, 1, 1],
            y: [0, 0, -5]
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        />
        
        <motion.div
          className={`absolute left-[6rem] top-4 w-8 h-5 rounded-md ${isDark ? 'bg-green-400/60' : 'bg-green-600/30'}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 1],
            opacity: [0, 1, 1],
            y: [0, 0, -8]
          }}
          transition={{ duration: 2, delay: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        />
        
        <motion.div
          className={`absolute left-[7.5rem] top-6 w-7 h-4 rounded-md ${isDark ? 'bg-green-300/40' : 'bg-green-400/30'}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 1],
            opacity: [0, 1, 1],
            y: [0, 0, -10]
          }}
          transition={{ duration: 2, delay: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        />
        
        {/* WhatsApp logo */}
        <motion.div 
          className={`absolute right-6 top-3 w-10 h-10 rounded-full ${isDark ? 'bg-green-700/40' : 'bg-green-600/20'} flex items-center justify-center`}
          animate={{ 
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          <MessageSquare size={18} className="text-green-400" />
        </motion.div>
      </div>
    )
  },
  {
    icon: <SlidersHorizontal className="h-6 w-6" />,
    title: "Audience Segmentation",
    description: "Segment your audience based on behavior, demographics, and engagement.",
    color: "text-amber-500",
    bgColor: "bg-amber-500",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* User groups */}
        <div className="absolute inset-0 flex items-center justify-around">
          {/* Group 1 */}
          <motion.div
            className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
          >
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-amber-700/30' : 'bg-amber-500/20'} flex items-center justify-center`}>
              <Users size={16} className="text-amber-500" />
            </div>
            <motion.div 
              className={`absolute top-0 right-0 w-4 h-4 rounded-full ${isDark ? 'bg-blue-600/60' : 'bg-blue-500/40'} flex items-center justify-center text-[8px] font-bold ${isDark ? 'text-blue-200' : 'text-white'}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
            >
              A
            </motion.div>
          </motion.div>
          
          {/* Group 2 */}
          <motion.div
            className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, delay: 0.3, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
          >
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-amber-700/30' : 'bg-amber-500/20'} flex items-center justify-center`}>
              <Users size={16} className="text-amber-500" />
            </div>
            <motion.div 
              className={`absolute top-0 right-0 w-4 h-4 rounded-full ${isDark ? 'bg-green-600/60' : 'bg-green-500/40'} flex items-center justify-center text-[8px] font-bold ${isDark ? 'text-green-200' : 'text-white'}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.3, repeat: Number.POSITIVE_INFINITY }}
            >
              B
            </motion.div>
          </motion.div>
          
          {/* Group 3 */}
          <motion.div
            className="relative"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: 'reverse' }}
          >
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-amber-700/30' : 'bg-amber-500/20'} flex items-center justify-center`}>
              <Users size={16} className="text-amber-500" />
            </div>
            <motion.div 
              className={`absolute top-0 right-0 w-4 h-4 rounded-full ${isDark ? 'bg-purple-600/60' : 'bg-purple-500/40'} flex items-center justify-center text-[8px] font-bold ${isDark ? 'text-purple-200' : 'text-white'}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.6, repeat: Number.POSITIVE_INFINITY }}
            >
              C
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Advanced Analytics",
    description: "Gain insights with real-time analytics and detailed campaign reports.",
    color: "text-purple-500",
    bgColor: "bg-purple-500",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* Analytics chart */}
        <div className="absolute inset-x-4 inset-y-2 flex items-end justify-around">
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-purple-500/70' : 'bg-purple-600/50'}`}
            animate={{ height: [10, 20, 10] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-blue-500/70' : 'bg-blue-600/50'}`}
            animate={{ height: [15, 8, 15] }}
            transition={{ duration: 2, delay: 0.2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-green-500/70' : 'bg-green-600/50'}`}
            animate={{ height: [5, 15, 5] }}
            transition={{ duration: 2, delay: 0.4, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-amber-500/70' : 'bg-amber-600/50'}`}
            animate={{ height: [12, 18, 12] }}
            transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-red-500/70' : 'bg-red-600/50'}`}
            animate={{ height: [8, 14, 8] }}
            transition={{ duration: 2, delay: 0.8, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`w-3 rounded-t-sm ${isDark ? 'bg-indigo-500/70' : 'bg-indigo-600/50'}`}
            animate={{ height: [18, 10, 18] }}
            transition={{ duration: 2, delay: 1, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
        
        {/* Line graph overlay */}
        <motion.svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 50" 
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,50 C20,40 30,10 50,20 C70,30 80,0 100,10"
            fill="none"
            stroke={isDark ? "#a78bfa" : "#8b5cf6"}
            strokeWidth="1"
            strokeDasharray="100"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.circle 
            cx="0" cy="50" r="1.5" 
            fill={isDark ? "#a78bfa" : "#8b5cf6"} 
            animate={{ cx: [0, 50, 100], cy: [50, 20, 10] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.svg>
      </div>
    )
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Mobile Optimization",
    description: "All campaigns are automatically optimized for mobile devices.",
    color: "text-rose-500",
    bgColor: "bg-rose-500",
    diagram: (isDark: boolean) => (
      <div className="relative h-16 w-full mb-6">
        {/* Phone device */}
        <motion.div 
          className={`absolute left-1/2 top-1 -translate-x-1/2 w-8 h-14 rounded-xl ${isDark ? 'bg-rose-900/40' : 'bg-rose-700/20'} border ${isDark ? 'border-rose-600/40' : 'border-rose-500/40'} overflow-hidden`}
          animate={{ 
            rotate: [-3, 3, -3],
            y: [0, -2, 0] 
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          {/* Screen */}
          <div className={`absolute inset-x-0.5 top-0.5 h-2 rounded-t-sm ${isDark ? 'bg-rose-500/50' : 'bg-rose-400/50'}`} />
          
          {/* Content blocks animating */}
          <motion.div 
            className={`absolute inset-x-0.5 top-3 h-1 ${isDark ? 'bg-rose-500/80' : 'bg-rose-600/50'}`}
            animate={{ width: ['60%', '80%', '60%'] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`absolute inset-x-0.5 top-5 h-1 ${isDark ? 'bg-rose-400/60' : 'bg-rose-500/40'}`}
            animate={{ width: ['40%', '70%', '40%'] }}
            transition={{ duration: 2, delay: 0.3, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`absolute inset-x-0.5 top-7 h-3 ${isDark ? 'bg-rose-500/40' : 'bg-rose-300/40'}`}
            animate={{ width: ['80%', '60%', '80%'] }}
            transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY }}
          />
          
          {/* Home button */}
          <div className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-2 h-0.5 rounded-sm ${isDark ? 'bg-rose-400/70' : 'bg-rose-500/70'}`} />
        </motion.div>
        
        {/* Optimization rays */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <motion.div 
            className={`absolute h-0.5 w-10 ${isDark ? 'bg-rose-500/40' : 'bg-rose-500/30'} rounded-full`}
            style={{ transformOrigin: 'center' }}
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`absolute h-0.5 w-10 ${isDark ? 'bg-rose-500/40' : 'bg-rose-500/30'} rounded-full`}
            style={{ transform: 'rotate(45deg)', transformOrigin: 'center' }}
            animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, delay: 0.3, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`absolute h-0.5 w-10 ${isDark ? 'bg-rose-500/40' : 'bg-rose-500/30'} rounded-full`}
            style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, delay: 0.6, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div 
            className={`absolute h-0.5 w-10 ${isDark ? 'bg-rose-500/40' : 'bg-rose-500/30'} rounded-full`}
            style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }}
            animate={{ scale: [0.9, 1.3, 0.9], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, delay: 0.9, repeat: Number.POSITIVE_INFINITY }}
          />
        </motion.div>
      </div>
    )
  },
];

// Stats with animated counters
const stats = [
  { value: 6000, suffix: "+", label: "Nigerian Businesses", color: "text-primary" },
  { value: 15, suffix: "M+", label: "Messages Sent Monthly", color: "text-blue-500" },
  { value: 32, suffix: "%", label: "Avg. Conversion Increase", color: "text-green-500" },
  { value: 99.9, suffix: "%", label: "Uptime Reliability", color: "text-purple-500" },
];

// Animated counter component
function Counter({ value, suffix, duration = 2 }: { value: number, suffix: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (inView) {
      let startTimestamp: number;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        const currentCount = Math.floor(progress * value);
        
        setCount(currentCount);
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(value);
        }
      };
      
      window.requestAnimationFrame(step);
    }
  }, [inView, value, duration]);
  
  return (
    <span ref={nodeRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Feature card component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  color, 
  bgColor,
  diagram,
  index 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  bgColor?: string;
  diagram?: (isDark: boolean) => React.ReactNode;
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px 0px" });
  
  // Mount state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use consistent classes during initial render to avoid hydration mismatch
  const cardClasses = !mounted 
    ? "relative p-6 rounded-xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 shadow-md shadow-slate-200/50 dark:shadow-none overflow-hidden group"
    : `relative p-6 rounded-xl ${
        isDark 
          ? 'bg-slate-900/50 backdrop-blur-sm border border-slate-800/60' 
          : 'bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md shadow-slate-200/50'
      } overflow-hidden group`;
      
  const titleClasses = !mounted
    ? "text-lg font-medium mb-2 text-slate-900 dark:text-white"
    : `text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`;
    
  const descriptionClasses = !mounted
    ? "text-slate-600 dark:text-slate-400"
    : `${isDark ? 'text-slate-400' : 'text-slate-600'}`;
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cardClasses}
    >
      {/* Background glow */}
      <motion.div 
        className={`absolute -right-10 -top-10 w-40 h-40 opacity-20 rounded-full blur-3xl transition-opacity duration-300 ${bgColor || ''}`}
        initial={{ opacity: 0.1 }}
        whileHover={{ opacity: 0.25 }}
      />
      
      {/* Icon container */}
      <div className={`relative flex justify-center mb-2 ${
        diagram ? '' : 'w-12 h-12 rounded-full flex items-center justify-center mb-4'
      } ${
        !diagram && !mounted ? `${color} bg-opacity-10 dark:bg-opacity-20` : ''
      } ${
        !diagram && mounted && !isDark ? `${color} bg-opacity-10` : ''
      } ${
        !diagram && mounted && isDark ? `${color} bg-opacity-20` : ''
      } ${
        !diagram ? 'bg-current' : ''
      }`}>
        {diagram && mounted ? diagram(isDark) : 
         diagram && !mounted ? <div className="h-16 w-full mb-6"></div> : <span className={color}>{icon}</span>}
      </div>
      
      <h3 className={titleClasses}>
        {title}
      </h3>
      
      <p className={descriptionClasses}>
        {description}
      </p>
      
      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl transition-colors duration-300 group-hover:bg-primary/5 pointer-events-none" />
    </motion.div>
  );
}

// Feature group card component
function FeatureGroupCard({
  title,
  description,
  icon,
  color,
  bgColor,
  features,
  index
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  features: { text: string; icon: React.ReactNode }[];
  index: number;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px 0px" });
  
  // Mount effect to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use consistent classes during initial render
  const cardClasses = !mounted
    ? "relative overflow-hidden p-6 rounded-xl bg-white/90 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 shadow-lg shadow-slate-200/50 dark:shadow-none"
    : `relative overflow-hidden p-6 rounded-xl ${
        isDark 
          ? 'bg-slate-900/50 backdrop-blur-sm border border-slate-800/60' 
          : 'bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg shadow-slate-200/50'
      }`;
    
  const titleClasses = !mounted
    ? "text-xl font-bold mb-3 text-slate-900 dark:text-white"
    : `text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`;
    
  const descriptionClasses = !mounted
    ? "mb-6 text-slate-600 dark:text-slate-400"
    : `mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`;
    
  const featureItemClasses = !mounted
    ? "flex items-center gap-2 text-slate-700 dark:text-slate-300"
    : `flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cardClasses}
    >
      {/* Background gradient effect */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 blur-3xl ${bgColor}`}></div>
      
      {/* Icon with vibrant background */}
      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
        !mounted ? `${bgColor} bg-opacity-10 dark:bg-opacity-20` :
        isDark ? `${bgColor} bg-opacity-20` : `${bgColor} bg-opacity-10`
      }`}>
        <span className={color}>{icon}</span>
        {mounted && (
          <motion.div 
            className={`absolute inset-0 rounded-2xl ${bgColor} opacity-0`}
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ 
              duration: 3, 
              repeat: Number.POSITIVE_INFINITY, 
              repeatType: "reverse", 
              ease: "easeInOut" 
            }}
          />
        )}
      </div>
      
      <h3 className={titleClasses}>
        {title}
      </h3>
      
      <p className={descriptionClasses}>
        {description}
      </p>
      
      {/* Feature bullets */}
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ duration: 0.4, delay: index * 0.2 + 0.3 + (i * 0.1) }}
            className={featureItemClasses}
          >
            <span className={color}>{feature.icon}</span>
            <span>{feature.text}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function FeaturesSection() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = theme === 'dark' || resolvedTheme === 'dark';
  const settings = getOptimizedSettings();
  
  // Mounting check to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Refs for animation targets
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const workflowDemoRef = useRef<HTMLDivElement>(null);
  
  // Animation on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.98, 1, 1, 0.98]);
  
  // Replace GSAP animations with Framer Motion
  const headingInView = useInView(headingRef, { once: true, margin: "-100px" });
  const subheadingInView = useInView(subheadingRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  
  // Use a base class to avoid hydration issues
  const baseClasses = "relative py-20 overflow-hidden";
  
  return (
    <section
      ref={sectionRef}
      className={`${baseClasses} ${
        !mounted ? "bg-background border-y border-slate-200/60 dark:border-slate-800/60" : 
        isDark ? 'bg-background border-y border-slate-800/60' : 'bg-slate-50 border-y border-slate-200/60'
      }`}
      id="features"
    >
      <div className="container px-4 sm:px-6 mx-auto">
        {/* Heading and Subheading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            ref={headingRef}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${
              !mounted ? "text-foreground" : (isDark ? 'text-white' : 'text-slate-900')
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={headingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Marketing Automation for <span className="text-primary">Nigerian</span> Businesses
          </motion.h2>
          
          <motion.p 
            ref={subheadingRef}
            className={`text-lg ${!mounted ? "text-muted-foreground" : (isDark ? 'text-slate-400' : 'text-slate-600')}`}
            initial={{ opacity: 0, y: 20 }}
            animate={subheadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Create personalized marketing experiences across multiple channels with our all-in-one platform.
          </motion.p>
          
          {/* Animated Stats */}
          <motion.div 
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl md:text-3xl font-bold mb-1 ${stat.color}`}>
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className={`text-sm ${!mounted ? "text-muted-foreground" : (isDark ? 'text-slate-500' : 'text-slate-600')}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Feature Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {featureGroups.map((group, index) => (
            <FeatureGroupCard 
              key={group.id}
              title={group.title}
              description={group.description}
              icon={group.icon}
              color={group.color}
              bgColor={group.bgColor}
              features={group.features}
              index={index}
            />
          ))}
        </div>

        {/* Individual Feature Grid */}
        <div className="relative mb-16">
          {mounted ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className={`absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 blur-3xl ${
                  isDark ? 'bg-primary/30' : 'bg-primary/10'
                }`}
              />
              
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className={`absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-20 blur-3xl ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                }`}
              />
            </>
          ) : (
            <>
              {/* Static placeholders during SSR */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-0 blur-3xl bg-primary/10 dark:bg-primary/30" />
              <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-0 blur-3xl bg-blue-500/10 dark:bg-blue-500/20" />
            </>
          )}
          
          <h3 className={`text-2xl font-bold text-center mb-10 ${
            !mounted ? 'text-slate-800 dark:text-white' : (isDark ? 'text-white' : 'text-slate-800')
          }`}>
            All the Features You Need
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
        
        {/* Workflow Builder Demonstration */}
        <motion.div
          ref={workflowDemoRef}
          className="relative"
          style={{ opacity, scale }}
        >
          <div className="text-center mb-10">
            <h3 className={`text-2xl font-bold mb-4 ${
              !mounted ? 'text-slate-900 dark:text-white' : (isDark ? 'text-white' : 'text-slate-900')
            }`}>
              Try Our Workflow Builder
            </h3>
            <p className={`max-w-2xl mx-auto ${
              !mounted ? 'text-slate-600 dark:text-slate-400' : (isDark ? 'text-slate-400' : 'text-slate-600')
            }`}>
              Drag, drop, and connect nodes to create sophisticated marketing automations without writing code.
            </p>
          </div>
          
          <WorkflowDemo />
          
          <div className={`mt-10 text-center ${
            !mounted ? 'text-primary-600 dark:text-primary-400' : (isDark ? 'text-primary-400' : 'text-primary-600')
          } font-medium flex items-center justify-center gap-1`}>
            <Users className="h-4 w-4" />
            <span>17,342 workflows created by Nigerian businesses</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 