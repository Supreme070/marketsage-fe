"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Mail,
  MessageSquare,
  Clock,
  Tag,
  Users,
  Zap,
  SendHorizontal,
} from "lucide-react";

export const ActionNode = memo(
  ({ data, selected, id }: NodeProps) => {
    // Icon mapping
    const getIcon = (iconName: string) => {
      switch (iconName) {
        case "Mail":
          return <Mail className="h-5 w-5" />;
        case "MessageSquare":
          return <MessageSquare className="h-5 w-5" />;
        case "SendHorizontal":
          return <SendHorizontal className="h-5 w-5" />;
        case "Clock":
          return <Clock className="h-5 w-5" />;
        case "Users":
          return <Users className="h-5 w-5" />;
        case "Tag":
          return <Tag className="h-5 w-5" />;
        case "Zap":
          return <Zap className="h-5 w-5" />;
        default:
          return <Mail className="h-5 w-5" />;
      }
    };

    return (
      <div
        className={`rounded-md border-2 ${
          selected ? "border-blue-500/70 shadow-md" : "border-blue-500/40"
        } bg-background p-0 transition-colors`}
        style={{ width: 200 }}
      >
        {/* Node header */}
        <div className="flex items-center rounded-t-sm bg-blue-500/10 p-2">
          <div className="mr-2 rounded-full bg-blue-500/20 p-1.5">
            {getIcon(data.icon)}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{data.label}</div>
            <div className="text-xs text-muted-foreground">Action</div>
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
          id="b"
          className="h-3 w-3 border-2 border-blue-500 bg-background"
        />

        {/* Source handle on the right side */}
        <Handle
          type="source"
          position={Position.Right}
          id="a"
          className="h-3 w-3 border-2 border-blue-500 bg-background"
        />
      </div>
    );
  }
);
