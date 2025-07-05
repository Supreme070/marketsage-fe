'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  messageId?: string;
  provider?: string;
  error?: string;
  environment?: any;
}

export default function TestEmailPage() {
  const [isTestingQuick, setIsTestingQuick] = useState(false);
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [quickResult, setQuickResult] = useState<TestResult | null>(null);
  const [customResult, setCustomResult] = useState<TestResult | null>(null);
  
  // Custom email form state
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: 'MarketSage Test Email',
    message: 'This is a test email from MarketSage application. If you receive this, the email configuration is working perfectly!'
  });

  const runQuickTest = async () => {
    setIsTestingQuick(true);
    setQuickResult(null);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'GET',
      });
      
      const result = await response.json();
      setQuickResult(result);
    } catch (error) {
      setQuickResult({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingQuick(false);
    }
  };

  const sendCustomTest = async () => {
    if (!customEmail.to || !customEmail.subject || !customEmail.message) {
      setCustomResult({
        success: false,
        message: 'Please fill in all fields',
        error: 'Missing required fields'
      });
      return;
    }

    setIsTestingCustom(true);
    setCustomResult(null);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customEmail),
      });
      
      const result = await response.json();
      setCustomResult(result);
    } catch (error) {
      setCustomResult({
        success: false,
        message: 'Failed to send custom test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  const ResultAlert = ({ result }: { result: TestResult }) => (
    <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className="flex-1">
          <div className="font-medium">{result.message}</div>
          {result.messageId && (
            <div className="text-sm text-gray-600 mt-1">Message ID: {result.messageId}</div>
          )}
          {result.provider && (
            <div className="text-sm text-gray-600 mt-1">Provider: {result.provider}</div>
          )}
          {result.error && (
            <div className="text-sm text-red-600 mt-1">Error: {result.error}</div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Testing Center</h1>
          <p className="text-gray-600 dark:text-gray-300">Test your Zoho email integration with MarketSage</p>
        </div>
      </div>

      {/* Email Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Email Configuration
          </CardTitle>
          <CardDescription>
            Your MarketSage application email settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-500">Provider</Label>
              <Badge variant="secondary">Zoho SMTP</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-500">From Address</Label>
              <div className="text-sm font-mono">info@marketsage.africa</div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-500">SMTP Host</Label>
              <div className="text-sm font-mono">smtp.zoho.com</div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Ready to Test
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Quick Test
            </CardTitle>
            <CardDescription>
              Send a pre-configured test email to verify your setup is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              This will send a test email to <code className="bg-gray-100 px-1 rounded">your-email@example.com</code>.
              Make sure to update the email address in the code for actual testing.
            </div>
            <Button 
              onClick={runQuickTest} 
              disabled={isTestingQuick}
              className="w-full"
            >
              {isTestingQuick ? 'Sending...' : 'Send Quick Test Email'}
            </Button>
            {quickResult && <ResultAlert result={quickResult} />}
          </CardContent>
        </Card>

        {/* Custom Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Custom Test
            </CardTitle>
            <CardDescription>
              Send a custom test email to any address with your own content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">To Email Address</Label>
              <Input
                id="to"
                type="email"
                placeholder="test@example.com"
                value={customEmail.to}
                onChange={(e) => setCustomEmail({ ...customEmail, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Test email subject"
                value={customEmail.subject}
                onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Your test message content..."
                value={customEmail.message}
                onChange={(e) => setCustomEmail({ ...customEmail, message: e.target.value })}
                rows={4}
              />
            </div>
            <Button 
              onClick={sendCustomTest} 
              disabled={isTestingCustom}
              className="w-full"
            >
              {isTestingCustom ? 'Sending...' : 'Send Custom Test Email'}
            </Button>
            {customResult && <ResultAlert result={customResult} />}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to configure your Zoho email for production use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📧 To use your Zoho email:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Update your <code className="bg-blue-100 px-1 rounded">.env</code> file with your actual Zoho password</li>
                <li>Replace <code className="bg-blue-100 px-1 rounded">SMTP_PASS=your-zoho-password-here</code> with your real password</li>
                <li>For production, consider using Zoho app-specific passwords for better security</li>
                <li>Update the test email address in the Quick Test to your actual email</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✅ Your current configuration:</h4>
              <div className="text-sm text-green-800 font-mono space-y-1">
                <div>EMAIL_PROVIDER=smtp</div>
                <div>SMTP_HOST=smtp.zoho.com</div>
                <div>SMTP_PORT=587</div>
                <div>SMTP_USER=info@marketsage.africa</div>
                <div>FROM=info@marketsage.africa</div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 mb-2">⚠️ Important Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                <li>Ensure your Zoho account has SMTP access enabled</li>
                <li>Check spam folders if test emails don't arrive</li>
                <li>For production, implement proper error handling and retry logic</li>
                <li>Consider setting up email webhooks for delivery tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}