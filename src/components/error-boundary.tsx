'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDialog?: boolean; // Show Sentry feedback dialog
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  eventId?: string;
}

/**
 * Enhanced Error Boundary with Sentry Integration
 * Catches JavaScript errors in the component tree and reports them to Sentry
 * Displays a user-friendly fallback UI with option to send feedback
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('UI Error caught by boundary:', error, errorInfo);
    }

    this.setState({ errorInfo });

    // Capture error in Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel('error');

      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto my-8">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription>
              We encountered an error while rendering this component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
            
            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <div className="mt-4">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium mb-2">Stack trace</summary>
                  <pre className="overflow-auto p-2 bg-muted rounded-md">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={this.handleReset}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {this.props.showDialog && this.state.eventId && (
              <Button
                onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                className="flex-1"
                variant="default"
              >
                Report Feedback
              </Button>
            )}
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 