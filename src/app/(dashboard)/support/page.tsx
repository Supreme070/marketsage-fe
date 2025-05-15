'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  AlertCircle, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  MailQuestion, 
  Search, 
} from 'lucide-react';
import Link from 'next/link';

export default function SupportCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  // Common help topics
  const helpTopics = [
    {
      title: 'Getting Started',
      icon: <BookOpen className="h-4 w-4 mr-2" />,
      description: 'Learn the basics of using the platform',
      link: '/support/guides/getting-started'
    },
    {
      title: 'Creating Campaigns',
      icon: <FileText className="h-4 w-4 mr-2" />,
      description: 'How to create and manage different campaign types',
      link: '/support/guides/campaigns'
    },
    {
      title: 'Managing Contacts',
      icon: <FileText className="h-4 w-4 mr-2" />,
      description: 'Import, organize, and segment your contacts',
      link: '/support/guides/contacts'
    },
    {
      title: 'Error Codes Reference',
      icon: <AlertCircle className="h-4 w-4 mr-2" />,
      description: 'Understand error messages and how to resolve them',
      link: '/support/error-codes'
    },
    {
      title: 'API Documentation',
      icon: <FileText className="h-4 w-4 mr-2" />,
      description: 'Reference for developers integrating with our API',
      link: '/support/api-docs'
    },
    {
      title: 'Contact Support',
      icon: <MailQuestion className="h-4 w-4 mr-2" />,
      description: 'Get in touch with our support team',
      link: '/support/contact'
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers, documentation, and support resources
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl opacity-50" />
        <Card className="relative border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">How can we help you today?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex w-full items-center space-x-2">
              <Input 
                type="search" 
                placeholder="Search for help, guides, and documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button variant="default">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="guides">Help Guides</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
        </TabsList>
        <TabsContent value="guides" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpTopics.map((topic, index) => (
              <Card key={index} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    {topic.icon} {topic.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">
                    {topic.description}
                  </CardDescription>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={topic.link}>
                      View Guide
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-primary" /> 
                  How do I change my subscription plan?
                </h3>
                <p className="text-sm text-muted-foreground pl-6">
                  You can change your subscription plan by navigating to Settings → Billing → Subscription and selecting your desired plan.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-primary" /> 
                  Can I export my contact data?
                </h3>
                <p className="text-sm text-muted-foreground pl-6">
                  Yes, you can export contacts by going to Contacts → All Contacts, then clicking the "Export" button in the top-right corner.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2 text-primary" /> 
                  How do I integrate with other services?
                </h3>
                <p className="text-sm text-muted-foreground pl-6">
                  You can connect to other services by navigating to Integrations and selecting the service you want to connect.
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                View All FAQs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="videos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Getting Started Tutorial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Learn the basics of the platform in this introductory video
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Campaign Creation Tutorial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Step-by-step guide to creating your first campaign
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 