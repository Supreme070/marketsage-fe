'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { FileQuestion, Home, Search } from 'lucide-react';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function NotFound() {
  useEffect(() => {
    // Log the 404 for analytics
    logger.info('404 page accessed', {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileQuestion className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Page Not Found</CardTitle>
              <CardDescription>
                We couldn't find the page you were looking for
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-muted p-4 rounded-md bg-muted/50">
            <p className="text-muted-foreground text-sm">
              The page you are trying to access may have been moved, deleted, or
              might never have existed. Please check the URL and try again.
            </p>
          </div>
          
          <div className="rounded-lg bg-primary/5 p-6 flex flex-col items-center justify-center">
            <p className="text-6xl font-bold text-primary">404</p>
            <p className="text-sm text-muted-foreground mt-2">
              Page not found
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between space-x-4">
          <Button 
            variant="outline" 
            className="w-1/2"
            asChild
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button 
            className="w-1/2"
            asChild
          >
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 