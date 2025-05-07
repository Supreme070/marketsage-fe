import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Users,
  Settings,
  Phone,
  ArrowRight,
  Plus,
  FileText,
  CheckCircle2,
  MessagesSquare,
  BarChart3
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function WhatsAppPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-white">WhatsApp Marketing</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary/5 dark:bg-secondary/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Campaigns
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">
                  2 scheduled, 2 running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Approved Templates
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  3 pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Message Delivery
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.4%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Response Rate
                </CardTitle>
                <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42.7%</div>
                <p className="text-xs text-muted-foreground">
                  +5.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <Card className="md:col-span-8">
              <CardHeader>
                <CardTitle>WhatsApp Business Features</CardTitle>
                <CardDescription>
                  Take advantage of the WhatsApp Business API capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-md font-medium">Multi-Agent Inbox</h3>
                        <p className="text-sm text-muted-foreground">Team collaboration without QR code scanning</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/whatsapp/inbox">
                          Manage Inbox <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-accent/10 p-3">
                        <FileText className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-md font-medium">Template Messages</h3>
                        <p className="text-sm text-muted-foreground">Create and manage approved message templates</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/whatsapp/templates">
                          Manage Templates <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-secondary/10 p-3">
                        <Users className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-md font-medium">Interactive Forms</h3>
                        <p className="text-sm text-muted-foreground">Collect information directly in WhatsApp chats</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/whatsapp/forms">
                          Create Forms <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-md font-medium">Performance Analytics</h3>
                        <p className="text-sm text-muted-foreground">Track delivery, open rates and conversions</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/whatsapp/analytics">
                          View Analytics <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Active Conversations</CardTitle>
                <CardDescription>
                  Recent customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 rounded-md border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                      <span className="text-sm font-medium">AO</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Adebayo Ogunlesi</p>
                        <Badge variant="outline">New</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        I'm interested in the premium plan you mentioned...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 mins ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                      <span className="text-sm font-medium">CF</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Chioma Favour</p>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Thank you for the information. When will the product...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        20 mins ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 rounded-md border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                      <span className="text-sm font-medium">KB</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Kwame Bantu</p>
                        <Badge variant="outline">Waiting</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        I need assistance with my recent order #12490...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
                  <a href="/whatsapp/inbox">
                    View All Conversations
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started with WhatsApp Business</CardTitle>
              <CardDescription>
                Follow these steps to set up your WhatsApp Business integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Connect WhatsApp Business Account</p>
                    <p className="text-sm text-muted-foreground">
                      Link your WhatsApp Business account to MarketSage
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Verify Business Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Complete Meta verification process for your business
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm">
                      Verify
                    </Button>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Create Message Templates</p>
                    <p className="text-sm text-muted-foreground">
                      Submit templates for approval to start sending messages
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/whatsapp/templates/new">
                        Create
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-sm font-medium">4</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Launch Your First Campaign</p>
                    <p className="text-sm text-muted-foreground">
                      Create and send your first WhatsApp campaign
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/whatsapp/campaigns/new">
                        Create
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Campaigns</CardTitle>
              <CardDescription>
                Manage your WhatsApp marketing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-3 rounded-lg bg-secondary/5 dark:bg-secondary/10 py-8">
                <MessageCircle className="h-12 w-12 text-secondary/60" />
                <h3 className="text-xl font-medium">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Start creating WhatsApp campaigns to engage with your audience through one of the most popular messaging platforms.
                </p>
                <Button asChild>
                  <a href="/whatsapp/campaigns/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Campaign
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Templates</CardTitle>
              <CardDescription>
                Create and manage message templates for WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-secondary/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Template Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">Welcome Message</div>
                        <div className="text-xs text-muted-foreground">Thank you for subscribing to our updates...</div>
                      </td>
                      <td className="px-4 py-3 text-sm">Utility</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-green-500">Approved</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">3 days ago</td>
                      <td className="px-4 py-3 text-sm">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          Edit
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">Order Confirmation</div>
                        <div className="text-xs text-muted-foreground">Your order [order_id] has been confirmed...</div>
                      </td>
                      <td className="px-4 py-3 text-sm">Utility</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-green-500">Approved</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">5 days ago</td>
                      <td className="px-4 py-3 text-sm">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          Edit
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">Appointment Reminder</div>
                        <div className="text-xs text-muted-foreground">Reminder: You have an appointment on [date]...</div>
                      </td>
                      <td className="px-4 py-3 text-sm">Utility</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-accent">Pending</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">1 day ago</td>
                      <td className="px-4 py-3 text-sm">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm text-muted-foreground">Showing 3 of 3 templates</p>
                <Button size="sm" asChild>
                  <a href="/whatsapp/templates/new">
                    <Plus className="mr-2 h-4 w-4" /> New Template
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Inbox</CardTitle>
              <CardDescription>
                Manage customer conversations via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 h-[500px]">
                  <div className="border-r md:col-span-3">
                    <div className="p-3 border-b">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          className="w-full px-3 py-2 bg-background text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto h-[450px]">
                      <div className="p-3 border-b hover:bg-secondary/5 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                            <span className="text-sm font-medium">AO</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Adebayo Ogunlesi</p>
                              <p className="text-xs text-muted-foreground">5m</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">I'm interested in the premium plan...</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-b bg-secondary/10 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                            <span className="text-sm font-medium">CF</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Chioma Favour</p>
                              <p className="text-xs text-muted-foreground">20m</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">Thank you for the information...</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border-b hover:bg-secondary/5 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                            <span className="text-sm font-medium">KB</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Kwame Bantu</p>
                              <p className="text-xs text-muted-foreground">1h</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">I need assistance with my recent order...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-9 flex flex-col">
                    <div className="p-3 border-b flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                        <span className="text-sm font-medium">CF</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Chioma Favour</p>
                        <p className="text-xs text-muted-foreground">+234 801 234 5678</p>
                      </div>
                      <div className="ml-auto flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 bg-secondary/5">
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <span className="text-xs bg-secondary/10 rounded-full px-3 py-1 text-muted-foreground">
                            Today
                          </span>
                        </div>
                        <div className="flex justify-start">
                          <div className="max-w-[80%] bg-background rounded-lg p-3">
                            <p className="text-sm">Hello, I'm interested in your services. Could you tell me more about the pricing plans?</p>
                            <p className="text-xs text-muted-foreground text-right mt-1">10:32 AM</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-primary/10 rounded-lg p-3">
                            <p className="text-sm">Hi Chioma, thank you for reaching out! We have several pricing plans available.</p>
                            <p className="text-sm mt-2">Our basic plan starts at ₦15,000/month and includes all essential features. The premium plan at ₦30,000/month adds advanced analytics and priority support.</p>
                            <p className="text-xs text-muted-foreground text-right mt-1">10:35 AM</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="max-w-[80%] bg-background rounded-lg p-3">
                            <p className="text-sm">Thank you for the information. When will the product be available for delivery?</p>
                            <p className="text-xs text-muted-foreground text-right mt-1">10:42 AM</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 p-2 bg-background text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button className="h-9">Send</Button>
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
