/**
 * Form Field Library Component
 * 
 * Displays available form fields that can be dragged into the form
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Clock,
  CalendarClock,
  Upload,
  EyeOff,
  Code,
  Minus
} from 'lucide-react';

interface FormFieldLibraryProps {
  onAddField: (fieldType: string) => void;
}

export function FormFieldLibrary({ onAddField }: FormFieldLibraryProps) {
  const fieldCategories = [
    {
      title: 'Basic Fields',
      fields: [
        {
          type: 'TEXT',
          label: 'Text Input',
          icon: Type,
          description: 'Single line text input'
        },
        {
          type: 'EMAIL',
          label: 'Email',
          icon: Mail,
          description: 'Email address input with validation'
        },
        {
          type: 'PHONE',
          label: 'Phone',
          icon: Phone,
          description: 'Phone number input'
        },
        {
          type: 'NUMBER',
          label: 'Number',
          icon: Hash,
          description: 'Numeric input field'
        },
        {
          type: 'TEXTAREA',
          label: 'Text Area',
          icon: AlignLeft,
          description: 'Multi-line text input'
        }
      ]
    },
    {
      title: 'Choice Fields',
      fields: [
        {
          type: 'SELECT',
          label: 'Dropdown',
          icon: ChevronDown,
          description: 'Single selection dropdown'
        },
        {
          type: 'MULTISELECT',
          label: 'Multi-Select',
          icon: List,
          description: 'Multiple selection dropdown'
        },
        {
          type: 'RADIO',
          label: 'Radio Buttons',
          icon: Circle,
          description: 'Single choice radio buttons'
        },
        {
          type: 'CHECKBOX',
          label: 'Checkboxes',
          icon: CheckSquare,
          description: 'Multiple choice checkboxes'
        }
      ]
    },
    {
      title: 'Date & Time',
      fields: [
        {
          type: 'DATE',
          label: 'Date',
          icon: Calendar,
          description: 'Date picker'
        },
        {
          type: 'TIME',
          label: 'Time',
          icon: Clock,
          description: 'Time picker'
        },
        {
          type: 'DATETIME',
          label: 'Date & Time',
          icon: CalendarClock,
          description: 'Date and time picker'
        }
      ]
    },
    {
      title: 'Advanced Fields',
      fields: [
        {
          type: 'FILE',
          label: 'File Upload',
          icon: Upload,
          description: 'File upload input'
        },
        {
          type: 'HIDDEN',
          label: 'Hidden Field',
          icon: EyeOff,
          description: 'Hidden field for tracking'
        }
      ]
    },
    {
      title: 'Layout Elements',
      fields: [
        {
          type: 'HTML',
          label: 'HTML Content',
          icon: Code,
          description: 'Custom HTML content'
        },
        {
          type: 'DIVIDER',
          label: 'Divider',
          icon: Minus,
          description: 'Visual divider line'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-2">
          Form Fields
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Click to add fields to your form
        </p>
      </div>

      {fieldCategories.map((category) => (
        <div key={category.title}>
          <h4 className="font-medium text-xs text-gray-700 uppercase tracking-wide mb-3">
            {category.title}
          </h4>
          
          <div className="space-y-2">
            {category.fields.map((field) => {
              const IconComponent = field.icon;
              
              return (
                <Button
                  key={field.type}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onAddField(field.type)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {field.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t">
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Pro Tip:</p>
          <p>You can reorder fields by dragging them in the form canvas.</p>
        </div>
      </div>
    </div>
  );
}