"use client";

import { memo } from "react";
import { getBezierPath, EdgeProps, getSmoothStepPath } from "reactflow";

export const CustomEdge = memo(
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
  }: EdgeProps) => {
    // Use a step path instead of a bezier for better visual alignment
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });

    // Determine if this edge represents a conditional path
    const isConditionalEdge = id.includes("condition") || 
      (data && data.isConditional) || 
      (sourceX !== targetX && Math.abs(sourceY - targetY) > 50);

    // Check if this is a positive/negative condition path based on label or source handle
    const isPositivePath = label === "Yes" || label === "True" || id.includes("true");
    const isNegativePath = label === "No" || label === "False" || id.includes("false");

    // Set edge color based on edge type
    const edgeColor = isConditionalEdge 
      ? (isPositivePath ? "#10b981" : isNegativePath ? "#ef4444" : "#f97316")
      : "#3b82f6";

    return (
      <>
        <path
          id={id}
          style={{
            ...style,
            strokeWidth: 2,
            stroke: edgeColor,
          }}
          className="react-flow__edge-path"
          d={edgePath}
          markerEnd={markerEnd}
        />
        {/* Edge label with improved styling */}
        {label && (
          <g transform={`translate(${labelX - 20}, ${labelY - 10})`}>
            <rect
              width="40"
              height="20"
              rx="4"
              fill={isPositivePath ? "rgb(16 185 129 / 0.2)" : isNegativePath ? "rgb(239 68 68 / 0.2)" : "rgb(249 115 22 / 0.2)"}
              stroke={edgeColor}
              strokeWidth="1"
            />
            <text
              x="20"
              y="14"
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize="10"
              fill="currentColor"
              className="text-foreground"
            >
              {label}
            </text>
          </g>
        )}
      </>
    );
  }
);
