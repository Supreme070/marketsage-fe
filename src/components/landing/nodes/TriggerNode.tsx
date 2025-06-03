"use client";

import { memo, CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

function TriggerNode({ data, isConnectable }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-green-950/60 border-green-800/50 text-green-400'
          : 'bg-green-50 border-green-200 text-green-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-green-900/60' : 'bg-green-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-green-400 border-green-600' : 'bg-green-500 border-green-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Pulsing indicator */}
      <div className="absolute top-2 right-2 flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${
          isDark ? 'bg-green-400' : 'bg-green-500'
        } animate-ping absolute`}></span>
        <span className={`w-2 h-2 rounded-full ${
          isDark ? 'bg-green-400' : 'bg-green-500'
        } relative`}></span>
      </div>
    </motion.div>
  );
}

export default memo(TriggerNode); 