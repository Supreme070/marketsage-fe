"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Mail,
  MessageSquare,
  MessageCircle,
  Plus,
  Trash2,
  Save,
  Send,
  Calendar,
  Clock,
  Users,
  Target,
  Settings,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Zap,
  BarChart,
  Brain
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUnifiedCampaigns } from "@/lib/api/hooks/useUnifiedCampaigns";
import { ChannelType, CampaignStatus, RecurrenceType } from "@/lib/api/hooks/useUnifiedCampaigns";
import Link from "next/link";

// Form validation schema
const unifiedCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  channels: z.array(z.nativeEnum(ChannelType)).min(1, "At least one channel must be selected"),
  priority: z.number().min(1).max(10).default(5),
  budget: z.number().optional(),
  costPerMessage: z.number().optional(),
  recurrence: z.nativeEnum(RecurrenceType).default(RecurrenceType.ONE_TIME),
  timezone: z.string().default("UTC"),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
  
  // Channel-specific configurations
  emailConfig: z.object({
    subject: z.string().optional(),
    content: z.string().optional(),
    templateId: z.string().optional(),
    from: z.string().optional(),
    replyTo: z.string().optional(),
  }).optional(),
  
  smsConfig: z.object({
    content: z.string().optional(),
    templateId: z.string().optional(),
    from: z.string().optional(),
  }).optional(),
  
  whatsappConfig: z.object({
    content: z.string().optional(),
    templateId: z.string().optional(),
    from: z.string().optional(),
    messageType: z.string().optional(),
  }).optional(),
});

type UnifiedCampaignFormData = z.infer<typeof unifiedCampaignSchema>;

export default function CreateUnifiedCampaignPage() {
  const router = useRouter();
  const { createCampaign, loading } = useUnifiedCampaigns();
  
  const [selectedChannels, setSelectedChannels] = useState<ChannelType[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);

  const form = useForm<UnifiedCampaignFormData>({
    resolver: zodResolver(unifiedCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      channels: [],
      priority: 5,
      recurrence: RecurrenceType.ONE_TIME,
      timezone: "UTC",
      listIds: [],
      segmentIds: [],
    },
  });

  const onSubmit = async (data: UnifiedCampaignFormData) => {
    try {
      const campaignData = {
        ...data,
        channels: selectedChannels,
        scheduledFor: isScheduled ? scheduledFor : undefined,
      };

      const result = await createCampaign(campaignData);
      
      if (result) {
        // Redirect to campaigns list or campaign detail
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  };

  const toggleChannel = (channel: ChannelType) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case ChannelType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case ChannelType.SMS:
        return <MessageSquare className="h-4 w-4" />;
      case ChannelType.WHATSAPP:
        return <MessageCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelColor = (channel: ChannelType) => {
    switch (channel) {
      case ChannelType.EMAIL:
        return "bg-blue-500 hover:bg-blue-600";
      case ChannelType.SMS:
        return "bg-green-500 hover:bg-green-600";
      case ChannelType.WHATSAPP:
        return "bg-emerald-500 hover:bg-emerald-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Unified Campaign</h1>
            <p className="text-muted-foreground">
              Create a multi-channel campaign that coordinates across Email, SMS, and WhatsApp
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            {isScheduled ? "Schedule Campaign" : "Send Now"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Campaign Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about your unified campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Black Friday Sale Campaign" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your campaign goals and strategy..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (1-10)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="10" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Higher priority campaigns are processed first
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="Africa/Lagos">West Africa Time (WAT)</SelectItem>
                              <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                              <SelectItem value="Africa/Johannesburg">South Africa Time (SAST)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Channel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Channel Selection
                  </CardTitle>
                  <CardDescription>
                    Choose which channels to include in your unified campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(ChannelType).map((channel) => (
                      <div
                        key={channel}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedChannels.includes(channel)
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                        }`}
                        onClick={() => toggleChannel(channel)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getChannelColor(channel)} text-white`}>
                            {getChannelIcon(channel)}
                          </div>
                          <div>
                            <h3 className="font-medium">{channel}</h3>
                            <p className="text-sm text-muted-foreground">
                              {channel === ChannelType.EMAIL && "Email marketing campaigns"}
                              {channel === ChannelType.SMS && "SMS text messaging"}
                              {channel === ChannelType.WHATSAPP && "WhatsApp Business messages"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedChannels.length === 0 && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please select at least one channel for your campaign.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Channel Configurations */}
              {selectedChannels.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Channel Configurations
                    </CardTitle>
                    <CardDescription>
                      Configure settings for each selected channel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={selectedChannels[0]?.toLowerCase()} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        {selectedChannels.map((channel) => (
                          <TabsTrigger key={channel} value={channel.toLowerCase()}>
                            {getChannelIcon(channel)}
                            <span className="ml-2">{channel}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {selectedChannels.includes(ChannelType.EMAIL) && (
                        <TabsContent value="email" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="emailConfig.subject"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Subject</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Special Offer Inside!" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="emailConfig.from"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>From Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="noreply@yourcompany.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="emailConfig.content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Write your email content here..."
                                    className="min-h-[120px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      )}

                      {selectedChannels.includes(ChannelType.SMS) && (
                        <TabsContent value="sms" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="smsConfig.from"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SMS Sender ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="YOURCOMPANY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex items-end">
                              <Badge variant="outline" className="mb-2">
                                Max 160 characters
                              </Badge>
                            </div>
                          </div>
                          <FormField
                            control={form.control}
                            name="smsConfig.content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMS Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Write your SMS message here..."
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      )}

                      {selectedChannels.includes(ChannelType.WHATSAPP) && (
                        <TabsContent value="whatsapp" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="whatsappConfig.from"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>WhatsApp Sender</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your Business Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="whatsappConfig.messageType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Message Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select message type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="template">Template</SelectItem>
                                      <SelectItem value="media">Media</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="whatsappConfig.content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Write your WhatsApp message here..."
                                    className="min-h-[100px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Advanced Settings
                      </CardTitle>
                      <CardDescription>
                        Optional advanced configuration options
                      </CardDescription>
                    </div>
                    <Switch
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                    />
                  </div>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="costPerMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost Per Message</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurrence</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recurrence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={RecurrenceType.ONE_TIME}>One Time</SelectItem>
                              <SelectItem value={RecurrenceType.DAILY}>Daily</SelectItem>
                              <SelectItem value={RecurrenceType.WEEKLY}>Weekly</SelectItem>
                              <SelectItem value={RecurrenceType.MONTHLY}>Monthly</SelectItem>
                              <SelectItem value={RecurrenceType.YEARLY}>Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campaign Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Campaign Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Channels</span>
                      <span className="text-sm font-medium">{selectedChannels.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedChannels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <span className="text-sm font-medium">{form.watch("priority")}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Timezone</span>
                      <span className="text-sm font-medium">{form.watch("timezone")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Recurrence</span>
                      <span className="text-sm font-medium">{form.watch("recurrence")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule-toggle">Schedule Campaign</Label>
                    <Switch
                      id="schedule-toggle"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                  </div>

                  {isScheduled && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduled-date">Scheduled Date & Time</Label>
                      <Input
                        id="scheduled-date"
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                      />
                    </div>
                  )}

                  {!isScheduled && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Campaign will be sent immediately</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Optimal Send Time</p>
                        <p className="text-muted-foreground">9:00 AM WAT for best engagement</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Channel Mix</p>
                        <p className="text-muted-foreground">Email + SMS combination recommended</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Personalization</p>
                        <p className="text-muted-foreground">Use recipient names for +23% open rate</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
