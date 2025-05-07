"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailBlocks from "./EmailBlocks";
import EmailCanvas from "./EmailCanvas";
import PropertyEditor from "./PropertyEditor";
import { Save, Eye, Send, Undo, Redo, Settings } from "lucide-react";

// Type definitions
export interface BlockElement {
  id: string;
  type: string;
  content: any;
  properties: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  blocks: BlockElement[];
}

export default function EmailEditor() {
  // Template state
  const [template, setTemplate] = useState<EmailTemplate>({
    id: uuidv4(),
    name: "New Template",
    subject: "Your email subject here",
    preheader: "Your preheader text here",
    blocks: []
  });

  // Selected block state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const selectedBlock = template.blocks.find(block => block.id === selectedBlockId);

  // History for undo/redo
  const [history, setHistory] = useState<EmailTemplate[]>([template]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add a new block to the template
  const addBlock = useCallback((type: string, defaultContent: any, defaultProperties: any) => {
    const newBlock: BlockElement = {
      id: uuidv4(),
      type,
      content: defaultContent,
      properties: defaultProperties
    };

    const newTemplate = {
      ...template,
      blocks: [...template.blocks, newBlock]
    };

    setTemplate(newTemplate);
    setSelectedBlockId(newBlock.id);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [template, history, historyIndex]);

  // Update a block's properties
  const updateBlockProperties = useCallback((blockId: string, newProperties: any) => {
    const newBlocks = template.blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          properties: {
            ...block.properties,
            ...newProperties
          }
        };
      }
      return block;
    });

    const newTemplate = {
      ...template,
      blocks: newBlocks
    };

    setTemplate(newTemplate);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [template, history, historyIndex]);

  // Update a block's content
  const updateBlockContent = useCallback((blockId: string, newContent: any) => {
    const newBlocks = template.blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          content: newContent
        };
      }
      return block;
    });

    const newTemplate = {
      ...template,
      blocks: newBlocks
    };

    setTemplate(newTemplate);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [template, history, historyIndex]);

  // Remove a block
  const removeBlock = useCallback((blockId: string) => {
    const newBlocks = template.blocks.filter(block => block.id !== blockId);

    const newTemplate = {
      ...template,
      blocks: newBlocks
    };

    setTemplate(newTemplate);
    setSelectedBlockId(null);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [template, history, historyIndex]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = template.blocks.findIndex(block => block.id === active.id);
      const newIndex = template.blocks.findIndex(block => block.id === over.id);

      const newBlocks = arrayMove(template.blocks, oldIndex, newIndex);

      const newTemplate = {
        ...template,
        blocks: newBlocks
      };

      setTemplate(newTemplate);

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newTemplate);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Update template metadata
  const updateTemplateMetadata = useCallback((metadata: Partial<EmailTemplate>) => {
    const newTemplate = {
      ...template,
      ...metadata
    };

    setTemplate(newTemplate);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [template, history, historyIndex]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0}>
            <Undo className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
          >
            <Redo className="mr-2 h-4 w-4" />
            Redo
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send Test
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="grid flex-1 grid-cols-12 gap-4 p-4">
        {/* Blocks panel */}
        <div className="col-span-3">
          <Tabs defaultValue="blocks">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blocks">Content Blocks</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="blocks" className="mt-2">
              <Card>
                <CardContent className="p-4">
                  <EmailBlocks addBlock={addBlock} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="templates" className="mt-2">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Saved templates will appear here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Email canvas */}
        <div className="col-span-6">
          <Card className="h-full overflow-y-auto">
            <CardContent className="p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={template.blocks.map(block => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <EmailCanvas
                    blocks={template.blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onRemoveBlock={removeBlock}
                    onUpdateContent={updateBlockContent}
                    metadata={{
                      subject: template.subject,
                      preheader: template.preheader,
                      name: template.name
                    }}
                    onUpdateMetadata={updateTemplateMetadata}
                  />
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* Properties panel */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardContent className="p-4">
              {selectedBlock ? (
                <PropertyEditor
                  block={selectedBlock}
                  onUpdate={(properties) => updateBlockProperties(selectedBlock.id, properties)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Select a block to edit its properties
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export the EmailEditorProvider wrapper
export function EmailEditorProvider() {
  return (
    <div className="h-full">
      <EmailEditor />
    </div>
  );
}
