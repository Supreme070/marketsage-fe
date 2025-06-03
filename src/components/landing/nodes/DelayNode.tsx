"use client";

import { memo, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Circle } from 'lucide-react';

function DelayNode({ data, isConnectable }: NodeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [progress, setProgress] = useState(0);
  
  // Animated progress simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 20;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <motion.div
      className={`rounded-lg border shadow-sm px-3 py-2 min-w-[120px] ${
        isDark
          ? 'bg-purple-950/60 border-purple-800/50 text-purple-400'
          : 'bg-purple-50 border-purple-200 text-purple-700'
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', y: -2 }}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${
          isDark ? 'bg-purple-900/60' : 'bg-purple-100'
        }`}>
          {data.icon}
        </div>
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* Timer visualization */}
      <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-purple-500"
          style={{ width: `${progress}%` }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      
      {/* Circular timer indicators */}
      <div className="flex justify-around mt-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Circle 
            key={index} 
            size={8} 
            className={
              progress >= (index + 1) * 20 
                ? "fill-purple-500 text-purple-500" 
                : "text-gray-300 dark:text-gray-600"
            } 
          />
        ))}
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-purple-400 border-purple-600' : 'bg-purple-500 border-purple-700'
        }`}
        isConnectable={isConnectable}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 ${
          isDark ? 'bg-purple-400 border-purple-600' : 'bg-purple-500 border-purple-700'
        }`}
        isConnectable={isConnectable}
      />
    </motion.div>
  );
}

export default memo(DelayNode); 