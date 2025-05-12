"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { GitBranch, Code, HelpCircle } from "lucide-react";

export const ConditionNode = memo(
  ({ data, selected, id }: NodeProps) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Helper function to render the condition details based on properties
    const getConditionDescription = () => {
      const props = data.properties || {};
      
      if (props.conditionType === 'contact') {
        return `IF contact.${props.contactProperty || 'property'} ${props.operator || '='} "${props.value || ''}"`;
      } else if (props.conditionType === 'tag') {
        return `IF contact has tag "${props.tagName || props.tagId || 'any'}"`;
      } else if (props.conditionType === 'email') {
        return `IF email ${props.property || 'was'} ${props.value ? 'true' : 'false'}`;
      } else if (props.customCondition) {
        return props.customCondition;
      }
      
      return "Condition logic";
    };

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
        } bg-background p-0 transition-colors relative`}
        style={{ width: 200 }}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
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
          
          <HelpCircle className="h-4 w-4 ml-auto text-muted-foreground/70" />
        </div>

        {/* Node body with data */}
        <div className="p-2 text-xs text-muted-foreground">
          {data.description}
        </div>
        
        {/* Details tooltip */}
        {showDetails && (
          <div className="absolute z-10 bg-popover border rounded-md shadow-md p-2 -top-14 left-0 text-xs w-full">
            <p className="font-semibold mb-1">Condition Logic:</p>
            <code className="text-xs bg-muted p-1 rounded block">
              {getConditionDescription()}
            </code>
          </div>
        )}

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
