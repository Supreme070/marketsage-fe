/**
 * Form Field Editor Component
 * 
 * Panel for editing individual form field properties
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormField } from './FormBuilder';

interface FormFieldEditorProps {
  field: FormField;
  onFieldChange: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

export function FormFieldEditor({
  field,
  onFieldChange,
  onClose
}: FormFieldEditorProps) {
  const [localOptions, setLocalOptions] = useState(field.options || []);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...localOptions, newOption.trim()];
      setLocalOptions(updatedOptions);
      onFieldChange({ options: updatedOptions });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = localOptions.filter((_, i) => i !== index);
    setLocalOptions(updatedOptions);
    onFieldChange({ options: updatedOptions });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updatedOptions = localOptions.map((option, i) => 
      i === index ? value : option
    );
    setLocalOptions(updatedOptions);
    onFieldChange({ options: updatedOptions });
  };

  const needsOptions = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(field.type);
  const isFileField = field.type === 'FILE';
  const isHtmlField = field.type === 'HTML';
  const isDivider = field.type === 'DIVIDER';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Edit Field</h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary">{field.type}</Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Properties */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Basic Properties</h4>
          
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={field.name}
              onChange={(e) => onFieldChange({ name: e.target.value })}
              placeholder="field_name"
            />
            <p className="text-xs text-gray-500">
              Used for data storage and API submission
            </p>
          </div>

          {!isDivider && (
            <div className="space-y-2">
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={field.label}
                onChange={(e) => onFieldChange({ label: e.target.value })}
                placeholder="Field Label"
              />
            </div>
          )}

          {!isDivider && !isHtmlField && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={field.placeholder || ''}
                onChange={(e) => onFieldChange({ placeholder: e.target.value })}
                placeholder="Enter placeholder text..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="field-help">Help Text</Label>
            <Textarea
              id="field-help"
              value={field.helpText || ''}
              onChange={(e) => onFieldChange({ helpText: e.target.value })}
              placeholder="Additional help text for this field..."
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Field Behavior */}
        {!isDivider && !isHtmlField && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Field Behavior</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="required">Required Field</Label>
                <p className="text-xs text-gray-500">
                  Users must fill this field to submit
                </p>
              </div>
              <Switch
                id="required"
                checked={field.isRequired}
                onCheckedChange={(checked) => onFieldChange({ isRequired: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="visible">Visible</Label>
                <p className="text-xs text-gray-500">
                  Show this field in the form
                </p>
              </div>
              <Switch
                id="visible"
                checked={field.isVisible}
                onCheckedChange={(checked) => onFieldChange({ isVisible: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-value">Default Value</Label>
              {isHtmlField ? (
                <Textarea
                  id="default-value"
                  value={field.defaultValue || ''}
                  onChange={(e) => onFieldChange({ defaultValue: e.target.value })}
                  placeholder="Enter HTML content..."
                  rows={4}
                />
              ) : (
                <Input
                  id="default-value"
                  value={field.defaultValue || ''}
                  onChange={(e) => onFieldChange({ defaultValue: e.target.value })}
                  placeholder="Default value..."
                />
              )}
            </div>
          </div>
        )}

        {!isDivider && !isHtmlField && <Separator />}

        {/* Layout & Styling */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Layout & Styling</h4>
          
          <div className="space-y-2">
            <Label htmlFor="field-width">Field Width</Label>
            <Select
              value={field.width}
              onValueChange={(value) => onFieldChange({ width: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUARTER">Quarter (25%)</SelectItem>
                <SelectItem value="THIRD">Third (33%)</SelectItem>
                <SelectItem value="HALF">Half (50%)</SelectItem>
                <SelectItem value="TWO_THIRDS">Two Thirds (67%)</SelectItem>
                <SelectItem value="THREE_QUARTERS">Three Quarters (75%)</SelectItem>
                <SelectItem value="FULL">Full Width (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="css-classes">CSS Classes</Label>
            <Input
              id="css-classes"
              value={field.cssClasses || ''}
              onChange={(e) => onFieldChange({ cssClasses: e.target.value })}
              placeholder="custom-class another-class"
            />
            <p className="text-xs text-gray-500">
              Space-separated CSS classes
            </p>
          </div>
        </div>

        <Separator />

        {/* Options (for choice fields) */}
        {needsOptions && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Options</h4>
            
            <div className="space-y-2">
              {localOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    placeholder="Option text"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {needsOptions && <Separator />}

        {/* File Upload Settings */}
        {isFileField && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">File Upload Settings</h4>
            
            <div className="space-y-2">
              <Label htmlFor="file-types">Allowed File Types</Label>
              <Input
                id="file-types"
                value={field.fileTypes?.join(', ') || ''}
                onChange={(e) => onFieldChange({ 
                  fileTypes: e.target.value.split(',').map(type => type.trim()).filter(Boolean)
                })}
                placeholder=".pdf, .doc, .jpg, .png"
              />
              <p className="text-xs text-gray-500">
                Comma-separated file extensions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-size">Max File Size (MB)</Label>
              <Input
                id="max-size"
                type="number"
                value={field.maxFileSize ? field.maxFileSize / (1024 * 1024) : ''}
                onChange={(e) => onFieldChange({ 
                  maxFileSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined
                })}
                placeholder="10"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}