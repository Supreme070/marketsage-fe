/**
 * Form Field Renderer Component
 * 
 * Renders different types of form fields based on their configuration
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormField } from './FormBuilder';

interface FormFieldRendererProps {
  field: FormField;
  isPreview?: boolean;
  value?: any;
  onChange?: (value: any) => void;
  error?: string;
}

export function FormFieldRenderer({
  field,
  isPreview = false,
  value,
  onChange,
  error
}: FormFieldRendererProps) {
  if (!field.isVisible && !isPreview) {
    return null;
  }

  const renderField = () => {
    switch (field.type) {
      case 'TEXT':
        return (
          <Input
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'EMAIL':
        return (
          <Input
            type="email"
            placeholder={field.placeholder || 'Enter your email address...'}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'PHONE':
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || 'Enter your phone number...'}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || 'Enter a number...'}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'TEXTAREA':
        return (
          <Textarea
            placeholder={field.placeholder || 'Enter your message...'}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
            rows={4}
          />
        );

      case 'SELECT':
        return (
          <Select
            value={value}
            onValueChange={onChange}
            required={field.isRequired}
            disabled={!isPreview}
          >
            <SelectTrigger className={field.cssClasses}>
              <SelectValue placeholder={field.placeholder || 'Select an option...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'MULTISELECT':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    if (!isPreview) return;
                    
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange?.([...currentValues, option]);
                    } else {
                      onChange?.(currentValues.filter(v => v !== option));
                    }
                  }}
                  disabled={!isPreview}
                />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'RADIO':
        return (
          <RadioGroup
            value={value}
            onValueChange={onChange}
            disabled={!isPreview}
            className="space-y-2"
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    if (!isPreview) return;
                    
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange?.([...currentValues, option]);
                    } else {
                      onChange?.(currentValues.filter(v => v !== option));
                    }
                  }}
                  disabled={!isPreview}
                />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'DATE':
        return (
          <Input
            type="date"
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'TIME':
        return (
          <Input
            type="time"
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'DATETIME':
        return (
          <Input
            type="datetime-local"
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'FILE':
        return (
          <Input
            type="file"
            accept={field.fileTypes?.join(',')}
            onChange={(e) => onChange?.(e.target.files?.[0])}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
          />
        );

      case 'HIDDEN':
        return (
          <Input
            type="hidden"
            defaultValue={field.defaultValue}
            value={value}
            className="hidden"
          />
        );

      case 'HTML':
        return (
          <div
            className={`prose prose-sm max-w-none ${field.cssClasses}`}
            dangerouslySetInnerHTML={{ __html: field.defaultValue || '' }}
          />
        );

      case 'DIVIDER':
        return (
          <hr className={`border-gray-200 my-4 ${field.cssClasses}`} />
        );

      default:
        return (
          <div className="p-4 bg-gray-100 rounded-md text-center text-gray-500">
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-2 ${getFieldWidthClass(field.width)}`}>
      {/* Field Label */}
      {field.type !== 'HIDDEN' && field.type !== 'DIVIDER' && field.type !== 'HTML' && (
        <Label htmlFor={field.id} className="flex items-center space-x-1">
          <span>{field.label}</span>
          {field.isRequired && (
            <span className="text-red-500 text-sm">*</span>
          )}
        </Label>
      )}

      {/* Field Input */}
      <div>
        {renderField()}
      </div>

      {/* Help Text */}
      {field.helpText && (
        <p className="text-sm text-gray-500">{field.helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

function getFieldWidthClass(width: string): string {
  const widthClasses: Record<string, string> = {
    QUARTER: 'w-1/4',
    THIRD: 'w-1/3',
    HALF: 'w-1/2',
    TWO_THIRDS: 'w-2/3',
    THREE_QUARTERS: 'w-3/4',
    FULL: 'w-full'
  };

  return widthClasses[width] || 'w-full';
}