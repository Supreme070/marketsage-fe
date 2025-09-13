/**
 * LeadPulse Form Submission Component
 * 
 * Demonstrates how to use the new LeadPulse service for form submissions
 * with proper API key authentication for public endpoints.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLeadPulse } from '@/hooks/useLeadPulse';
import type { FormSubmissionDto } from '@/lib/api/types/leadpulse';

interface FormSubmissionProps {
  formId: string;
  apiKey?: string;
  domain?: string;
  onSuccess?: (submission: any) => void;
  onError?: (error: string) => void;
}

export function LeadPulseFormSubmission({
  formId,
  apiKey,
  domain,
  onSuccess,
  onError
}: FormSubmissionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    submission?: any;
  } | null>(null);

  const { submitForm, configurePublicAccess, clearPublicAccess } = useLeadPulse({
    apiKey,
    domain
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formId) {
      setSubmissionResult({
        success: false,
        message: 'Form ID is required'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Configure public access if API key and domain are provided
      if (apiKey && domain) {
        configurePublicAccess(apiKey, domain);
      }

      const submissionData: FormSubmissionDto = {
        formId,
        data: formData,
        context: {
          utmSource: 'website',
          utmMedium: 'form',
          utmCampaign: 'contact',
          referrer: window.location.href
        }
      };

      const submission = await submitForm(submissionData);

      setSubmissionResult({
        success: true,
        message: 'Form submitted successfully!',
        submission
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

      onSuccess?.(submission);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      
      setSubmissionResult({
        success: false,
        message: errorMessage
      });

      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
      
      // Clear public access configuration
      if (apiKey && domain) {
        clearPublicAccess();
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>

        {submissionResult && (
          <Alert className={`mt-4 ${submissionResult.success ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center">
              {submissionResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
              )}
              <AlertDescription>
                {submissionResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {submissionResult?.submission && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Submission Details:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>ID:</strong> {submissionResult.submission.id}</p>
              <p><strong>Status:</strong> {submissionResult.submission.status}</p>
              <p><strong>Score:</strong> {submissionResult.submission.score || 'N/A'}</p>
              <p><strong>Quality:</strong> {submissionResult.submission.quality || 'N/A'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage component
export function LeadPulseFormExample() {
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">LeadPulse Form Integration</h1>
        <p className="text-gray-600">
          Example of using the new LeadPulse service with API key authentication
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key (for public endpoints)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="ms_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              type="text"
              placeholder="https://example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <LeadPulseFormSubmission
        formId="test-form-123"
        apiKey={apiKey}
        domain={domain}
        onSuccess={(submission) => {
          console.log('Form submitted successfully:', submission);
        }}
        onError={(error) => {
          console.error('Form submission failed:', error);
        }}
      />
    </div>
  );
}
