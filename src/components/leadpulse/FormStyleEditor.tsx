/**
 * LeadPulse Form Style Editor
 * 
 * Visual theme and styling customization for forms
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Type, 
  Layout, 
  Spacing,
  RotateCcw,
  Eye,
  Download,
  Upload
} from 'lucide-react';

interface FormTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
  spacing: number;
  fieldSpacing: number;
  buttonStyle: 'solid' | 'outline' | 'gradient';
  shadowStyle: 'none' | 'small' | 'medium' | 'large';
  customCSS?: string;
}

interface FormStyleEditorProps {
  theme: FormTheme;
  onChange: (theme: FormTheme) => void;
  onReset: () => void;
  onPreview: () => void;
}

const PRESET_THEMES = {
  default: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#d1d5db',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'Inter',
    spacing: 16,
    fieldSpacing: 12,
    buttonStyle: 'solid' as const,
    shadowStyle: 'small' as const
  },
  modern: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    backgroundColor: '#fafafa',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: 'Inter',
    spacing: 20,
    fieldSpacing: 16,
    buttonStyle: 'gradient' as const,
    shadowStyle: 'medium' as const
  },
  minimal: {
    primaryColor: '#000000',
    secondaryColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    borderColor: '#f3f4f6',
    borderRadius: 0,
    fontSize: 14,
    fontFamily: 'Helvetica',
    spacing: 12,
    fieldSpacing: 8,
    buttonStyle: 'outline' as const,
    shadowStyle: 'none' as const
  },
  colorful: {
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    backgroundColor: '#fef3c7',
    textColor: '#1f2937',
    borderColor: '#f59e0b',
    borderRadius: 16,
    fontSize: 15,
    fontFamily: 'Inter',
    spacing: 24,
    fieldSpacing: 18,
    buttonStyle: 'solid' as const,
    shadowStyle: 'large' as const
  }
};

const FONT_FAMILIES = [
  'Inter',
  'Helvetica',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins'
];

export function FormStyleEditor({ 
  theme, 
  onChange, 
  onReset, 
  onPreview 
}: FormStyleEditorProps) {
  const updateTheme = (updates: Partial<FormTheme>) => {
    onChange({ ...theme, ...updates });
  };

  const applyPreset = (presetName: keyof typeof PRESET_THEMES) => {
    onChange(PRESET_THEMES[presetName]);
  };

  const ColorPicker = ({ 
    label, 
    value, 
    onChange: onColorChange 
  }: { 
    label: string; 
    value: string; 
    onChange: (color: string) => void; 
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <div 
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.addEventListener('change', (e) => {
              onColorChange((e.target as HTMLInputElement).value);
            });
            input.click();
          }}
        />
        <Input
          value={value}
          onChange={(e) => onColorChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Quick Themes
          </CardTitle>
          <CardDescription>
            Start with a pre-designed theme and customize from there
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PRESET_THEMES).map(([name, presetTheme]) => (
              <Button
                key={name}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                onClick={() => applyPreset(name as keyof typeof PRESET_THEMES)}
              >
                <div className="flex space-x-1">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: presetTheme.primaryColor }}
                  />
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: presetTheme.secondaryColor }}
                  />
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: presetTheme.backgroundColor }}
                  />
                </div>
                <span className="text-xs capitalize">{name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize the colors used throughout your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary Color"
                  value={theme.primaryColor}
                  onChange={(color) => updateTheme({ primaryColor: color })}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={theme.secondaryColor}
                  onChange={(color) => updateTheme({ secondaryColor: color })}
                />
                <ColorPicker
                  label="Background Color"
                  value={theme.backgroundColor}
                  onChange={(color) => updateTheme({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Text Color"
                  value={theme.textColor}
                  onChange={(color) => updateTheme({ textColor: color })}
                />
                <ColorPicker
                  label="Border Color"
                  value={theme.borderColor}
                  onChange={(color) => updateTheme({ borderColor: color })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </CardTitle>
              <CardDescription>
                Customize fonts and text styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select 
                  value={theme.fontFamily} 
                  onValueChange={(value) => updateTheme({ fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Size: {theme.fontSize}px</Label>
                <Slider
                  value={[theme.fontSize]}
                  onValueChange={([value]) => updateTheme({ fontSize: value })}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout & Spacing
              </CardTitle>
              <CardDescription>
                Control spacing and visual layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius: {theme.borderRadius}px</Label>
                <Slider
                  value={[theme.borderRadius]}
                  onValueChange={([value]) => updateTheme({ borderRadius: value })}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Form Spacing: {theme.spacing}px</Label>
                <Slider
                  value={[theme.spacing]}
                  onValueChange={([value]) => updateTheme({ spacing: value })}
                  min={8}
                  max={32}
                  step={2}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Field Spacing: {theme.fieldSpacing}px</Label>
                <Slider
                  value={[theme.fieldSpacing]}
                  onValueChange={([value]) => updateTheme({ fieldSpacing: value })}
                  min={4}
                  max={24}
                  step={2}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Button Style</Label>
                <Select 
                  value={theme.buttonStyle} 
                  onValueChange={(value) => updateTheme({ buttonStyle: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shadow Style</Label>
                <Select 
                  value={theme.shadowStyle} 
                  onValueChange={(value) => updateTheme({ shadowStyle: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize your form appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <textarea
                  id="custom-css"
                  value={theme.customCSS || ''}
                  onChange={(e) => updateTheme({ customCSS: e.target.value })}
                  placeholder="/* Add your custom CSS here */\n.form-container {\n  /* Custom styles */\n}"
                  className="w-full h-32 p-3 text-sm font-mono border rounded-md"
                />
              </div>
              <p className="text-xs text-gray-600">
                Use CSS selectors like .form-container, .form-field, .submit-button to target specific elements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import/Export</CardTitle>
              <CardDescription>
                Save and share your theme configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Theme
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Theme
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
        <Button onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Changes
        </Button>
      </div>

      {/* Preview CSS Output */}
      <Card>
        <CardHeader>
          <CardTitle>Generated CSS</CardTitle>
          <CardDescription>
            CSS that will be applied to your form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
{`.form-container {
  background-color: ${theme.backgroundColor};
  color: ${theme.textColor};
  font-family: ${theme.fontFamily}, sans-serif;
  font-size: ${theme.fontSize}px;
  padding: ${theme.spacing}px;
}

.form-field {
  margin-bottom: ${theme.fieldSpacing}px;
  border-color: ${theme.borderColor};
  border-radius: ${theme.borderRadius}px;
}

.submit-button {
  background-color: ${theme.primaryColor};
  border-radius: ${theme.borderRadius}px;
  ${theme.buttonStyle === 'gradient' 
    ? `background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor});`
    : theme.buttonStyle === 'outline'
    ? `background: transparent; border: 1px solid ${theme.primaryColor}; color: ${theme.primaryColor};`
    : ''
  }
  ${theme.shadowStyle !== 'none' 
    ? `box-shadow: 0 ${theme.shadowStyle === 'small' ? '1px 3px' : theme.shadowStyle === 'medium' ? '4px 6px' : '6px 20px'} rgba(0,0,0,0.1);`
    : ''
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}