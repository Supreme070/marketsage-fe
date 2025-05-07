"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitBranch, Code } from "lucide-react";

export const ConditionNode = memo(
  ({ data, selected, id }: NodeProps) => {
    // Icon mapping
    const getIcon = (iconName: string) => {
      switch (iconName) {
        case "GitBranch":
          return <GitBranch className="h-5 w-5" />;
        case "Code":
          return <Code className="h-5 w-5" />;
        default:
          return <GitBranch className="h-5 w-5" />;
      }
    };

    // Determine if this is an If/Else condition node
    const isIfElse = data.label === "If/Else";

    return (
      <div
        className={`rounded-md border-2 ${
          selected ? "border-orange-500/70 shadow-md" : "border-orange-500/40"
        } bg-background p-0 transition-colors`}
        style={{ width: 200 }}
      >
        {/* Node header */}
        <div className="flex items-center rounded-t-sm bg-orange-500/10 p-2">
          <div className="mr-2 rounded-full bg-orange-500/20 p-1.5">
            {getIcon(data.icon)}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{data.label}</div>
            <div className="text-xs text-muted-foreground">Condition</div>
          </div>
        </div>

        {/* Node body with data */}
        <div className="p-2 text-xs text-muted-foreground">
          {data.description}
        </div>

        {/* Target handle on the left side */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="h-3 w-3 border-2 border-orange-500 bg-background"
        />

        {/* If/Else has two source handles - True and False */}
        {isIfElse ? (
          <>
            {/* True output - top right */}
            <div className="absolute -right-9 top-1/3 flex items-center">
              <div className="text-xs font-medium text-green-600">True</div>
              <Handle
                type="source"
                position={Position.Right}
                id="true"
                className="h-3 w-3 border-2 border-green-500 bg-background"
                style={{ top: "33%" }}
              />
            </div>

            {/* False output - bottom right */}
            <div className="absolute -right-10 bottom-1/3 flex items-center">
              <div className="text-xs font-medium text-red-600">False</div>
              <Handle
                type="source"
                position={Position.Right}
                id="false"
                className="h-3 w-3 border-2 border-red-500 bg-background"
                style={{ bottom: "33%" }}
              />
            </div>
          </>
        ) : (
          // For other condition nodes, just a single output
          <Handle
            type="source"
            position={Position.Right}
            id="source"
            className="h-3 w-3 border-2 border-orange-500 bg-background"
          />
        )}
      </div>
    );
  }
);
