"use client";

import { useState } from "react";
import { Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulletListBlockProps {
  content: {
    items: string[];
  };
  properties: {
    bulletColor: string;
    textColor: string;
    fontSize: string;
    padding: string;
  };
  onUpdateContent: (newContent: any) => void;
  isSelected: boolean;
}

export default function BulletListBlock({
  content,
  properties,
  onUpdateContent,
  isSelected
}: BulletListBlockProps) {
  const [editMode, setEditMode] = useState(false);

  // Update an item's text
  const updateItem = (index: number, value: string) => {
    const newItems = [...content.items];
    newItems[index] = value;
    onUpdateContent({ items: newItems });
  };

  // Add a new item
  const addItem = () => {
    const newItems = [...content.items, "New item"];
    onUpdateContent({ items: newItems });
  };

  // Remove an item
  const removeItem = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index);
    onUpdateContent({ items: newItems });
  };

  // Inline styles for the list items
  const listStyle = {
    color: properties.textColor,
    fontSize: properties.fontSize,
    padding: properties.padding,
  };

  const bulletStyle = {
    color: properties.bulletColor,
    fontSize: properties.fontSize,
  };

  // If in edit mode, show editable inputs
  if (editMode && isSelected) {
    return (
      <div className="relative p-2" style={listStyle}>
        <div className="absolute right-2 top-2 flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditMode(false)}
          >
            Done
          </Button>
        </div>
        <ul className="ml-6 space-y-2 pt-8">
          {content.items.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2" style={bulletStyle}>•</span>
              <div className="flex flex-1 items-center">
                <Input
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  className="ml-2"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          <li>
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
              className="ml-6 mt-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </li>
        </ul>
      </div>
    );
  }

  // Regular display mode
  return (
    <div
      className="relative p-2"
      style={listStyle}
      onClick={() => isSelected && setEditMode(true)}
    >
      <ul className="ml-6 list-disc">
        {content.items.map((item, index) => (
          <li key={index} style={{ listStyleType: "none" }}>
            <span className="mr-2" style={bulletStyle}>•</span>
            {item}
          </li>
        ))}
      </ul>
      {isSelected && !editMode && (
        <div className="absolute right-2 top-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditMode(true)}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
