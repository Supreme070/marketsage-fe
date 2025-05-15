"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { CheckCircle, XCircle } from 'lucide-react';

function ConditionNode({ data, isConnectable }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-blue-950/60 border-blue-800/50 text-blue-400'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-blue-900/60' : 'bg-blue-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Path options */}
      <div className="mt-2 flex justify-between text-xs">
        <div className="flex items-center">
          <CheckCircle size={12} className="mr-1 text-green-500" />
          <span>Yes</span>
        </div>
        <div className="flex items-center">
          <XCircle size={12} className="mr-1 text-amber-500" />
          <span>No</span>
        </div>
      </div>
      
      {/* Input handle - top */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-blue-400 border-blue-600' : 'bg-blue-500 border-blue-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle - bottom left (Yes) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className={`w-3 h-3 border-2 left-[25%] ${
          isDark ? 'bg-green-400 border-green-600' : 'bg-green-500 border-green-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle - bottom right (No) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className={`w-3 h-3 border-2 left-[75%] ${
          isDark ? 'bg-amber-400 border-amber-600' : 'bg-amber-500 border-amber-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Thinking animation */}
      <div className="absolute -top-1 left-0 right-0 h-1 rounded-t-lg overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-[length:200%_100%]"
          animate={{
            backgroundPosition: ["0% center", "100% center", "0% center"],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />
      </div>
    </motion.div>
  );
}

export default memo(ConditionNode); 