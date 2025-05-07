"use client";

import { useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { BlockElement, EmailTemplate } from "./EmailEditor";
import HeadingBlock from "./blocks/HeadingBlock";
import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import ButtonBlock from "./blocks/ButtonBlock";
import DividerBlock from "./blocks/DividerBlock";
import SpacerBlock from "./blocks/SpacerBlock";
import BulletListBlock from "./blocks/BulletListBlock";
import NumberedListBlock from "./blocks/NumberedListBlock";

interface SortableBlockProps {
  id: string;
  type: string;
  content: any;
  properties: any;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdateContent: (content: any) => void;
}

// Sortable Block Wrapper
function SortableBlock({
  id,
  type,
  content,
  properties,
  isSelected,
  onSelect,
  onRemove,
  onUpdateContent,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Render the appropriate block component based on type
  const renderBlockContent = useCallback(() => {
    switch (type) {
      case "heading":
        return (
          <HeadingBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      case "text":
        return (
          <TextBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      case "image":
        return (
          <ImageBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      case "button":
        return (
          <ButtonBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      case "divider":
        return (
          <DividerBlock
            properties={properties}
            isSelected={isSelected}
          />
        );
      case "spacer":
        return (
          <SpacerBlock
            properties={properties}
            isSelected={isSelected}
          />
        );
      case "bulletList":
        return (
          <BulletListBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      case "numberedList":
        return (
          <NumberedListBlock
            content={content}
            properties={properties}
            onUpdateContent={onUpdateContent}
            isSelected={isSelected}
          />
        );
      default:
        return <div>Unknown block type: {type}</div>;
    }
  }, [type, content, properties, onUpdateContent, isSelected]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative mb-4 rounded-md border ${
        isSelected
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <div className="p-3">
        {renderBlockContent()}
      </div>

      {/* Block Controls */}
      <div className="absolute -right-12 top-0 flex flex-col space-y-1">
        <button
          {...listeners}
          {...attributes}
          className="rounded-md bg-muted p-1 text-muted-foreground hover:bg-muted/80"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          className="rounded-md bg-muted p-1 text-muted-foreground hover:bg-muted/80"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface EmailCanvasProps {
  blocks: BlockElement[];
  selectedBlockId: string | null;
  metadata: {
    name: string;
    subject: string;
    preheader: string;
  };
  onSelectBlock: (id: string) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateContent: (id: string, content: any) => void;
  onUpdateMetadata: (metadata: Partial<EmailTemplate>) => void;
}

export default function EmailCanvas({
  blocks,
  selectedBlockId,
  metadata,
  onSelectBlock,
  onRemoveBlock,
  onUpdateContent,
  onUpdateMetadata,
}: EmailCanvasProps) {
  return (
    <div className="mb-4 space-y-4">
      {/* Template Metadata */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Email Settings</h2>
        <div className="space-y-4 rounded-md border border-border p-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Template Name
            </label>
            <Input
              id="name"
              value={metadata.name}
              onChange={(e) => onUpdateMetadata({ name: e.target.value })}
              placeholder="Enter template name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Email Subject
            </label>
            <Input
              id="subject"
              value={metadata.subject}
              onChange={(e) => onUpdateMetadata({ subject: e.target.value })}
              placeholder="Enter email subject"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="preheader" className="text-sm font-medium">
              Preheader Text
            </label>
            <Input
              id="preheader"
              value={metadata.preheader}
              onChange={(e) => onUpdateMetadata({ preheader: e.target.value })}
              placeholder="Enter preheader text"
            />
            <p className="text-xs text-muted-foreground">
              Preheader text appears in email clients as a preview of the email content.
            </p>
          </div>
        </div>
      </div>

      {/* Email blocks */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Email Content</h2>
        <div
          className="relative rounded-md border border-border p-6"
          onClick={() => onSelectBlock("")}
        >
          {blocks.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="mb-2 text-lg font-medium">Start Building Your Email</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Drag and drop content blocks from the panel on the left
              </p>
            </div>
          ) : (
            blocks.map((block) => (
              <SortableBlock
                key={block.id}
                id={block.id}
                type={block.type}
                content={block.content}
                properties={block.properties}
                isSelected={selectedBlockId === block.id}
                onSelect={() => onSelectBlock(block.id)}
                onRemove={() => onRemoveBlock(block.id)}
                onUpdateContent={(content) => onUpdateContent(block.id, content)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
