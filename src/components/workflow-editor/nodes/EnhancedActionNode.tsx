"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Clock,
  MessageSquare,
  Tag,
  HelpCircle,
  Users,
  ArrowDownToLine,
  Zap,
  SendHorizontal,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";

export const EnhancedActionNode = memo(
  ({ data, selected, id }: NodeProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Icon mapping with enhanced visual hierarchy
    const getIcon = (iconName: string) => {
      const iconMap = {
        Mail: <Mail className="h-5 w-5" />,
        Clock: <Clock className="h-5 w-5" />,
        MessageSquare: <MessageSquare className="h-5 w-5" />,
        SendHorizontal: <SendHorizontal className="h-5 w-5" />,
        Tag: <Tag className="h-5 w-5" />,
        Users: <Users className="h-5 w-5" />,
        ArrowDownToLine: <ArrowDownToLine className="h-5 w-5" />,
        Zap: <Zap className="h-5 w-5" />,
      };
      return iconMap[iconName as keyof typeof iconMap] || <Mail className="h-5 w-5" />;
    };
    
    // Enhanced action details with better formatting
    const getActionDetails = () => {
      const props = data.properties || {};
      
      const actionMap = {
        "Send Email": `📧 ${props.templateName || props.subject || 'Untitled Email'}`,
        "Send SMS": `💬 ${props.templateName || 'Untitled SMS'}`,
        "Send WhatsApp": `💚 ${props.templateName || 'Untitled WhatsApp'}`,
        "Wait": `⏱️ Wait ${props.waitAmount || 1} ${props.waitUnit || 'days'}`,
        "Add tag": `🏷️ Add "${props.tagName || 'Untitled'}" tag`,
      };
      
      return actionMap[data.label as keyof typeof actionMap] || data.description;
    };

    // Modern gradient styling based on action type
    const getNodeStyling = () => {
      const styleMap = {
        email: {
          gradient: "from-blue-500/20 via-cyan-500/10 to-blue-600/20",
          border: "border-blue-400/50",
          selectedBorder: "border-blue-500",
          header: "from-blue-500 to-cyan-600",
          glow: "shadow-blue-500/25",
        },
        sms: {
          gradient: "from-green-500/20 via-emerald-500/10 to-green-600/20",
          border: "border-green-400/50",
          selectedBorder: "border-green-500",
          header: "from-green-500 to-emerald-600",
          glow: "shadow-green-500/25",
        },
        wait: {
          gradient: "from-purple-500/20 via-violet-500/10 to-purple-600/20",
          border: "border-purple-400/50",
          selectedBorder: "border-purple-500",
          header: "from-purple-500 to-violet-600",
          glow: "shadow-purple-500/25",
        },
        tag: {
          gradient: "from-orange-500/20 via-amber-500/10 to-orange-600/20",
          border: "border-orange-400/50",
          selectedBorder: "border-orange-500",
          header: "from-orange-500 to-amber-600",
          glow: "shadow-orange-500/25",
        },
      };
      
      if (data.label.includes("Email")) return styleMap.email;
      if (data.label.includes("SMS") || data.label.includes("WhatsApp")) return styleMap.sms;
      if (data.label.includes("Wait")) return styleMap.wait;
      if (data.label.includes("tag")) return styleMap.tag;
      return styleMap.email;
    };

    const styling = getNodeStyling();
    
    return (
      <motion.div
        className={`relative group cursor-pointer`}
        style={{ width: 240 }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {/* Enhanced backdrop with glassmorphism */}
        <div
          className={`
            rounded-xl border-2 backdrop-blur-sm
            bg-gradient-to-br ${styling.gradient}
            ${selected ? styling.selectedBorder : styling.border}
            ${selected ? `shadow-lg ${styling.glow}` : 'shadow-md'}
            transition-all duration-300 ease-in-out
            overflow-hidden
          `}
        >
          {/* Animated header with gradient */}
          <motion.div 
            className={`
              flex items-center justify-between p-3
              bg-gradient-to-r ${styling.header}
              text-white relative overflow-hidden
            `}
            whileHover={{ scale: 1.01 }}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000" />
            </div>
            
            <div className="flex items-center space-x-2 relative z-10">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {getIcon(data.icon)}
              </motion.div>
              <span className="font-semibold text-sm">{data.label}</span>
            </div>
            
            {/* Status indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative z-10"
            >
              {isProcessing ? (
                <PlayCircle className="h-4 w-4 animate-pulse" />
              ) : data.properties?.configured ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4 opacity-60" />
              )}
            </motion.div>
          </motion.div>

          {/* Enhanced content area */}
          <div className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="space-y-2">
              {/* Main description */}
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {data.description}
              </p>
              
              {/* Enhanced action details with better typography */}
              <AnimatePresence>
                {(showDetails || selected) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-2 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {getActionDetails()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Configuration status badge */}
              <div className="flex items-center justify-between">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${data.properties?.configured 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                  }
                `}>
                  {data.properties?.configured ? 'Configured' : 'Needs Setup'}
                </span>
                
                {/* Help indicator */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Enhanced connection handles */}
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 border-2 border-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${styling.header.split(' ')[1]}, ${styling.header.split(' ')[3]})`,
              left: -6,
            }}
          />
          
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 border-2 border-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${styling.header.split(' ')[1]}, ${styling.header.split(' ')[3]})`,
              right: -6,
            }}
          />
        </div>

        {/* Enhanced floating tooltip */}
        <AnimatePresence>
          {showDetails && !selected && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-50 w-full"
            >
              <div className="bg-black/90 backdrop-blur-sm text-white text-xs p-3 rounded-lg shadow-xl border border-white/10">
                <div className="space-y-1">
                  <p className="font-medium">{data.label}</p>
                  <p className="opacity-80">{getActionDetails()}</p>
                  <p className="opacity-60">Click to configure</p>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-black/90 border-l border-t border-white/10 transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

EnhancedActionNode.displayName = "EnhancedActionNode";