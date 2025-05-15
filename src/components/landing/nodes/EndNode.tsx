"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

function EndNode({ data, isConnectable }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[100px] ${
        isDark
          ? 'bg-slate-900/80 border-slate-800/70 text-slate-300'
          : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center justify-center gap-2">
        <div className={`p-1.5 rounded-full ${
          isDark ? 'bg-slate-800/90' : 'bg-slate-200'
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
          isDark ? 'bg-slate-400 border-slate-600' : 'bg-slate-500 border-slate-600'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Success animation */}
      <motion.div 
        className={`absolute inset-0 rounded-lg opacity-0 ${
          isDark ? 'bg-green-500/20' : 'bg-green-500/10'
        }`}
        animate={{ 
          opacity: [0, 0.5, 0],
          scale: [0.85, 1, 0.85]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      />
    </motion.div>
  );
}

export default memo(EndNode); 