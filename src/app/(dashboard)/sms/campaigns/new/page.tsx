"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight, ListChecks, ListFilter, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  getListsWithContactCount, 
  getSegmentsWithContactCount, 
  getSMSTemplates 
} from "@/lib/api";
import MultiSelect from "@/components/ui/multi-select";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required"),
  content: z.string().optional(),
  templateId: z.string().optional(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
  enableABTesting: z.boolean().default(false),
  enableGeoTargeting: z.boolean().default(false),
  targetCountries: z.array(z.string()).default([]),
  targetStates: z.array(z.string()).default([]),
  targetCities: z.array(z.string()).default([]),
  enableBirthdayTargeting: z.boolean().default(false),
  birthdayTiming: z.enum(['on_birthday', 'day_before', 'week_before']).default('on_birthday'),
  birthdayOfferType: z.enum(['discount', 'freebie', 'exclusive_access', 'personalized_gift']).default('discount'),
  birthdayOfferValue: z.number().min(0).max(100).default(15),
});

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
}

interface ListItem {
  id: string;
  name: string;
  _count?: {
    members: number;
  };
}

interface SegmentItem {
  id: string;
  name: string;
}

export default function CreateSMSCampaign() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [segments, setSegments] = useState<SegmentItem[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      from: "",
      content: "",
      templateId: "",
      listIds: [],
      segmentIds: [],
      enableABTesting: false,
      enableGeoTargeting: false,
      targetCountries: [],
      targetStates: [],
      targetCities: [],
      enableBirthdayTargeting: false,
      birthdayTiming: 'on_birthday',
      birthdayOfferType: 'discount',
      birthdayOfferValue: 15,
    },
  });

  // Fetch templates, lists, and segments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesData, listsData, segmentsData] = await Promise.all([
          getSMSTemplates(),
          getListsWithContactCount(),
          getSegmentsWithContactCount(),
        ]);

        setTemplates(templatesData || []);
        setLists(listsData || []);
        setSegments(segmentsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      }
    };

    fetchData();
  }, []);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find((t) => t.id === templateId);
    if (selectedTemplate) {
      form.setValue("templateId", templateId);
      form.setValue("content", selectedTemplate.content);
    } else {
      form.setValue("templateId", "");
      form.setValue("content", "");
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Ensure we have either content or templateId
      if (!data.content && !data.templateId) {
        toast.error("You must provide either content or select a template");
        setIsLoading(false);
        return;
      }

      // Ensure we have at least one recipient group selected
      if ((!data.listIds || data.listIds.length === 0) && 
          (!data.segmentIds || data.segmentIds.length === 0)) {
        toast.error("You must select at least one list or segment");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/v2/sms/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      // Successfully created campaign
      toast.success("SMS campaign created successfully");
      
      // Always redirect to campaigns list
      router.push("/sms/campaigns");
    } catch (error) {
      console.error("Error creating SMS campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
          <BreadcrumbLink href="/sms/campaigns">SMS Campaigns</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
          <BreadcrumbLink>Create Campaign</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create SMS Campaign</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
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
                        placeholder="Enter campaign description"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter sender phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <FormField
                control={form.control}
                name="enableABTesting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        A/B Testing
                      </FormLabel>
                      <FormDescription>
                        Enable A/B testing to compare different versions of your SMS campaign
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableGeoTargeting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Geographic Targeting
                      </FormLabel>
                      <FormDescription>
                        Target specific countries, states, or cities for your SMS campaign
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("enableGeoTargeting") && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/10">
                  <h4 className="text-sm font-medium">Geographic Settings</h4>
                  
                  <FormField
                    control={form.control}
                    name="targetCountries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Countries (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Nigeria, Kenya, Ghana (comma-separated)"
                            value={field.value.join(", ")}
                            onChange={(e) => field.onChange(
                              e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetStates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target States/Regions (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Lagos, Kano, Abuja (comma-separated)"
                            value={field.value.join(", ")}
                            onChange={(e) => field.onChange(
                              e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Cities (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Ikeja, Victoria Island, Kano (comma-separated)"
                            value={field.value.join(", ")}
                            onChange={(e) => field.onChange(
                              e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="enableBirthdayTargeting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Birthday Campaign
                      </FormLabel>
                      <FormDescription>
                        Automatically target customers on or around their birthday
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("enableBirthdayTargeting") && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/10">
                  <h4 className="text-sm font-medium">Birthday Campaign Settings</h4>
                  
                  <FormField
                    control={form.control}
                    name="birthdayTiming"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send Timing</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose when to send" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on_birthday">On their birthday</SelectItem>
                              <SelectItem value="day_before">Day before birthday</SelectItem>
                              <SelectItem value="week_before">Week before birthday</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthdayOfferType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday Offer Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose offer type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discount">Percentage Discount</SelectItem>
                              <SelectItem value="freebie">Free Gift</SelectItem>
                              <SelectItem value="exclusive_access">Exclusive Access</SelectItem>
                              <SelectItem value="personalized_gift">Personalized Gift</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("birthdayOfferType") === "discount" && (
                    <FormField
                      control={form.control}
                      name="birthdayOfferValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="15"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter discount percentage (0-100%)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template (Optional)</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => handleTemplateChange(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter SMS content"
                            {...field}
                            rows={6}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-5 w-5" />
                    Lists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="listIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MultiSelect
                            items={lists.map((list) => ({
                              value: list.id,
                              label: `${list.name} (${list._count?.members || 0} contacts)`,
                            }))}
                            selectedItems={field.value || []}
                            onChange={(selectedItems) => {
                              field.onChange(selectedItems);
                            }}
                            placeholder="Select lists"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ListFilter className="mr-2 h-5 w-5" />
                    Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="segmentIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MultiSelect
                            items={segments.map((segment) => ({
                              value: segment.id,
                              label: segment.name,
                            }))}
                            selectedItems={field.value || []}
                            onChange={(selectedItems) => {
                              field.onChange(selectedItems);
                            }}
                            placeholder="Select segments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardFooter className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => router.push("/sms/campaigns")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 