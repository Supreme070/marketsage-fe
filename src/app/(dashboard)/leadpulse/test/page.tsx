/**
 * LeadPulse Integration Test Page
 * 
 * This page tests the new LeadPulse service integration with the backend
 * to verify all functionality works with the new API key security.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  TestTube, 
  Shield, 
  Key,
  Globe
} from 'lucide-react';
import { useLeadPulse } from '@/hooks/useLeadPulse';
import { LeadPulseFormSubmission } from '@/components/leadpulse/LeadPulseFormSubmission';
import { LeadPulseVisitorTracking } from '@/components/leadpulse/LeadPulseVisitorTracking';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function LeadPulseTestPage() {
  const [apiKey, setApiKey] = useState('ms_test1234567890abcdef1234567890abcdef');
  const [domain, setDomain] = useState('http://localhost');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const {
    createForm,
    getForms,
    submitForm,
    createVisitor,
    createTouchpoint,
    getInsights,
    getAnalytics,
    createApiKey,
    getApiKeys,
    configurePublicAccess,
    clearPublicAccess
  } = useLeadPulse({
    apiKey,
    domain
  });

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name 
          ? { ...test, ...updates }
          : test
      )
    );
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      {
        name: 'API Key Authentication',
        test: async () => {
          configurePublicAccess(apiKey, domain);
          // Test with a simple API call
          await getForms({ limit: 1 });
          clearPublicAccess();
        }
      },
      {
        name: 'Form Creation',
        test: async () => {
          const form = await createForm({
            name: 'Test Form',
            description: 'Test form for API verification',
            status: 'DRAFT',
            layout: 'SINGLE_COLUMN',
            fields: [
              {
                type: 'TEXT',
                label: 'Name',
                required: true,
                width: 'FULL',
                order: 1
              },
              {
                type: 'EMAIL',
                label: 'Email',
                required: true,
                width: 'FULL',
                order: 2
              }
            ]
          });
          return form;
        }
      },
      {
        name: 'Form Submission (Public)',
        test: async () => {
          configurePublicAccess(apiKey, domain);
          const submission = await submitForm({
            formId: 'test-form-id',
            data: {
              name: 'Test User',
              email: 'test@example.com'
            },
            context: {
              utmSource: 'test',
              utmMedium: 'api',
              utmCampaign: 'verification'
            }
          });
          clearPublicAccess();
          return submission;
        }
      },
      {
        name: 'Visitor Creation (Public)',
        test: async () => {
          configurePublicAccess(apiKey, domain);
          const visitor = await createVisitor({
            fingerprint: 'test-fingerprint-' + Date.now(),
            ipAddress: '127.0.0.1',
            userAgent: 'Test User Agent',
            country: 'US',
            city: 'Test City'
          });
          clearPublicAccess();
          return visitor;
        }
      },
      {
        name: 'Touchpoint Creation (Public)',
        test: async () => {
          configurePublicAccess(apiKey, domain);
          const touchpoint = await createTouchpoint({
            visitorId: 'test-visitor-id',
            type: 'PAGEVIEW',
            url: 'https://test.example.com',
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          });
          clearPublicAccess();
          return touchpoint;
        }
      },
      {
        name: 'Insights Retrieval',
        test: async () => {
          const insights = await getInsights({ limit: 5 });
          return insights;
        }
      },
      {
        name: 'Analytics Retrieval',
        test: async () => {
          const analytics = await getAnalytics();
          return analytics;
        }
      },
      {
        name: 'API Key Management',
        test: async () => {
          const apiKeys = await getApiKeys();
          return apiKeys;
        }
      }
    ];

    for (const { name, test } of tests) {
      addTestResult({
        name,
        status: 'running'
      });

      try {
        updateTestResult(name, { status: 'running' });
        const result = await test();
        
        updateTestResult(name, {
          status: 'success',
          message: 'Test passed successfully',
          data: result
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateTestResult(name, {
          status: 'error',
          message: errorMessage
        });
      }
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-500" />
          LeadPulse Integration Tests
        </h1>
        <p className="text-gray-600">
          Verify all LeadPulse functionality with the new API key security system
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="ms_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domain
              </Label>
              <Input
                id="domain"
                type="text"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
          </div>
          
          <Button
            onClick={runAllTests}
            disabled={isRunningTests || !apiKey || !domain}
            className="w-full"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-medium">{result.name}</div>
                      {result.message && (
                        <div className="text-sm text-gray-600">{result.message}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Submission Test</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadPulseFormSubmission
              formId="test-form-123"
              apiKey={apiKey}
              domain={domain}
              onSuccess={(submission) => {
                console.log('Form submission test successful:', submission);
              }}
              onError={(error) => {
                console.error('Form submission test failed:', error);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitor Tracking Test</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadPulseVisitorTracking
              apiKey={apiKey}
              domain={domain}
              onVisitorCreated={(visitor) => {
                console.log('Visitor creation test successful:', visitor);
              }}
              onTouchpointCreated={(touchpoint) => {
                console.log('Touchpoint creation test successful:', touchpoint);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>API Key Authentication:</strong> All public endpoints require valid API keys
              </AlertDescription>
            </Alert>
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Domain Whitelisting:</strong> Requests are validated against whitelisted domains
              </AlertDescription>
            </Alert>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Organization Scoped:</strong> API keys are scoped to specific organizations
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Audit Logging:</strong> All API key usage is logged and tracked
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
