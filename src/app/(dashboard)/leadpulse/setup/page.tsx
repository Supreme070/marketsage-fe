'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Check, RefreshCw, Code, Globe, SmartphoneNfc } from 'lucide-react';

export default function LeadPulseSetupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tracking');
  const [pixelId, setPixelId] = useState('lp_2g3h4j2k3h4kj23h4'); // Would be fetched from API
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState({
    name: 'WhatsApp Lead Form',
    number: '+2348012345678',
    message: 'Hello, I would like to learn more about your services.',
  });
  
  // Generate WhatsApp QR code URL
  const whatsappUrl = `https://wa.me/${qrCode.number.replace(/\D/g, '')}${qrCode.message ? `?text=${encodeURIComponent(qrCode.message)}` : ''}`;
  
  // Get tracking code
  const trackingCode = `
<!-- LeadPulse Tracking Code -->
<script>
(function(w, d, p) {
  // Don't initialize twice
  if (w.LeadPulse) return;
  
  // Configuration
  const pixelId = '${pixelId}';
  const endpoint = 'https://marketsage.africa/api/leadpulse/track';
  
  // Main LeadPulse object
  const lp = w.LeadPulse = {};
  let visitorId = null;
  let fingerprint = null;
  let sessionStartTime = Date.now();
  
  // Initialize storage
  function initStorage() {
    try {
      lp.storage = localStorage;
      // Test storage
      lp.storage.setItem('LP_TEST', '1');
      lp.storage.removeItem('LP_TEST');
    } catch (e) {
      // Fallback to cookie-based storage if localStorage is unavailable
      lp.storage = {
        getItem: function(key) {
          const matches = d.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
          return matches ? decodeURIComponent(matches[1]) : null;
        },
        setItem: function(key, value) {
          d.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
        }
      };
    }
    
    // Try to get existing visitor ID
    visitorId = lp.storage.getItem('LP_VID');
    fingerprint = lp.storage.getItem('LP_FP');
  }
  
  // Initialize visitor tracking
  function initVisitor() {
    // Initialize and send ping
    fetch(endpoint + '/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId,
        fingerprint: fingerprint || '',
        existingId: visitorId || null,
        userAgent: navigator.userAgent,
        referrer: d.referrer,
        url: w.location.href
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.visitorId) {
        visitorId = data.visitorId;
        lp.storage.setItem('LP_VID', visitorId);
      }
    })
    .catch(() => {});
  }
  
  // Initialize tracking
  initStorage();
  initVisitor();
})(window, document);
</script>
<!-- End LeadPulse Tracking Code -->
`.trim();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Save website settings
  const saveSettings = () => {
    alert('Settings saved successfully!');
  };
  
  // Generate new pixel ID
  const generateNewPixelId = () => {
    const newId = 'lp_' + Math.random().toString(36).substring(2, 15);
    setPixelId(newId);
  };
  
  // Save QR code settings
  const saveQrCode = () => {
    alert('WhatsApp QR code settings saved!');
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
          <h1 className="text-3xl font-bold tracking-tight">LeadPulse Setup</h1>
        </div>
        <Button onClick={saveSettings}>Save Changes</Button>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking">
            <Code className="h-4 w-4 mr-2" />
            Tracking Code
          </TabsTrigger>
          <TabsTrigger value="website">
            <Globe className="h-4 w-4 mr-2" />
            Website Settings
          </TabsTrigger>
          <TabsTrigger value="qrcode">
            <SmartphoneNfc className="h-4 w-4 mr-2" />
            WhatsApp QR Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your LeadPulse Tracking Code</CardTitle>
              <CardDescription>
                Add this code to your website to start tracking visitor behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Your Pixel ID</Label>
                  <div className="flex items-center mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {pixelId}
                    </code>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={generateNewPixelId}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New ID
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tracking Code</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(trackingCode)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea 
                    value={trackingCode}
                    readOnly
                    className="font-mono text-xs h-80 overflow-auto"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Implementation Instructions</Label>
                <div className="text-sm space-y-4 border rounded-md p-4">
                  <p>
                    To start tracking visitor behavior on your website, add the tracking code above to every page of your website, immediately before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag.
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Copy the code above</li>
                    <li>Open your website's HTML template or header section</li>
                    <li>Paste the code before the closing <code className="bg-muted px-1 rounded">&lt;/head&gt;</code> tag</li>
                    <li>Save your changes and deploy your website</li>
                    <li>Return to MarketSage to verify the installation</li>
                  </ol>
                  <p>
                    Once installed, LeadPulse will begin tracking visitor behavior, engagement, and interactions automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Installation Status</CardTitle>
              <CardDescription>
                Check if your tracking code is properly installed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Badge className="bg-yellow-500">Pending</Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  We haven't detected the tracking code on your website yet. Please install the code and check again.
                </span>
              </div>
              <Button className="mt-4" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Installation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="website" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Configuration</CardTitle>
              <CardDescription>
                Configure LeadPulse for your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input 
                  id="website-url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the URL of the website where LeadPulse will be installed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Tracking Options</Label>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-clicks" defaultChecked />
                      <Label htmlFor="track-clicks" className="text-sm font-normal">Track Click Events</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-forms" defaultChecked />
                      <Label htmlFor="track-forms" className="text-sm font-normal">Track Form Interactions</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-scroll" defaultChecked />
                      <Label htmlFor="track-scroll" className="text-sm font-normal">Track Scroll Depth</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="track-exit" defaultChecked />
                      <Label htmlFor="track-exit" className="text-sm font-normal">Track Exit Intent</Label>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Privacy Settings</Label>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="respect-dnt" defaultChecked />
                      <Label htmlFor="respect-dnt" className="text-sm font-normal">Respect Do Not Track</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="anonymize-ip" defaultChecked />
                      <Label htmlFor="anonymize-ip" className="text-sm font-normal">Anonymize IP Addresses</Label>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    These settings help ensure compliance with privacy regulations such as NDPR
                  </p>
                </div>
              </div>
              
              <Button onClick={saveSettings}>Save Website Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qrcode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp QR Code Generator</CardTitle>
              <CardDescription>
                Create QR codes for offline-to-online lead capture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="qr-name">QR Code Name</Label>
                <Input 
                  id="qr-name"
                  value={qrCode.name}
                  onChange={(e) => setQrCode({...qrCode, name: e.target.value})}
                  placeholder="e.g. Contact Form"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <Input 
                  id="whatsapp-number"
                  value={qrCode.number}
                  onChange={(e) => setQrCode({...qrCode, number: e.target.value})}
                  placeholder="+2348012345678"
                />
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g. +234 for Nigeria)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp-message">Pre-filled Message (Optional)</Label>
                <Textarea 
                  id="whatsapp-message"
                  value={qrCode.message}
                  onChange={(e) => setQrCode({...qrCode, message: e.target.value})}
                  placeholder="Hello, I would like to learn more about your services."
                  rows={3}
                />
              </div>
              
              <div className="bg-muted rounded-md p-6 flex flex-col items-center justify-center">
                <div className="mb-4 w-48 h-48 bg-white flex items-center justify-center rounded-md border-2">
                  {/* This would be a real QR code in production */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">QR Code Preview</p>
                    <p className="text-xs">WhatsApp Link:</p>
                    <p className="text-xs font-mono truncate max-w-32">{whatsappUrl}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(whatsappUrl)}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">Download QR</Button>
                </div>
              </div>
              
              <Button onClick={saveQrCode}>Save QR Code</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your QR Codes</CardTitle>
              <CardDescription>
                Manage your existing WhatsApp QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  No QR codes have been created yet.
                </p>
                <p className="text-muted-foreground text-sm">
                  Create your first QR code using the form above.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 