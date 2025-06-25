/**
 * LeadPulse Form Preview Component
 * 
 * Renders a live preview of the form as users build it
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormFieldRenderer } from './FormFieldRenderer';
import { Smartphone, Monitor, Tablet } from 'lucide-react';

interface FormField {
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
  width: 'FULL' | 'HALF' | 'THIRD';
  cssClasses?: string;
  conditionalLogic?: any;
}

interface FormPreviewProps {
  form: {
    id?: string;
    name: string;
    title: string;
    description?: string;
    layout: 'SINGLE_COLUMN' | 'DOUBLE_COLUMN' | 'CUSTOM';
    theme: Record<string, any>;
    submitButtonText: string;
    successMessage: string;
    errorMessage: string;
  };
  fields: FormField[];
  className?: string;
}

export function FormPreview({ form, fields, className = '' }: FormPreviewProps) {
  const [previewMode, setPreviewMode] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form preview submission:', formData);
  };

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  // Filter visible fields
  const visibleFields = sortedFields.filter(field => field.isVisible);

  // Get preview container styles based on mode
  const getPreviewStyles = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-md mx-auto';
      default:
        return 'max-w-2xl mx-auto';
    }
  };

  const getLayoutClass = () => {
    switch (form.layout) {
      case 'DOUBLE_COLUMN':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      case 'CUSTOM':
        return 'grid grid-cols-12 gap-4';
      default:
        return 'space-y-4';
    }
  };

  const getFieldWidth = (width: string) => {
    switch (width) {
      case 'HALF':
        return 'col-span-6';
      case 'THIRD':
        return 'col-span-4';
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Mode Selector */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
            className="h-8 px-3"
          >
            <Monitor className="w-4 h-4 mr-1" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'tablet' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('tablet')}
            className="h-8 px-3"
          >
            <Tablet className="w-4 h-4 mr-1" />
            Tablet
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
            className="h-8 px-3"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Form Preview */}
      <div className={getPreviewStyles()}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {form.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {visibleFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No fields added yet</p>
                <p className="text-sm">Add fields from the library to see them here</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={getLayoutClass()}>
                  {visibleFields.map((field) => (
                    <div
                      key={field.id}
                      className={
                        form.layout === 'CUSTOM' 
                          ? getFieldWidth(field.width)
                          : ''
                      }
                    >
                      <FormFieldRenderer
                        field={field}
                        value={formData[field.name]}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        error={null}
                        preview={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    style={{
                      backgroundColor: form.theme.primaryColor || undefined,
                      borderRadius: form.theme.borderRadius ? `${form.theme.borderRadius}px` : undefined
                    }}
                  >
                    {form.submitButtonText || 'Submit'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Info */}
      <div className="text-center text-xs text-gray-500">
        <p>This is a preview of how your form will appear to visitors</p>
        <p>Form submissions in preview mode will not be saved</p>
      </div>
    </div>
  );
}