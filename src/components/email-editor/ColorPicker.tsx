"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  id: string;
  color: string;
  onChange: (color: string) => void;
}

const predefinedColors = [
  "#000000", // Black
  "#FFFFFF", // White
  "#6B7280", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

export default function ColorPicker({ id, color, onChange }: ColorPickerProps) {
  const [inputColor, setInputColor] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input color when color prop changes
  useEffect(() => {
    setInputColor(color);
  }, [color]);

  // Handle hex input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);

    // Validate if it's a proper hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  // Handle color picker change
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);
    onChange(value);
  };

  // Handle predefined color selection
  const handleColorSelection = (selectedColor: string) => {
    setInputColor(selectedColor);
    onChange(selectedColor);
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <div
        className="h-9 w-9 rounded-md border"
        style={{ backgroundColor: inputColor }}
      />
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={inputColor}
        onChange={handleInputChange}
        placeholder="#000000"
        className="flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="px-2">
            Pick
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="bottom" align="end">
          <div className="mb-2">
            <input
              type="color"
              value={inputColor}
              onChange={handleColorPickerChange}
              className="h-8 w-full cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {predefinedColors.map((presetColor) => (
              <button
                key={presetColor}
                className="h-6 w-6 rounded-full border"
                style={{ backgroundColor: presetColor }}
                onClick={() => handleColorSelection(presetColor)}
                aria-label={`Select color ${presetColor}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
