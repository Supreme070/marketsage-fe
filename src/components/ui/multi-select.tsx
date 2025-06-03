import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Item {
  value: string;
  label: string;
}

interface MultiSelectProps {
  items: Item[];
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  items,
  selectedItems,
  onChange,
  placeholder = "Select items",
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    // Create a mapping of values to labels
    const labelMap: Record<string, string> = {};
    items.forEach((item) => {
      labelMap[item.value] = item.label;
    });
    setSelectedLabels(labelMap);
  }, [items]);

  const handleSelect = (value: string) => {
    let updatedSelectedItems: string[];
    if (selectedItems.includes(value)) {
      updatedSelectedItems = selectedItems.filter((item) => item !== value);
    } else {
      updatedSelectedItems = [...selectedItems, value];
    }
    onChange(updatedSelectedItems);
    inputRef.current?.focus();
    setInputValue("");
  };

  const handleRemove = (value: string) => {
    const updatedSelectedItems = selectedItems.filter((item) => item !== value);
    onChange(updatedSelectedItems);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selectedItems.length > 0 ? "h-auto" : "h-10",
            className
          )}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedItems.length > 0 ? (
              selectedItems.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="m-0.5 pr-0.5"
                >
                  {selectedLabels[value] || value}
                  <Button
                    variant="ghost"
                    className="h-auto p-0.5 ml-1 -mr-1 hover:bg-transparent"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder="Search items..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selectedItems.includes(item.value);
                return (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => handleSelect(item.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect; 