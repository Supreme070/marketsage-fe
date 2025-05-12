"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Mail,
  Clock,
  MessageSquare,
  Tag,
  HelpCircle,
  Users,
  ArrowDownToLine,
  Zap,
  SendHorizontal,
} from "lucide-react";

export const ActionNode = memo(
  ({ data, selected, id }: NodeProps) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Icon mapping
    const getIcon = (iconName: string) => {
      switch (iconName) {
        case "Mail":
          return <Mail className="h-5 w-5" />;
        case "Clock":
          return <Clock className="h-5 w-5" />;
        case "MessageSquare":
          return <MessageSquare className="h-5 w-5" />;
        case "SendHorizontal":
          return <SendHorizontal className="h-5 w-5" />;
        case "Tag":
          return <Tag className="h-5 w-5" />;
        case "Users":
          return <Users className="h-5 w-5" />;
        case "ArrowDownToLine":
          return <ArrowDownToLine className="h-5 w-5" />;
        case "Zap":
          return <Zap className="h-5 w-5" />;
        default:
          return <Mail className="h-5 w-5" />;
      }
    };
    
    // Get a formatted string describing the action
    const getActionDetails = () => {
      const props = data.properties || {};
      
      if (data.label === "Send Email") {
        return `Send email "${props.templateName || props.subject || 'Untitled'}"`;
      } else if (data.label === "Send SMS") {
        return `Send SMS "${props.templateName || 'Untitled'}"`;
      } else if (data.label === "Send WhatsApp") {
        return `Send WhatsApp message "${props.templateName || 'Untitled'}"`;
      } else if (data.label === "Wait") {
        return `Wait for ${props.waitAmount || 1} ${props.waitUnit || 'days'}`;
      } else if (data.label === "Add tag") {
        return `Add tag "${props.tagName || 'Untitled'}" to contact`;
      }
      
      return data.description;
    };

    // Get appropriate border color based on action type
    const getBorderColor = () => {
      if (data.label.includes("Email")) {
        return selected ? "border-blue-500" : "border-blue-300";
      } else if (data.label.includes("SMS") || data.label.includes("WhatsApp")) {
        return selected ? "border-green-500" : "border-green-300";
      } else if (data.label.includes("Wait")) {
        return selected ? "border-purple-500" : "border-purple-300";
      } else if (data.label.includes("tag")) {
        return selected ? "border-orange-500" : "border-orange-300";
      }
      return selected ? "border-blue-500" : "border-blue-300";
    };
    
    // Get header background color based on action type
    const getHeaderColor = () => {
      if (data.label.includes("Email")) {
        return "bg-blue-100";
      } else if (data.label.includes("SMS") || data.label.includes("WhatsApp")) {
        return "bg-green-100";
      } else if (data.label.includes("Wait")) {
        return "bg-purple-100";
      } else if (data.label.includes("tag")) {
        return "bg-orange-100";
      }
      return "bg-blue-100";
    };
    
    return (
      <div
        className={`rounded-md border-2 ${getBorderColor()} bg-background p-0 transition-colors relative group`}
        style={{ width: 200 }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        {/* Node header */}
        <div className={`flex items-center rounded-t-sm ${getHeaderColor()} p-2`}>
          <div className="mr-2 rounded-full bg-blue-200/70 p-1.5">
            {getIcon(data.icon)}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold">{data.label}</div>
            <div className="text-xs text-muted-foreground">Action</div>
          </div>
          
          <HelpCircle className="h-4 w-4 ml-auto text-muted-foreground/70" />
        </div>

        {/* Node body with data */}
        <div className="p-2 text-xs text-muted-foreground">
          {data.description}
        </div>
        
        {/* Details tooltip */}
        {showDetails && (
          <div className="absolute z-10 bg-popover border rounded-md shadow-md p-2 -top-14 left-0 text-xs w-full">
            <p className="font-semibold mb-1">Action Details:</p>
            <p>{getActionDetails()}</p>
          </div>
        )}

        {/* Source and target handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          className="h-3 w-3 border-2 border-blue-400 bg-background"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          className="h-3 w-3 border-2 border-blue-400 bg-background"
        />
      </div>
    );
  }
);
