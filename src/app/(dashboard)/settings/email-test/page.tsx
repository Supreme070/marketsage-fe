'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Send, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';

interface TestEmailResult {
  success: boolean;
  message?: string;
  details?: any;
  error?: string;
}

export default function EmailTestPage() {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: 'Test Email from MarketSage',
    content: 'This is a test email to verify MarketSage email configuration is working correctly.',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestEmailResult[]>([]);
  const [emailConfig, setEmailConfig] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  const sendTestEmail = async (to: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          to,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setEmailConfig(result.details?.configuration);
      }
      
      return {
        success: response.ok && result.success,
        message: result.message || (result.success ? 'Email sent successfully' : 'Failed to send email'),
        details: result.details,
        error: result.error || result.details,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToSingle = async () => {
    if (!emailData.to.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    const result = await sendTestEmail(emailData.to);
    setResults([result]);
  };

  const handleSendToDefaults = async () => {
    const defaultEmails = ['marketsageltd@gmail.com', 'kolajoseph87@gmail.com'];
    const results: TestEmailResult[] = [];
    
    for (const email of defaultEmails) {
      const result = await sendTestEmail(email);
      results.push({ ...result, recipient: email } as any);
      
      // Small delay between emails
      if (defaultEmails.indexOf(email) < defaultEmails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setResults(results);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Configuration Test
          </h1>
          <p className="text-muted-foreground mt-2">
            Test your email configuration to ensure MarketSage can send emails successfully.
          </p>
        </div>

        {/* Email Configuration Info */}
        {emailConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Email Provider:</Label>
                  <p className="text-muted-foreground">{emailConfig.emailProvider}</p>
                </div>
                <div>
                  <Label className="font-medium">SMTP Host:</Label>
                  <p className="text-muted-foreground">{emailConfig.smtpHost}</p>
                </div>
                <div>
                  <Label className="font-medium">SMTP Port:</Label>
                  <p className="text-muted-foreground">{emailConfig.smtpPort}</p>
                </div>
                <div>
                  <Label className="font-medium">From Address:</Label>
                  <p className="text-muted-foreground">{emailConfig.from}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Configure and send test emails to verify your email setup is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Recipient Email</Label>
              <Input
                id="to"
                type="email"
                placeholder="Enter email address"
                value={emailData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={emailData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Email content"
                rows={4}
                value={emailData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSendToSingle}
                disabled={isLoading || !emailData.to.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test Email
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSendToDefaults}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send to Default Recipients
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Default recipients:</strong> marketsageltd@gmail.com, kolajoseph87@gmail.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <Alert 
                  key={index} 
                  className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">
                            {(result as any).recipient && `To: ${(result as any).recipient} - `}
                            {result.message}
                          </p>
                          
                          {result.success && result.details && (
                            <div className="text-sm text-muted-foreground">
                              <p><strong>Message ID:</strong> {result.details.messageId}</p>
                              <p><strong>Provider:</strong> {result.details.provider}</p>
                            </div>
                          )}
                          
                          {!result.success && result.error && (
                            <div className="text-sm text-red-700">
                              <p><strong>Error:</strong> {result.error}</p>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <h4 className="font-medium mb-2">Current Configuration (Zoho SMTP):</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Provider: SMTP (Zoho Pro)</li>
                <li>Host: smtppro.zoho.com</li>
                <li>Port: 465 (SSL)</li>
                <li>Username: info@marketsage.africa</li>
                <li>From: info@marketsage.africa</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Troubleshooting:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>If emails are not received, check spam/junk folders</li>
                <li>Verify SMTP credentials are correct in .env file</li>
                <li>Check that the sending domain is properly configured</li>
                <li>Ensure firewall/network allows SMTP connections</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}