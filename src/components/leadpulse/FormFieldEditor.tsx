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

        {/* Validation Rules */}
        {!isDivider && !isHtmlField && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Validation Rules</h4>
            
            {field.type === 'TEXT' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-length">Min Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        minLength: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                    placeholder="2"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-length">Max Length</Label>
                  <Input
                    id="max-length"
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        maxLength: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                    placeholder="255"
                    min="1"
                  />
                </div>
              </div>
            )}

            {field.type === 'TEXTAREA' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Min Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      value={field.validation?.minLength || ''}
                      onChange={(e) => onFieldChange({ 
                        validation: { 
                          ...field.validation, 
                          minLength: e.target.value ? Number(e.target.value) : undefined 
                        }
                      })}
                      placeholder="10"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Max Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      value={field.validation?.maxLength || ''}
                      onChange={(e) => onFieldChange({ 
                        validation: { 
                          ...field.validation, 
                          maxLength: e.target.value ? Number(e.target.value) : undefined 
                        }
                      })}
                      placeholder="1000"
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rows">Number of Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    value={field.validation?.rows || 4}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        rows: e.target.value ? Number(e.target.value) : 4 
                      }
                    })}
                    placeholder="4"
                    min="2"
                    max="10"
                  />
                </div>
              </div>
            )}

            {field.type === 'NUMBER' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-value">Min Value</Label>
                  <Input
                    id="min-value"
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        min: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-value">Max Value</Label>
                  <Input
                    id="max-value"
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        max: e.target.value ? Number(e.target.value) : undefined 
                      }
                    })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="step">Step</Label>
                  <Input
                    id="step"
                    type="number"
                    value={field.validation?.step || 1}
                    onChange={(e) => onFieldChange({ 
                      validation: { 
                        ...field.validation, 
                        step: e.target.value ? Number(e.target.value) : 1 
                      }
                    })}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {field.type === 'PHONE' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Supported Countries</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { code: 'NG', name: 'Nigeria', pattern: '+234' },
                      { code: 'KE', name: 'Kenya', pattern: '+254' },
                      { code: 'ZA', name: 'South Africa', pattern: '+27' },
                      { code: 'GH', name: 'Ghana', pattern: '+233' },
                      { code: 'UG', name: 'Uganda', pattern: '+256' },
                      { code: 'TZ', name: 'Tanzania', pattern: '+255' },
                      { code: 'ZW', name: 'Zimbabwe', pattern: '+263' },
                      { code: 'ZM', name: 'Zambia', pattern: '+260' }
                    ].map((country) => (
                      <div key={country.code} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`country-${country.code}`}
                          checked={field.validation?.countries?.includes(country.code) || false}
                          onChange={(e) => {
                            const countries = field.validation?.countries || [];
                            const newCountries = e.target.checked
                              ? [...countries, country.code]
                              : countries.filter(c => c !== country.code);
                            onFieldChange({
                              validation: {
                                ...field.validation,
                                countries: newCountries
                              }
                            });
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`country-${country.code}`} className="text-sm">
                          {country.name} ({country.pattern})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="validation-message">Custom Error Message</Label>
              <Input
                id="validation-message"
                value={field.validation?.message || ''}
                onChange={(e) => onFieldChange({ 
                  validation: { 
                    ...field.validation, 
                    message: e.target.value 
                  }
                })}
                placeholder="Please enter a valid value"
              />
            </div>
          </div>
        )}

        {(!isDivider && !isHtmlField) && <Separator />}

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

        {isFileField && <Separator />}

        {/* Conditional Logic */}
        {!isDivider && !isHtmlField && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Conditional Logic</h4>
            <p className="text-xs text-gray-500">
              Show or hide this field based on other field values
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Conditional Logic</Label>
                <Switch
                  checked={!!field.conditionalLogic?.enabled}
                  onCheckedChange={(checked) => onFieldChange({
                    conditionalLogic: {
                      ...field.conditionalLogic,
                      enabled: checked
                    }
                  })}
                />
              </div>

              {field.conditionalLogic?.enabled && (
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div className="space-y-2">
                    <Label>Show this field when:</Label>
                    <Select
                      value={field.conditionalLogic?.action || 'show'}
                      onValueChange={(value) => onFieldChange({
                        conditionalLogic: {
                          ...field.conditionalLogic,
                          action: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show field</SelectItem>
                        <SelectItem value="hide">Hide field</SelectItem>
                        <SelectItem value="require">Make field required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Input
                      value={field.conditionalLogic?.condition || ''}
                      onChange={(e) => onFieldChange({
                        conditionalLogic: {
                          ...field.conditionalLogic,
                          condition: e.target.value
                        }
                      })}
                      placeholder="fieldName equals 'value'"
                    />
                    <p className="text-xs text-gray-500">
                      Example: email_1 contains '@business.com'
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}