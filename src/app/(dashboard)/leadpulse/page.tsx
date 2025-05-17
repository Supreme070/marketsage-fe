'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Activity, Users, Eye, MousePointer, BarChart3, ArrowUpRight, FileText } from 'lucide-react';

export default function LeadPulseDashboard() {
  const router = useRouter();
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Mock data for now - would be fetched from API
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      setActiveVisitors(12);
      setTotalVisitors(2458);
      setConversionRate(3.2);
      setLoading(false);
    }, 1000);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LeadPulse</h1>
          <p className="text-muted-foreground">
            Advanced visitor intelligence and engagement system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/leadpulse/setup')}
          >
            Install Tracking Code
          </Button>
          <Button 
            onClick={() => router.push('/leadpulse/forms/new')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Visitors
            </CardTitle>
            <CardDescription>Currently on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{activeVisitors}</div>
              <Badge variant="outline" className="ml-auto">Live</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <CardDescription>All-time unique visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <CardDescription>Visitors to leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <div className="flex items-center ml-auto text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm">0.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="visitors">
        <TabsList>
          <TabsTrigger value="visitors">Visitor Activity</TabsTrigger>
          <TabsTrigger value="journeys">Visitor Journeys</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visitors</CardTitle>
              <CardDescription>
                Latest anonymous visitors to your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentVisitorsTable />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most visited pages on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopPagesTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Journey Visualization</CardTitle>
              <CardDescription>
                Visual flow of how visitors navigate through your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12 border rounded-md">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Journey visualization will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>LeadPulse Forms</CardTitle>
                <CardDescription>
                  Smart forms for capturing visitor information
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/leadpulse/forms/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Form
              </Button>
            </CardHeader>
            <CardContent>
              <FormsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LeadPulse Settings</CardTitle>
              <CardDescription>
                Configure your visitor tracking and integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Tracking Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">Tracking Status</div>
                      <div className="flex items-center mt-2">
                        <Badge className="bg-green-500">Active</Badge>
                        <span className="ml-2 text-sm text-muted-foreground">
                          Last active: 2 minutes ago
                        </span>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">Pixel ID</div>
                      <div className="flex items-center mt-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          lp_2g3h4j2k3h4kj23h4
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Data Retention</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how long to keep visitor data
                  </p>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium">Anonymous Visitors</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Currently set to 180 days
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Identified Contacts</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Currently set to 2 years
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Integration Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how LeadPulse integrates with your MarketSage account
                  </p>
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium">Auto-add to List</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          New Leads (32 contacts)
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Notification</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Email & Dashboard
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock table components
function RecentVisitorsTable() {
  const visitors = [
    { id: 'vis_1', ip: '192.168.1.1', location: 'Lagos, Nigeria', device: 'Mobile, Chrome', lastActive: '2 mins ago', engagementScore: 72 },
    { id: 'vis_2', ip: '192.168.1.2', location: 'Abuja, Nigeria', device: 'Desktop, Safari', lastActive: '5 mins ago', engagementScore: 45 },
    { id: 'vis_3', ip: '192.168.1.3', location: 'Accra, Ghana', device: 'Tablet, Chrome', lastActive: '12 mins ago', engagementScore: 63 },
    { id: 'vis_4', ip: '192.168.1.4', location: 'Lagos, Nigeria', device: 'Desktop, Firefox', lastActive: '17 mins ago', engagementScore: 28 },
    { id: 'vis_5', ip: '192.168.1.5', location: 'Nairobi, Kenya', device: 'Mobile, Safari', lastActive: '32 mins ago', engagementScore: 91 },
  ];
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Visitor ID</th>
            <th scope="col" className="px-6 py-3">Location</th>
            <th scope="col" className="px-6 py-3">Device</th>
            <th scope="col" className="px-6 py-3">Last Active</th>
            <th scope="col" className="px-6 py-3">Engagement</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map(visitor => (
            <tr key={visitor.id} className="bg-white border-b">
              <td className="px-6 py-4">{visitor.id}</td>
              <td className="px-6 py-4">{visitor.location}</td>
              <td className="px-6 py-4">{visitor.device}</td>
              <td className="px-6 py-4">{visitor.lastActive}</td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        visitor.engagementScore > 70 ? 'bg-green-500' : 
                        visitor.engagementScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${visitor.engagementScore}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs">{visitor.engagementScore}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Button variant="outline" size="sm">View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPagesTable() {
  const pages = [
    { url: '/products', title: 'Products Page', visitors: 342, avgTime: '1:25', bounceRate: 32 },
    { url: '/pricing', title: 'Pricing Page', visitors: 278, avgTime: '2:41', bounceRate: 24 },
    { url: '/contact', title: 'Contact Page', visitors: 195, avgTime: '0:58', bounceRate: 41 },
    { url: '/about', title: 'About Us', visitors: 147, avgTime: '1:12', bounceRate: 35 },
    { url: '/blog', title: 'Blog Home', visitors: 126, avgTime: '2:05', bounceRate: 28 },
  ];
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Page</th>
            <th scope="col" className="px-6 py-3">Visitors</th>
            <th scope="col" className="px-6 py-3">Avg. Time</th>
            <th scope="col" className="px-6 py-3">Bounce Rate</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(page => (
            <tr key={page.url} className="bg-white border-b">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{page.title}</div>
                <div className="text-xs text-gray-500">{page.url}</div>
              </td>
              <td className="px-6 py-4">{page.visitors}</td>
              <td className="px-6 py-4">{page.avgTime}</td>
              <td className="px-6 py-4">{page.bounceRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormsList() {
  const forms = [
    { id: 'form_1', name: 'Contact Us Form', type: 'Embedded', views: 532, submissions: 48, conversionRate: 9.02 },
    { id: 'form_2', name: 'Newsletter Signup', type: 'Popup', views: 1245, submissions: 187, conversionRate: 15.02 },
    { id: 'form_3', name: 'Free Trial Request', type: 'Exit Intent', views: 874, submissions: 103, conversionRate: 11.78 },
  ];
  
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Form Name</th>
            <th scope="col" className="px-6 py-3">Type</th>
            <th scope="col" className="px-6 py-3">Views</th>
            <th scope="col" className="px-6 py-3">Submissions</th>
            <th scope="col" className="px-6 py-3">Conversion Rate</th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map(form => (
            <tr key={form.id} className="bg-white border-b">
              <td className="px-6 py-4 font-medium text-gray-900">{form.name}</td>
              <td className="px-6 py-4">
                <Badge variant="outline">{form.type}</Badge>
              </td>
              <td className="px-6 py-4">{form.views}</td>
              <td className="px-6 py-4">{form.submissions}</td>
              <td className="px-6 py-4">{form.conversionRate}%</td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Embed</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 