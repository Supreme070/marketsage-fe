/**
 * Form Canvas Component
 * 
 * The main canvas where form fields are displayed and can be edited
 */

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FormField, FormConfig } from './FormBuilder';
import { FormFieldRenderer } from './FormFieldRenderer';

interface FormCanvasProps {
  form: FormConfig;
  fields: FormField[];
  selectedField: FormField | null;
  onFieldSelect: (field: FormField) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
}

export function FormCanvas({
  form,
  fields,
  selectedField,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  onFieldDuplicate
}: FormCanvasProps) {
  if (fields.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Edit3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Building Your Form
            </h3>
            <p className="text-gray-600 mb-4">
              Add fields from the left sidebar to start creating your form.
            </p>
            <div className="text-sm text-gray-500">
              Click on any field type to add it to your form.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Form Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-gray-600">
                {form.description}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {fields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <SortableFormField
              key={field.id}
              field={field}
              isSelected={selectedField?.id === field.id}
              onSelect={() => onFieldSelect(field)}
              onUpdate={(updates) => onFieldUpdate(field.id, updates)}
              onDelete={() => onFieldDelete(field.id)}
              onDuplicate={() => onFieldDuplicate(field.id)}
            />
          ))}
      </div>

      {/* Form Footer */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <Button className="w-full" size="lg">
              {form.submitButtonText}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SortableFormFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableFormField({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate
}: SortableFormFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group
        ${isDragging ? 'opacity-50' : ''}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <Card 
        className={`
          cursor-pointer transition-all duration-200
          ${isSelected ? 'border-blue-500 shadow-md' : 'hover:border-gray-300'}
          ${!field.isVisible ? 'opacity-60' : ''}
        `}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          {/* Field Controls */}
          <div className="flex items-center justify-between mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
              </button>
              
              <Badge variant="secondary" className="text-xs">
                {field.type}
              </Badge>
              
              {field.isRequired && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              
              {!field.isVisible && (
                <Badge variant="outline" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSelect}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Field
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdate({ isVisible: !field.isVisible })}
                >
                  {field.isVisible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Field
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Field
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Field Renderer */}
          <FormFieldRenderer field={field} isPreview={false} />
        </CardContent>
      </Card>
    </div>
  );
}