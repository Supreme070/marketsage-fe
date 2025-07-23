/**
 * Map Export and Sharing Component
 * 
 * Advanced export and sharing capabilities for the visitor map including
 * multiple formats, custom reports, and collaboration features.
 */

'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Share, 
  Copy, 
  Link, 
  Mail, 
  FileText, 
  Image, 
  FileSpreadsheet,
  Calendar,
  Clock,
  Users,
  Globe,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  X,
  RefreshCw,
  Upload,
  ExternalLink,
  QrCode,
  Printer,
  Camera,
  Video,
  Presentation,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Target,
  Activity,
  TrendingUp,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Heart,
  Bookmark,
  Flag,
  Plus,
  Minus,
  Filter,
  Search,
  Layers,
  Zap,
  Sparkles,
  Award,
  Send,
  MessageSquare,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Slack,
  Teams,
  Figma,
  Github
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'svg' | 'json' | 'csv' | 'xlsx' | 'pptx';
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  includeData: boolean;
  includeInsights: boolean;
  includeMetrics: boolean;
  customBranding: boolean;
  watermark: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  annotations: Array<{
    id: string;
    text: string;
    position: { x: number; y: number };
    type: 'note' | 'highlight' | 'arrow';
  }>;
}

interface ShareOptions {
  method: 'link' | 'email' | 'social' | 'embed' | 'qr';
  privacy: 'public' | 'private' | 'password' | 'domain';
  expiration: 'never' | '1h' | '24h' | '7d' | '30d' | 'custom';
  permissions: 'view' | 'comment' | 'edit';
  recipients: string[];
  message: string;
  allowDownload: boolean;
  trackViews: boolean;
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  options: ExportOptions;
  isDefault: boolean;
  thumbnail: string;
}

interface SharedMap {
  id: string;
  name: string;
  shareUrl: string;
  createdAt: Date;
  expiresAt: Date | null;
  viewCount: number;
  isActive: boolean;
  privacy: string;
  permissions: string;
}

interface MapExportSharingProps {
  mapData: any;
  visitorLocations: VisitorLocation[];
  onExport: (options: ExportOptions) => Promise<void>;
  onShare: (options: ShareOptions) => Promise<string>;
  exportTemplates?: ExportTemplate[];
  sharedMaps?: SharedMap[];
}

/**
 * Map Export and Sharing Component
 */
