'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, PlusCircle, Trash2, MoveVertical, Settings, Paintbrush, Code } from 'lucide-react';

// Define form field types
const fieldTypes = [
  { value: 'TEXT', label: 'Text Input' },
  { value: 'EMAIL', label: 'Email Input' },
  { value: 'PHONE', label: 'Phone Input' },
  { value: 'NUMBER', label: 'Number Input' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'CHECKBOX', label: 'Checkboxes' },
  { value: 'RADIO', label: 'Radio Buttons' },
  { value: 'DATE', label: 'Date Picker' },
  { value: 'HIDDEN', label: 'Hidden Field' }
];

export default function NewFormPage() {
  const router = useRouter();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('STANDARD');
  const [fields, setFields] = useState([
    {
      id: 'field_' + Date.now(),
      name: 'email',
      label: 'Email Address',
      type: 'EMAIL',
      placeholder: 'Enter your email',
      required: true,
      options: []
    }
  ]);
  const [activeTab, setActiveTab] = useState('fields');
  const [formDesign, setFormDesign] = useState({
    theme: 'light',
    primaryColor: '#0070f3',
    buttonText: 'Submit',
    successMessage: 'Thank you for your submission!'
  });
  
  // Add a new field to the form
  const addField = () => {
    const newField = {
      id: 'field_' + Date.now(),
      name: 'field_' + fields.length,
      label: 'New Field',
      type: 'TEXT',
      placeholder: '',
      required: false,
      options: []
    };
    
    setFields([...fields, newField]);
  };
  
  // Update a field property
  const updateField = (id, property, value) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, [property]: value } : field
    ));
  };
  
  // Remove a field
  const removeField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };
  
  // Add an option to a select/checkbox/radio field
  const addOption = (fieldId) => {
    setFields(fields.map(field => {
      if (field.id === fieldId) {
        const newOptions = [...(field.options || []), {
          label: 'Option ' + (field.options?.length + 1 || 1),
          value: 'option_' + (field.options?.length + 1 || 1)
        }];
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };
  
  // Update an option value
  const updateOption = (fieldId, index, property, value) => {
    setFields(fields.map(field => {
      if (field.id === fieldId && field.options) {
        const newOptions = [...field.options];
        newOptions[index] = { ...newOptions[index], [property]: value };
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };
  
  // Remove an option
  const removeOption = (fieldId, index) => {
    setFields(fields.map(field => {
      if (field.id === fieldId && field.options) {
        const newOptions = field.options.filter((_, i) => i !== index);
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };
  
  // Save the form
  const saveForm = async () => {
    if (!formName) {
      alert('Please enter a form name');
      return;
    }
    
    const formData = {
      name: formName,
      description: formDescription,
      formType,
      fields,
      designSettings: formDesign
    };
    
    try {
      // This would be an API call in a real implementation
      console.log('Form data to save:', formData);
      // Simulate successful save
      alert('Form saved successfully!');
      router.push('/leadpulse');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form. Please try again.');
    }
  };
  
  // Preview the form - would generate an actual preview in production
  const previewForm = () => {
    alert('Form preview would open here');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/leadpulse')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Form</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={previewForm}>Preview</Button>
          <Button onClick={saveForm}>Save Form</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>
                Configure your form's basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Form Name</Label>
                <Input 
                  id="form-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Contact Form"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="form-description">Description (Optional)</Label>
                <Textarea 
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What is this form for?"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="form-type">Form Type</Label>
                <Select 
                  value={formType}
                  onValueChange={(value) => setFormType(value)}
                >
                  <SelectTrigger id="form-type">
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard Form</SelectItem>
                    <SelectItem value="POPUP">Popup Form</SelectItem>
                    <SelectItem value="EXIT_INTENT">Exit Intent Form</SelectItem>
                    <SelectItem value="EMBEDDED">Embedded Form</SelectItem>
                    <SelectItem value="CHATBOT">Chatbot Form</SelectItem>
                    <SelectItem value="PROGRESSIVE">Progressive Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Form Design</CardTitle>
              <CardDescription>
                Customize how your form looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-theme">Theme</Label>
                <Select 
                  value={formDesign.theme}
                  onValueChange={(value) => setFormDesign({...formDesign, theme: value})}
                >
                  <SelectTrigger id="form-theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    id="primary-color"
                    value={formDesign.primaryColor}
                    onChange={(e) => setFormDesign({...formDesign, primaryColor: e.target.value})}
                    className="h-10 w-10 rounded border"
                  />
                  <Input 
                    value={formDesign.primaryColor}
                    onChange={(e) => setFormDesign({...formDesign, primaryColor: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="button-text">Button Text</Label>
                <Input 
                  id="button-text"
                  value={formDesign.buttonText}
                  onChange={(e) => setFormDesign({...formDesign, buttonText: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="success-message">Success Message</Label>
                <Textarea 
                  id="success-message"
                  value={formDesign.successMessage}
                  onChange={(e) => setFormDesign({...formDesign, successMessage: e.target.value})}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fields">
                    <Settings className="h-4 w-4 mr-2" />
                    Form Fields
                  </TabsTrigger>
                  <TabsTrigger value="design">
                    <Paintbrush className="h-4 w-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="embed">
                    <Code className="h-4 w-4 mr-2" />
                    Embed Code
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="fields" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Form Fields</h3>
                    <Button onClick={addField} size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <MoveVertical className="h-4 w-4 mr-2 text-muted-foreground cursor-move" />
                              <CardTitle className="text-base">{field.label || 'Unnamed Field'}</CardTitle>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeField(field.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardDescription>
                            {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`field-label-${field.id}`}>Field Label</Label>
                              <Input 
                                id={`field-label-${field.id}`}
                                value={field.label}
                                onChange={(e) => updateField(field.id, 'label', e.target.value)}
                                placeholder="Label"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                              <Input 
                                id={`field-name-${field.id}`}
                                value={field.name}
                                onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                placeholder="name"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                              <Select 
                                value={field.type}
                                onValueChange={(value) => updateField(field.id, 'type', value)}
                              >
                                <SelectTrigger id={`field-type-${field.id}`}>
                                  <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
                              <Input 
                                id={`field-placeholder-${field.id}`}
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                                placeholder="Placeholder text"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`field-required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, 'required', checked)}
                            />
                            <Label htmlFor={`field-required-${field.id}`}>Required field</Label>
                          </div>
                          
                          {/* Options for select, checkbox, radio fields */}
                          {(field.type === 'SELECT' || field.type === 'CHECKBOX' || field.type === 'RADIO') && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Options</Label>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => addOption(field.id)}
                                >
                                  Add Option
                                </Button>
                              </div>
                              
                              {field.options && field.options.length > 0 ? (
                                <div className="space-y-2">
                                  {field.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <Input 
                                        value={option.label}
                                        onChange={(e) => updateOption(field.id, optionIndex, 'label', e.target.value)}
                                        placeholder="Option label"
                                        className="flex-1"
                                      />
                                      <Input 
                                        value={option.value}
                                        onChange={(e) => updateOption(field.id, optionIndex, 'value', e.target.value)}
                                        placeholder="Option value"
                                        className="flex-1"
                                      />
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeOption(field.id, optionIndex)}
                                        className="h-8 w-8 text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                                  No options added. Click "Add Option" to add some.
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button onClick={addField} className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Another Field
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="mt-0">
                <div className="text-center p-12 border rounded-md space-y-6">
                  <Paintbrush className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Form Design Preview</h3>
                    <p className="text-muted-foreground">
                      Form appearance customization coming soon...
                    </p>
                  </div>
                  <div>
                    <Button variant="outline">Switch to Advanced Editor</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="embed" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Embed your form</h3>
                    <p className="text-muted-foreground">
                      To embed this form on your website, save it first, then copy and paste this code to your site.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-sm">
                      &lt;div id="leadpulse-form"&gt;&lt;/div&gt;<br />
                      &lt;script src="https://marketsage.africa/api/leadpulse/form.js?id=YOUR_FORM_ID"&gt;&lt;/script&gt;
                    </code>
                  </div>
                  
                  <div>
                    <Button variant="outline" disabled>
                      Copy Code
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 