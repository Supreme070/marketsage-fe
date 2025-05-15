"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

function ActionNode({ data, isConnectable }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-primary-950/60 border-primary-800/50 text-primary-400'
          : 'bg-primary-50 border-primary-200 text-primary-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-primary-900/60' : 'bg-primary-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-primary-400 border-primary-600' : 'bg-primary-500 border-primary-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-primary-400 border-primary-600' : 'bg-primary-500 border-primary-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Progress indicator */}
      <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
}

export default memo(ActionNode); 