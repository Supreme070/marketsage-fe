/**
 * LeadPulse Form Settings Panel
 * 
 * Configuration panel for form-level settings
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Target, 
  Mail, 
  ExternalLink,
  Bell,
  Database,
  Eye,
  Lock
} from 'lucide-react';

interface FormSettings {
  name: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  layout: 'SINGLE_COLUMN' | 'DOUBLE_COLUMN' | 'CUSTOM';
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  redirectUrl?: string;
  isTrackingEnabled: boolean;
  conversionGoal?: string;
  settings: {
    allowMultipleSubmissions?: boolean;
    requireEmailVerification?: boolean;
    enableSpamProtection?: boolean;
    enableFileUploads?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    enableProgressBar?: boolean;
    autoSave?: boolean;
    enableCaptcha?: boolean;
    emailNotifications?: {
      enabled: boolean;
      recipients: string[];
      subject?: string;
    };
    webhooks?: {
      enabled: boolean;
      url?: string;
      events: string[];
    };
  };
  theme: Record<string, any>;
}

interface FormSettingsPanelProps {
  form: FormSettings;
  onChange: (updates: Partial<FormSettings>) => void;
  onSave: () => void;
  loading?: boolean;
}

export function FormSettingsPanel({ 
  form, 
  onChange, 
  onSave, 
  loading = false 
}: FormSettingsPanelProps) {
  const updateSettings = (key: string, value: any) => {
    onChange({
      settings: {
        ...form.settings,
        [key]: value
      }
    });
  };

  const updateEmailNotifications = (key: string, value: any) => {
    onChange({
      settings: {
        ...form.settings,
        emailNotifications: {
          ...form.settings.emailNotifications,
          [key]: value
        }
      }
    });
  };

  const updateWebhooks = (key: string, value: any) => {
    onChange({
      settings: {
        ...form.settings,
        webhooks: {
          ...form.settings.webhooks,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Form Information
              </CardTitle>
              <CardDescription>
                Basic information about your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={form.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="Contact Form"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-status">Status</Label>
                  <Select 
                    value={form.status} 
                    onValueChange={(value) => onChange({ status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Draft</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="PUBLISHED">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Published</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="ARCHIVED">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Archived</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  value={form.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="Get in touch with us"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Description (Optional)</Label>
                <Textarea
                  id="form-description"
                  value={form.description || ''}
                  onChange={(e) => onChange({ description: e.target.value })}
                  placeholder="Brief description of the form purpose"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-layout">Layout</Label>
                <Select 
                  value={form.layout} 
                  onValueChange={(value) => onChange({ layout: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_COLUMN">Single Column</SelectItem>
                    <SelectItem value="DOUBLE_COLUMN">Double Column</SelectItem>
                    <SelectItem value="CUSTOM">Custom Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages & Actions</CardTitle>
              <CardDescription>
                Customize form messages and post-submission behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submit-button">Submit Button Text</Label>
                <Input
                  id="submit-button"
                  value={form.submitButtonText}
                  onChange={(e) => onChange({ submitButtonText: e.target.value })}
                  placeholder="Submit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success-message">Success Message</Label>
                <Textarea
                  id="success-message"
                  value={form.successMessage}
                  onChange={(e) => onChange({ successMessage: e.target.value })}
                  placeholder="Thank you for your submission!"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-message">Error Message</Label>
                <Textarea
                  id="error-message"
                  value={form.errorMessage}
                  onChange={(e) => onChange({ errorMessage: e.target.value })}
                  placeholder="Something went wrong. Please try again."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirect-url">Redirect URL (Optional)</Label>
                <Input
                  id="redirect-url"
                  value={form.redirectUrl || ''}
                  onChange={(e) => onChange({ redirectUrl: e.target.value })}
                  placeholder="https://example.com/thank-you"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Form Behavior
              </CardTitle>
              <CardDescription>
                Configure how your form behaves and tracks interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics Tracking</Label>
                  <p className="text-sm text-gray-600">Track form views and conversions</p>
                </div>
                <Switch
                  checked={form.isTrackingEnabled}
                  onCheckedChange={(checked) => onChange({ isTrackingEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Multiple Submissions</Label>
                  <p className="text-sm text-gray-600">Allow users to submit multiple times</p>
                </div>
                <Switch
                  checked={form.settings.allowMultipleSubmissions || false}
                  onCheckedChange={(checked) => updateSettings('allowMultipleSubmissions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save Progress</Label>
                  <p className="text-sm text-gray-600">Save form data as users type</p>
                </div>
                <Switch
                  checked={form.settings.autoSave || false}
                  onCheckedChange={(checked) => updateSettings('autoSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Progress Bar</Label>
                  <p className="text-sm text-gray-600">Display completion progress</p>
                </div>
                <Switch
                  checked={form.settings.enableProgressBar || false}
                  onCheckedChange={(checked) => updateSettings('enableProgressBar', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversion-goal">Conversion Goal (Optional)</Label>
                <Input
                  id="conversion-goal"
                  value={form.conversionGoal || ''}
                  onChange={(e) => onChange({ conversionGoal: e.target.value })}
                  placeholder="Lead Generation"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure email notifications for form submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-gray-600">Send emails when forms are submitted</p>
                </div>
                <Switch
                  checked={form.settings.emailNotifications?.enabled || false}
                  onCheckedChange={(checked) => updateEmailNotifications('enabled', checked)}
                />
              </div>

              {form.settings.emailNotifications?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email-recipients">Recipients</Label>
                    <Input
                      id="email-recipients"
                      value={form.settings.emailNotifications?.recipients?.join(', ') || ''}
                      onChange={(e) => updateEmailNotifications('recipients', e.target.value.split(',').map(email => email.trim()))}
                      placeholder="admin@example.com, sales@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input
                      id="email-subject"
                      value={form.settings.emailNotifications?.subject || ''}
                      onChange={(e) => updateEmailNotifications('subject', e.target.value)}
                      placeholder="New form submission received"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Send form data to external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Webhooks</Label>
                  <p className="text-sm text-gray-600">Send HTTP requests on form events</p>
                </div>
                <Switch
                  checked={form.settings.webhooks?.enabled || false}
                  onCheckedChange={(checked) => updateWebhooks('enabled', checked)}
                />
              </div>

              {form.settings.webhooks?.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={form.settings.webhooks?.url || ''}
                    onChange={(e) => updateWebhooks('url', e.target.value)}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security & Validation
              </CardTitle>
              <CardDescription>
                Protect your form from spam and abuse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Spam Protection</Label>
                  <p className="text-sm text-gray-600">Automatically filter spam submissions</p>
                </div>
                <Switch
                  checked={form.settings.enableSpamProtection || false}
                  onCheckedChange={(checked) => updateSettings('enableSpamProtection', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CAPTCHA Verification</Label>
                  <p className="text-sm text-gray-600">Require CAPTCHA for submissions</p>
                </div>
                <Switch
                  checked={form.settings.enableCaptcha || false}
                  onCheckedChange={(checked) => updateSettings('enableCaptcha', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification</Label>
                  <p className="text-sm text-gray-600">Require email verification for submissions</p>
                </div>
                <Switch
                  checked={form.settings.requireEmailVerification || false}
                  onCheckedChange={(checked) => updateSettings('requireEmailVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>File Uploads</Label>
                  <p className="text-sm text-gray-600">Allow file upload fields</p>
                </div>
                <Switch
                  checked={form.settings.enableFileUploads || false}
                  onCheckedChange={(checked) => updateSettings('enableFileUploads', checked)}
                />
              </div>

              {form.settings.enableFileUploads && (
                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={form.settings.maxFileSize || 10}
                    onChange={(e) => updateSettings('maxFileSize', Number.parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}