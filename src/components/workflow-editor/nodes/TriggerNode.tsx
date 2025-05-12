"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  List,
  TrendingUp,
  Tag,
  PlusCircle,
  Mail,
  Calendar,
  Link as LinkIcon,
  HelpCircle,
  Clock,
} from "lucide-react";

export const TriggerNode = memo(
  ({ data, selected, id }: NodeProps) => {
    const [showDetails, setShowDetails] = useState(false);
    
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
        case "Mail":
          return <Mail className="h-5 w-5" />;
        case "Calendar":
          return <Calendar className="h-5 w-5" />;
        case "Link":
          return <LinkIcon className="h-5 w-5" />;
        case "Clock":
          return <Clock className="h-5 w-5" />;
        default:
          return <List className="h-5 w-5" />;
      }
    };
    
    // Get a formatted string describing the trigger details
    const getTriggerDetails = () => {
      const props = data.properties || {};
      
      if (data.label === "Contact added to list") {
        return `When contact is added to "${props.listName || 'any list'}"`;
      } else if (data.label === "Tag added to contact") {
        return `When tag "${props.tagName || 'any tag'}" is added to contact`;
      } else if (data.label === "Email opened") {
        return `When contact opens email from "${props.campaignName || 'any campaign'}"`;
      } else if (data.label.includes("Link clicked")) {
        return `When contact clicks a link in email`;
      } else if (data.label.includes("Form")) {
        return `When a form is submitted`;
      } else if (data.label.includes("Scheduled")) {
        const frequency = props.frequency || 'once';
        if (frequency === 'recurring') {
          return `Trigger every ${props.interval || 1} ${props.unit || 'days'}`;
        } else {
          return `Trigger once at scheduled time`;
        }
      }
      
      return data.description;
    };

    return (
      <div
        className={`rounded-md border-2 ${
          selected
            ? "border-primary/70 shadow-md"
            : "border-primary/40"
        } bg-background p-0 transition-colors relative`}
        style={{ width: 200 }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
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
          
          <HelpCircle className="h-4 w-4 ml-auto text-muted-foreground/70" />
        </div>

        {/* Node body with data */}
        <div className="p-2 text-xs text-muted-foreground">
          {data.description}
        </div>
        
        {/* Details tooltip */}
        {showDetails && (
          <div className="absolute z-10 bg-popover border rounded-md shadow-md p-2 -top-14 left-0 text-xs w-full">
            <p className="font-semibold mb-1">Trigger Details:</p>
            <p>{getTriggerDetails()}</p>
          </div>
        )}

        {/* Source handle on the right side */}
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          className="h-3 w-3 border-2 border-primary bg-background"
        />
      </div>
    );
  }
);
