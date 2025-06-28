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

// African market phone number validation
function validateAfricanPhoneNumber(phone: string): boolean {
  if (!phone) return true; // Allow empty for non-required fields
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // African country phone patterns
  const patterns = [
    /^234[789]\d{8}$/, // Nigeria: +234 followed by 7, 8, or 9 and 8 digits
    /^254[17]\d{8}$/, // Kenya: +254 followed by 1 or 7 and 8 digits  
    /^27[1-8]\d{8}$/, // South Africa: +27 followed by 1-8 and 8 digits
    /^233[235][0-9]\d{7}$/, // Ghana: +233 followed by specific patterns
    /^256[37]\d{8}$/, // Uganda: +256 followed by 3 or 7 and 8 digits
    /^255[67]\d{8}$/, // Tanzania: +255 followed by 6 or 7 and 8 digits
    /^263[77]\d{7}$/, // Zimbabwe: +263 followed by 77 and 7 digits
    /^260[79]\d{7}$/, // Zambia: +260 followed by 7 or 9 and 7 digits
  ];
  
  return patterns.some(pattern => pattern.test(digits));
}

// Format African phone numbers for display
function formatAfricanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Format based on country code
  if (digits.startsWith('234') && digits.length === 13) {
    // Nigeria: +234 803 123 4567
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.startsWith('254') && digits.length === 12) {
    // Kenya: +254 712 345 678
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  } else if (digits.startsWith('27') && digits.length === 11) {
    // South Africa: +27 82 123 4567
    return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else if (digits.startsWith('233') && digits.length === 12) {
    // Ghana: +233 24 123 4567
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  
  // If not a recognized pattern, try to format with + if digits start with country code
  if (digits.length > 10 && /^(234|254|27|233|256|255|263|260)/.test(digits)) {
    return `+${digits}`;
  }
  
  // Fallback formatting - just return as entered
  return phone;
}

// Email validation
function isValidEmail(email: string): boolean {
  if (!email) return true; // Allow empty for non-required fields
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
          <div className="space-y-1">
            <Input
              type="email"
              placeholder={field.placeholder || 'example@domain.com'}
              defaultValue={field.defaultValue}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              required={field.isRequired}
              className={`${field.cssClasses} ${!isPreview && value && isValidEmail(value) ? 'border-green-500' : !isPreview && value ? 'border-red-500' : ''}`}
              disabled={!isPreview}
              autoComplete="email"
              inputMode="email"
            />
            {!isPreview && value && !isValidEmail(value) && (
              <p className="text-xs text-red-600">
                Please enter a valid email address
              </p>
            )}
          </div>
        );

      case 'PHONE':
        return (
          <div className="space-y-1">
            <Input
              type="tel"
              placeholder={field.placeholder || '+234 803 123 4567'}
              defaultValue={field.defaultValue}
              value={value}
              onChange={(e) => {
                const formatted = formatAfricanPhoneNumber(e.target.value);
                onChange?.(formatted);
              }}
              required={field.isRequired}
              className={`${field.cssClasses} ${!isPreview && validateAfricanPhoneNumber(value) ? 'border-green-500' : !isPreview && value ? 'border-red-500' : ''}`}
              disabled={!isPreview}
              pattern="[\+]?[0-9\s\-\(\)]+"
              title="Enter a valid African phone number (e.g., +234 803 123 4567)"
            />
            {!isPreview && value && !validateAfricanPhoneNumber(value) && (
              <p className="text-xs text-red-600">
                Please enter a valid African phone number
              </p>
            )}
          </div>
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || 'Enter a number...'}
            defaultValue={field.defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : undefined)}
            required={field.isRequired}
            className={field.cssClasses}
            disabled={!isPreview}
            inputMode="numeric"
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.validation?.step || 1}
          />
        );

      case 'TEXTAREA':
        return (
          <div className="space-y-1">
            <Textarea
              placeholder={field.placeholder || 'Enter your message...'}
              defaultValue={field.defaultValue}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              required={field.isRequired}
              className={`${field.cssClasses} resize-y`}
              disabled={!isPreview}
              rows={field.validation?.rows || 4}
              minLength={field.validation?.minLength}
              maxLength={field.validation?.maxLength}
            />
            {field.validation?.maxLength && (
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">
                  {value?.length || 0} / {field.validation.maxLength}
                </span>
              </div>
            )}
          </div>
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
    QUARTER: 'w-full sm:w-1/4', // Mobile-first: full width on mobile, quarter on larger screens
    THIRD: 'w-full sm:w-1/3',
    HALF: 'w-full sm:w-1/2',
    TWO_THIRDS: 'w-full sm:w-2/3',
    THREE_QUARTERS: 'w-full sm:w-3/4',
    FULL: 'w-full'
  };

  return widthClasses[width] || 'w-full';
}