export function MapExportSharing({
  mapData,
  visitorLocations,
  onExport,
  onShare,
  exportTemplates = [],
  sharedMaps = []
}: MapExportSharingProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'share' | 'templates' | 'history'>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    resolution: 'high',
    includeData: true,
    includeInsights: true,
    includeMetrics: true,
    customBranding: false,
    watermark: true,
    dateRange: { start: null, end: null },
    annotations: []
  });
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    method: 'link',
    privacy: 'private',
    expiration: '7d',
    permissions: 'view',
    recipients: [],
    message: '',
    allowDownload: true,
    trackViews: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Export formats with descriptions
  const exportFormats = [
    { value: 'png', label: 'PNG Image', description: 'High quality image format' },
    { value: 'jpg', label: 'JPG Image', description: 'Compressed image format' },
    { value: 'pdf', label: 'PDF Document', description: 'Portable document format' },
    { value: 'svg', label: 'SVG Vector', description: 'Scalable vector graphics' },
    { value: 'json', label: 'JSON Data', description: 'Raw data export' },
    { value: 'csv', label: 'CSV Spreadsheet', description: 'Comma-separated values' },
    { value: 'xlsx', label: 'Excel Spreadsheet', description: 'Microsoft Excel format' },
    { value: 'pptx', label: 'PowerPoint', description: 'Presentation format' }
  ];

  // Resolution options
  const resolutions = [
    { value: 'low', label: 'Low (800x600)', description: 'Small file size' },
    { value: 'medium', label: 'Medium (1920x1080)', description: 'Standard quality' },
    { value: 'high', label: 'High (2560x1440)', description: 'High quality' },
    { value: 'ultra', label: 'Ultra (3840x2160)', description: 'Maximum quality' }
  ];

  // Share methods
  const shareMethods = [
    { value: 'link', label: 'Share Link', icon: Link },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'social', label: 'Social Media', icon: Share },
    { value: 'embed', label: 'Embed Code', icon: ExternalLink },
    { value: 'qr', label: 'QR Code', icon: QrCode }
  ];

  // Update export options
  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  // Update share options
  const updateShareOptions = (updates: Partial<ShareOptions>) => {
    setShareOptions(prev => ({ ...prev, ...updates }));
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Reset after delay
      setTimeout(() => {
        setExportProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = await onShare(shareOptions);
      setShareUrl(url);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Add recipient
  const addRecipient = () => {
    if (recipientEmail && !shareOptions.recipients.includes(recipientEmail)) {
      updateShareOptions({
        recipients: [...shareOptions.recipients, recipientEmail]
      });
      setRecipientEmail('');
    }
  };

  // Remove recipient
  const removeRecipient = (email: string) => {
    updateShareOptions({
      recipients: shareOptions.recipients.filter(r => r !== email)
    });
  };

  // Save as template
  const saveAsTemplate = () => {
    if (!customTemplateName) return;
    
    const template: ExportTemplate = {
      id: Date.now().toString(),
      name: customTemplateName,
      description: `Custom template for ${exportOptions.format.toUpperCase()} export`,
      format: exportOptions.format,
      options: exportOptions,
      isDefault: false,
      thumbnail: '/api/placeholder/200/150'
    };

    // This would typically save to backend
    console.log('Saving template:', template);
    setCustomTemplateName('');
  };

  // Load template
  const loadTemplate = (template: ExportTemplate) => {
    setExportOptions(template.options);
  };

  // Get export file size estimate
  const getFileSizeEstimate = () => {
    const baseSize = exportOptions.resolution === 'low' ? 500 : 
                    exportOptions.resolution === 'medium' ? 1200 : 
                    exportOptions.resolution === 'high' ? 2400 : 4800;
    
    const dataMultiplier = exportOptions.includeData ? 1.5 : 1;
    const insightsMultiplier = exportOptions.includeInsights ? 1.3 : 1;
    
    return Math.round(baseSize * dataMultiplier * insightsMultiplier);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Share Map
          </CardTitle>
          <CardDescription>
            Export your visitor map or share it with others
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(value) => updateExportOptions({ format: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-sm text-muted-foreground">{format.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              {['png', 'jpg', 'pdf'].includes(exportOptions.format) && (
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select 
                    value={exportOptions.resolution} 
                    onValueChange={(value) => updateExportOptions({ resolution: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutions.map(res => (
                        <SelectItem key={res.value} value={res.value}>
                          <div>
                            <div className="font-medium">{res.label}</div>
                            <div className="text-sm text-muted-foreground">{res.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Include Options */}
              <div className="space-y-4">
                <Label>Include in Export</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeData"
                      checked={exportOptions.includeData}
                      onCheckedChange={(checked) => updateExportOptions({ includeData: checked as boolean })}
                    />
                    <label htmlFor="includeData" className="text-sm">Raw Data</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeInsights"
                      checked={exportOptions.includeInsights}
                      onCheckedChange={(checked) => updateExportOptions({ includeInsights: checked as boolean })}
                    />
                    <label htmlFor="includeInsights" className="text-sm">AI Insights</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetrics"
                      checked={exportOptions.includeMetrics}
                      onCheckedChange={(checked) => updateExportOptions({ includeMetrics: checked as boolean })}
                    />
                    <label htmlFor="includeMetrics" className="text-sm">Performance Metrics</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customBranding"
                      checked={exportOptions.customBranding}
                      onCheckedChange={(checked) => updateExportOptions({ customBranding: checked as boolean })}
                    />
                    <label htmlFor="customBranding" className="text-sm">Custom Branding</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="watermark"
                      checked={exportOptions.watermark}
                      onCheckedChange={(checked) => updateExportOptions({ watermark: checked as boolean })}
                    />
                    <label htmlFor="watermark" className="text-sm">Watermark</label>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Advanced Options</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    {showAdvancedOptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showAdvancedOptions && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Save as Template</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Template name"
                          value={customTemplateName}
                          onChange={(e) => setCustomTemplateName(e.target.value)}
                        />
                        <Button onClick={saveAsTemplate} disabled={!customTemplateName}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Export Summary</h4>
                <div className="space-y-1 text-sm">
                  <div>Format: {exportOptions.format.toUpperCase()}</div>
                  <div>Resolution: {exportOptions.resolution}</div>
                  <div>Estimated Size: {getFileSizeEstimate()} KB</div>
                  <div>Includes: {[
                    exportOptions.includeData && 'Data',
                    exportOptions.includeInsights && 'Insights',
                    exportOptions.includeMetrics && 'Metrics'
                  ].filter(Boolean).join(', ')}</div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Map
                    </>
                  )}
                </Button>
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Export Progress</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Share Method */}
              <div className="space-y-2">
                <Label>Share Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shareMethods.map(method => (
                    <Button
                      key={method.value}
                      variant={shareOptions.method === method.value ? 'default' : 'outline'}
                      onClick={() => updateShareOptions({ method: method.value as any })}
                      className="flex items-center gap-2"
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-2">
                <Label>Privacy</Label>
                <Select 
                  value={shareOptions.privacy} 
                  onValueChange={(value) => updateShareOptions({ privacy: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone with link</SelectItem>
                    <SelectItem value="private">Private - Invited users only</SelectItem>
                    <SelectItem value="password">Password Protected</SelectItem>
                    <SelectItem value="domain">Domain Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label>Permissions</Label>
                <Select 
                  value={shareOptions.permissions} 
                  onValueChange={(value) => updateShareOptions({ permissions: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="comment">View & Comment</SelectItem>
                    <SelectItem value="edit">View & Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select 
                  value={shareOptions.expiration} 
                  onValueChange={(value) => updateShareOptions({ expiration: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipients for Email/Private */}
              {(shareOptions.method === 'email' || shareOptions.privacy === 'private') && (
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                      <Button onClick={addRecipient} disabled={!recipientEmail}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shareOptions.recipients.map(email => (
                        <Badge key={email} variant="secondary">
                          {email}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipient(email)}
                            className="ml-2 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Textarea
                  placeholder="Add a message for recipients..."
                  value={shareOptions.message}
                  onChange={(e) => updateShareOptions({ message: e.target.value })}
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowDownload"
                    checked={shareOptions.allowDownload}
                    onCheckedChange={(checked) => updateShareOptions({ allowDownload: checked as boolean })}
                  />
                  <label htmlFor="allowDownload" className="text-sm">Allow Download</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackViews"
                    checked={shareOptions.trackViews}
                    onCheckedChange={(checked) => updateShareOptions({ trackViews: checked as boolean })}
                  />
                  <label htmlFor="trackViews" className="text-sm">Track Views</label>
                </div>
              </div>

              {/* Share Button */}
              <Button 
                onClick={handleShare}
                disabled={isSharing}
                className="w-full"
              >
                {isSharing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Share Link...
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>

              {/* Share URL */}
              {shareUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Share URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={shareUrl} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(shareUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                        <img 
                          src={template.thumbnail} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.format.toUpperCase()}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(template)}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {exportTemplates.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates available</p>
                    <p className="text-sm">Create templates from the Export tab</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedMaps.map(map => (
                  <div key={map.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{map.name}</h4>
                        <Badge variant={map.isActive ? 'default' : 'secondary'}>
                          {map.isActive ? 'Active' : 'Expired'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {map.createdAt.toLocaleDateString()}</span>
                        <span>Views: {map.viewCount}</span>
                        <span>Privacy: {map.privacy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(map.shareUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(map.shareUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {sharedMaps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shared maps yet</p>
                    <p className="text-sm">Create share links from the Share tab</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MapExportSharing;