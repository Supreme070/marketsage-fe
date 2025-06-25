/**
 * LeadPulse Form Builder - Main Component
 * 
 * Drag-and-drop form builder for creating lead capture forms
 */

'use client';

import React, { useState, useCallback } from 'react';
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Eye, 
  Code, 
  Settings, 
  Plus,
  Palette,
  Layout,
  Database
} from 'lucide-react';
import { FormFieldLibrary } from './FormFieldLibrary';
import { FormCanvas } from './FormCanvas';
import { FormFieldEditor } from './FormFieldEditor';
import { FormSettingsPanel } from './FormSettingsPanel';
import { FormPreview } from './FormPreview';
import { FormStyleEditor } from './FormStyleEditor';

export interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isVisible: boolean;
  defaultValue?: string;
  validation?: any;
  options?: string[];
  fileTypes?: string[];
  maxFileSize?: number;
  order: number;
  width: string;
  cssClasses?: string;
  conditionalLogic?: any;
}

export interface FormConfig {
  id?: string;
  name: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  theme?: any;
  layout: string;
  settings?: any;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  redirectUrl?: string;
  isTrackingEnabled: boolean;
  conversionGoal?: string;
  isPublished: boolean;
}

interface FormBuilderProps {
  initialForm?: Partial<FormConfig>;
  initialFields?: FormField[];
  onSave?: (form: FormConfig, fields: FormField[]) => void;
  onPublish?: (form: FormConfig, fields: FormField[]) => void;
  onPreview?: (form: FormConfig, fields: FormField[]) => void;
}

export function FormBuilder({
  initialForm,
  initialFields = [],
  onSave,
  onPublish,
  onPreview
}: FormBuilderProps) {
  // Form configuration state
  const [form, setForm] = useState<FormConfig>({
    name: 'New Form',
    title: 'Contact Us',
    description: '',
    status: 'DRAFT',
    layout: 'SINGLE_COLUMN',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    errorMessage: 'Something went wrong. Please try again.',
    isTrackingEnabled: true,
    isPublished: false,
    ...initialForm
  });

  // Form fields state
  const [fields, setFields] = useState<FormField[]>(initialFields);

  // UI state
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [draggedField, setDraggedField] = useState<FormField | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const field = fields.find(f => f.id === active.id) || null;
    setDraggedField(field);
  }, [fields]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return newItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }

    setDraggedField(null);
  }, []);

  // Field management
  const addField = useCallback((fieldType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      name: `field_${fields.length + 1}`,
      label: getDefaultLabel(fieldType),
      placeholder: getDefaultPlaceholder(fieldType),
      isRequired: false,
      isVisible: true,
      order: fields.length,
      width: 'FULL'
    };

    setFields(prev => [...prev, newField]);
    setSelectedField(newField);
  }, [fields.length]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedField]);

  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [selectedField]);

  const duplicateField = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    const newField: FormField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: fields.length
    };

    setFields(prev => [...prev, newField]);
  }, [fields]);

  // Form actions
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(form, fields);
    }
  }, [form, fields, onSave]);

  const handlePublish = useCallback(() => {
    const publishedForm = { ...form, status: 'PUBLISHED' as const, isPublished: true };
    setForm(publishedForm);
    
    if (onPublish) {
      onPublish(publishedForm, fields);
    }
  }, [form, fields, onPublish]);

  const handlePreview = useCallback(() => {
    setIsPreviewMode(true);
    if (onPreview) {
      onPreview(form, fields);
    }
  }, [form, fields, onPreview]);

  if (isPreviewMode) {
    return (
      <div className="h-screen bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Form Preview</h1>
              <p className="text-sm text-gray-600">{form.title}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(false)}
            >
              Back to Editor
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <FormPreview form={form} fields={fields} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="font-semibold text-lg border-none p-0 h-auto focus:outline-none focus:ring-0"
                placeholder="Form Name"
              />
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={form.status === 'PUBLISHED' ? 'default' : 'secondary'}
                >
                  {form.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {fields.length} field{fields.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handlePublish}>
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Field Library */}
        <div className="w-80 border-r bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder" className="text-xs">
                <Plus className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="design" className="text-xs">
                <Palette className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="layout" className="text-xs">
                <Layout className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 p-4">
              <FormFieldLibrary onAddField={addField} />
            </TabsContent>

            <TabsContent value="design" className="flex-1 p-4">
              <FormStyleEditor
                theme={form.theme || {}}
                onThemeChange={(theme) => setForm(prev => ({ ...prev, theme }))}
              />
            </TabsContent>

            <TabsContent value="layout" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="layout">Form Layout</Label>
                  <select
                    id="layout"
                    value={form.layout}
                    onChange={(e) => setForm(prev => ({ ...prev, layout: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="SINGLE_COLUMN">Single Column</option>
                    <option value="TWO_COLUMN">Two Column</option>
                    <option value="MULTI_STEP">Multi-Step</option>
                    <option value="FLOATING_LABELS">Floating Labels</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4">
              <FormSettingsPanel
                form={form}
                onFormChange={setForm}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 p-6">
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <FormCanvas
                form={form}
                fields={fields}
                selectedField={selectedField}
                onFieldSelect={setSelectedField}
                onFieldUpdate={updateField}
                onFieldDelete={deleteField}
                onFieldDuplicate={duplicateField}
              />
            </SortableContext>

            <DragOverlay>
              {draggedField ? (
                <div className="bg-white border rounded-lg p-4 shadow-lg">
                  {draggedField.label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Right Sidebar - Field Editor */}
        {selectedField && (
          <div className="w-80 border-l bg-white">
            <FormFieldEditor
              field={selectedField}
              onFieldChange={(updates) => updateField(selectedField.id, updates)}
              onClose={() => setSelectedField(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getDefaultLabel(fieldType: string): string {
  const labels: Record<string, string> = {
    TEXT: 'Text Input',
    EMAIL: 'Email Address',
    PHONE: 'Phone Number',
    NUMBER: 'Number',
    TEXTAREA: 'Text Area',
    SELECT: 'Dropdown',
    MULTISELECT: 'Multi-Select',
    RADIO: 'Radio Buttons',
    CHECKBOX: 'Checkboxes',
    DATE: 'Date',
    TIME: 'Time',
    DATETIME: 'Date & Time',
    FILE: 'File Upload',
    HIDDEN: 'Hidden Field',
    HTML: 'HTML Content',
    DIVIDER: 'Divider'
  };

  return labels[fieldType] || 'Field';
}

function getDefaultPlaceholder(fieldType: string): string {
  const placeholders: Record<string, string> = {
    TEXT: 'Enter text...',
    EMAIL: 'Enter your email address...',
    PHONE: 'Enter your phone number...',
    NUMBER: 'Enter a number...',
    TEXTAREA: 'Enter your message...',
    SELECT: 'Select an option...',
    MULTISELECT: 'Select options...',
    DATE: 'Select a date...',
    TIME: 'Select a time...',
    DATETIME: 'Select date and time...',
    FILE: 'Choose file...'
  };

  return placeholders[fieldType] || '';
}