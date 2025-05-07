"use client";

import { memo } from "react";
import { getBezierPath, type EdgeProps } from "reactflow";

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
    sourceHandleId,
    data,
  }: EdgeProps) => {
    // Edge path calculation
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    // Set color based on source handle for If/Else conditions
    let strokeColor = "#94a3b8"; // Default color

    if (sourceHandleId === "true") {
      strokeColor = "#22c55e"; // Green for true path
    } else if (sourceHandleId === "false") {
      strokeColor = "#ef4444"; // Red for false path
    }

    return (
      <g>
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={2}
          stroke={strokeColor}
          strokeDasharray={data?.dashed ? "5,5" : "none"}
          markerEnd={markerEnd}
        />
        <path
          d={edgePath}
          strokeWidth={12}
          stroke="transparent"
          fill="none"
          strokeLinecap="round"
          strokeOpacity={0}
        />
      </g>
    );
  }
);
