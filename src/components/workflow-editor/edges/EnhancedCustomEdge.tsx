"use client";

import { memo, useState, useEffect } from "react";
import { getBezierPath, type EdgeProps, getSmoothStepPath } from "reactflow";

export const EnhancedCustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    label,
    animated = false,
  }: EdgeProps) => {
    const [animationOffset, setAnimationOffset] = useState(0);

    // Animation for edge flow
    useEffect(() => {
      if (animated) {
        const interval = setInterval(() => {
          setAnimationOffset(prev => (prev + 1) % 20);
        }, 100);
        return () => clearInterval(interval);
      }
    }, [animated]);

    // Enhanced smooth step path with better curvature
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 20,
      offset: 40,
    });

    // Enhanced edge type detection
    const isConditionalEdge = id.includes("condition") || 
      (data && data.isConditional) || 
      label === "Yes" || label === "No" || label === "True" || label === "False";

    const isPositivePath = label === "Yes" || label === "True" || id.includes("true") || id.includes("yes");
    const isNegativePath = label === "No" || label === "False" || id.includes("false") || id.includes("no");

    // Enhanced color scheme with gradients
    const getEdgeStyle = () => {
      if (isConditionalEdge) {
        if (isPositivePath) {
          return {
            stroke: "#10b981",
            gradient: "url(#positiveGradient)",
            glowColor: "#10b981",
            labelBg: "rgba(16, 185, 129, 0.1)",
            labelBorder: "#10b981",
          };
        } else if (isNegativePath) {
          return {
            stroke: "#ef4444",
            gradient: "url(#negativeGradient)",
            glowColor: "#ef4444",
            labelBg: "rgba(239, 68, 68, 0.1)",
            labelBorder: "#ef4444",
          };
        } else {
          return {
            stroke: "#f97316",
            gradient: "url(#conditionalGradient)",
            glowColor: "#f97316",
            labelBg: "rgba(249, 115, 22, 0.1)",
            labelBorder: "#f97316",
          };
        }
      }
      
      return {
        stroke: "#3b82f6",
        gradient: "url(#defaultGradient)",
        glowColor: "#3b82f6",
        labelBg: "rgba(59, 130, 246, 0.1)",
        labelBorder: "#3b82f6",
      };
    };

    const edgeStyle = getEdgeStyle();

    return (
      <g>
        {/* Enhanced gradient definitions */}
        <defs>
          {/* Positive path gradient */}
          <linearGradient id="positiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: "#34d399", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#10b981", stopOpacity: 0.8 }} />
          </linearGradient>
          
          {/* Negative path gradient */}
          <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#ef4444", stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: "#f87171", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#ef4444", stopOpacity: 0.8 }} />
          </linearGradient>
          
          {/* Conditional path gradient */}
          <linearGradient id="conditionalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#f97316", stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: "#fb923c", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#f97316", stopOpacity: 0.8 }} />
          </linearGradient>
          
          {/* Default path gradient */}
          <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: "#60a5fa", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#3b82f6", stopOpacity: 0.8 }} />
          </linearGradient>

          {/* Animated dash pattern */}
          <pattern
            id={`animatedDash-${id}`}
            patternUnits="userSpaceOnUse"
            width="20"
            height="2"
          >
            <rect width="20" height="2" fill="none" />
            <rect
              x={animationOffset}
              y="0"
              width="10"
              height="2"
              fill={edgeStyle.glowColor}
              opacity="0.6"
            />
          </pattern>

          {/* Glow filter */}
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background glow effect */}
        <path
          d={edgePath}
          style={{
            strokeWidth: 6,
            stroke: edgeStyle.glowColor,
            opacity: 0.2,
            filter: `url(#glow-${id})`,
          }}
          className="react-flow__edge-path"
        />

        {/* Main edge path with enhanced styling */}
        <path
          id={id}
          style={{
            strokeWidth: 3,
            stroke: edgeStyle.gradient,
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            ...style,
          }}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={markerEnd}
        />

        {/* Animated overlay for active edges */}
        {animated && (
          <path
            d={edgePath}
            style={{
              strokeWidth: 3,
              stroke: `url(#animatedDash-${id})`,
              fill: "none",
              strokeLinecap: "round",
            }}
            className="react-flow__edge-path"
          />
        )}

        {/* Enhanced edge label with modern styling */}
        {label && (
          <g transform={`translate(${labelX - 30}, ${labelY - 12})`}>
            {/* Background with glassmorphism effect */}
            <rect
              width="60"
              height="24"
              rx="12"
              fill={edgeStyle.labelBg}
              stroke={edgeStyle.labelBorder}
              strokeWidth="1"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
            
            {/* Gradient overlay */}
            <rect
              width="60"
              height="24"
              rx="12"
              fill="url(#labelOverlay)"
              opacity="0.1"
            />
            
            {/* Label text with enhanced typography */}
            <text
              x="30"
              y="15"
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize="11"
              fontWeight="600"
              fill="currentColor"
              className="text-foreground"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
            >
              {label}
            </text>

            {/* Status indicator dot */}
            {isPositivePath && (
              <circle
                cx="12"
                cy="8"
                r="3"
                fill="#10b981"
                opacity="0.8"
              />
            )}
            {isNegativePath && (
              <circle
                cx="12"
                cy="8"
                r="3"
                fill="#ef4444"
                opacity="0.8"
              />
            )}
          </g>
        )}

        {/* Enhanced arrow marker for better visibility */}
        <defs>
          <marker
            id={`enhanced-arrow-${id}`}
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={edgeStyle.stroke}
              stroke={edgeStyle.stroke}
              strokeWidth="1"
            />
          </marker>
        </defs>
      </g>
    );
  }
);

EnhancedCustomEdge.displayName = "EnhancedCustomEdge";