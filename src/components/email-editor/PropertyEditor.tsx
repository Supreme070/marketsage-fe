"use client";

import { useState, useEffect } from "react";
import type { BlockElement } from "./EmailEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ColorPicker from "./ColorPicker";

interface PropertyEditorProps {
  block: BlockElement;
  onUpdate: (properties: any) => void;
}

export default function PropertyEditor({ block, onUpdate }: PropertyEditorProps) {
  const [properties, setProperties] = useState(block.properties);

  // Update properties when block changes
  useEffect(() => {
    setProperties(block.properties);
  }, [block.id, block.properties]);

  // Handle property changes
  const handleChange = (key: string, value: any) => {
    const updatedProperties = {
      ...properties,
      [key]: value,
    };
    setProperties(updatedProperties);
    onUpdate(updatedProperties);
  };

  // Render different property editors based on block type
  const renderTypeSpecificProperties = () => {
    switch (block.type) {
      case "heading":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="heading-level">Heading Level</Label>
              <Select
                value={properties.level}
                onValueChange={(value) => handleChange("level", value)}
              >
                <SelectTrigger id="heading-level">
                  <SelectValue placeholder="Select heading level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heading-fontWeight">Font Weight</Label>
              <Select
                value={properties.fontWeight}
                onValueChange={(value) => handleChange("fontWeight", value)}
              >
                <SelectTrigger id="heading-fontWeight">
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "text":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="text-lineHeight">Line Height</Label>
              <Select
                value={properties.lineHeight}
                onValueChange={(value) => handleChange("lineHeight", value)}
              >
                <SelectTrigger id="text-lineHeight">
                  <SelectValue placeholder="Select line height" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tight (1)</SelectItem>
                  <SelectItem value="1.2">Compact (1.2)</SelectItem>
                  <SelectItem value="1.5">Normal (1.5)</SelectItem>
                  <SelectItem value="1.8">Relaxed (1.8)</SelectItem>
                  <SelectItem value="2">Loose (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "image":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="image-src">Image URL</Label>
              <Input
                id="image-src"
                value={block.content.src}
                onChange={(e) => {
                  // This needs to update content, not properties
                  const newContent = { ...block.content, src: e.target.value };
                  // We need to notify the parent component about content changes
                  // This is just updating the UI, not saving the changes
                }}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={block.content.alt}
                onChange={(e) => {
                  // This needs to update content, not properties
                  const newContent = { ...block.content, alt: e.target.value };
                  // We need to notify the parent component about content changes
                }}
                placeholder="Image description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-link">Link URL (optional)</Label>
              <Input
                id="image-link"
                value={properties.link}
                onChange={(e) => handleChange("link", e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-borderRadius">Border Radius</Label>
              <Input
                id="image-borderRadius"
                type="text"
                value={properties.borderRadius}
                onChange={(e) => handleChange("borderRadius", e.target.value)}
                placeholder="0px, 4px, 8px, etc."
              />
            </div>
          </>
        );

      case "button":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={block.content.text}
                onChange={(e) => {
                  // This needs to update content, not properties
                  const newContent = { ...block.content, text: e.target.value };
                  // We need to notify the parent component about content changes
                }}
                placeholder="Click Here"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-link">Button Link</Label>
              <Input
                id="button-link"
                value={block.content.link}
                onChange={(e) => {
                  // This needs to update content, not properties
                  const newContent = { ...block.content, link: e.target.value };
                  // We need to notify the parent component about content changes
                }}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-backgroundColor">Background Color</Label>
              <ColorPicker
                id="button-backgroundColor"
                color={properties.backgroundColor}
                onChange={(color) => handleChange("backgroundColor", color)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-borderRadius">Border Radius</Label>
              <Input
                id="button-borderRadius"
                type="text"
                value={properties.borderRadius}
                onChange={(e) => handleChange("borderRadius", e.target.value)}
                placeholder="4px"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-width">Width</Label>
              <Select
                value={properties.width}
                onValueChange={(value) => handleChange("width", value)}
              >
                <SelectTrigger id="button-width">
                  <SelectValue placeholder="Select width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="100%">Full width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "divider":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="divider-color">Divider Color</Label>
              <ColorPicker
                id="divider-color"
                color={properties.color}
                onChange={(color) => handleChange("color", color)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divider-thickness">Thickness</Label>
              <Input
                id="divider-thickness"
                type="text"
                value={properties.thickness}
                onChange={(e) => handleChange("thickness", e.target.value)}
                placeholder="1px"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="divider-style">Style</Label>
              <Select
                value={properties.style}
                onValueChange={(value) => handleChange("style", value)}
              >
                <SelectTrigger id="divider-style">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "spacer":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="spacer-height">Height</Label>
              <Input
                id="spacer-height"
                type="text"
                value={properties.height}
                onChange={(e) => handleChange("height", e.target.value)}
                placeholder="20px"
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Additional properties specific to this block will appear here.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h3 className="mb-2 text-lg font-medium">{block.type.charAt(0).toUpperCase() + block.type.slice(1)} Properties</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance and behavior of this block.
        </p>
      </div>

      <Tabs defaultValue="style">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-4 pt-4">
          {/* Type-specific properties */}
          {renderTypeSpecificProperties()}

          {/* Common style properties */}
          <Accordion type="single" collapsible defaultValue="typography">
            <AccordionItem value="typography">
              <AccordionTrigger>Typography</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Text Color</Label>
                  <ColorPicker
                    id="color"
                    color={properties.color}
                    onChange={(color) => handleChange("color", color)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Input
                    id="fontSize"
                    type="text"
                    value={properties.fontSize}
                    onChange={(e) => handleChange("fontSize", e.target.value)}
                    placeholder="16px"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="align">Alignment</Label>
            <Select
              value={properties.align}
              onValueChange={(value) => handleChange("align", value)}
            >
              <SelectTrigger id="align">
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="padding">Padding</Label>
            <Input
              id="padding"
              type="text"
              value={properties.padding}
              onChange={(e) => handleChange("padding", e.target.value)}
              placeholder="10px 0"
            />
            <p className="text-xs text-muted-foreground">
              Format: top/bottom or top right bottom left (e.g., "10px 0" or "10px 20px 10px 20px")
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
