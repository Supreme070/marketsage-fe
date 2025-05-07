"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  List,
  TrendingUp,
  Tag,
  PlusCircle,
} from "lucide-react";

export const TriggerNode = memo(
  ({ data, selected, id }: NodeProps) => {
    // Icon mapping
    const getIcon = (iconName: string) => {
      switch (iconName) {
        case "List":
          return <List className="h-5 w-5" />;
        case "TrendingUp":
          return <TrendingUp className="h-5 w-5" />;
        case "Tag":
          return <Tag className="h-5 w-5" />;
        case "PlusCircle":
          return <PlusCircle className="h-5 w-5" />;
        default:
          return <List className="h-5 w-5" />;
      }
    };

    return (
      <div
        className={`rounded-md border-2 ${
          selected
            ? "border-primary/70 shadow-md"
            : "border-primary/40"
        } bg-background p-0 transition-colors`}
        style={{ width: 200 }}
      >
        {/* Node header */}
        <div className="flex items-center rounded-t-sm bg-primary/10 p-2">
          <div className="mr-2 rounded-full bg-primary/20 p-1.5">
            {getIcon(data.icon)}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{data.label}</div>
            <div className="text-xs text-muted-foreground">Trigger</div>
          </div>
        </div>

        {/* Node body with data */}
        <div className="p-2 text-xs text-muted-foreground">
          {data.description}
        </div>

        {/* Source handle on the right side */}
        <Handle
          type="source"
          position={Position.Right}
          id="a"
          className="h-3 w-3 border-2 border-primary bg-background"
        />
      </div>
    );
  }
);
