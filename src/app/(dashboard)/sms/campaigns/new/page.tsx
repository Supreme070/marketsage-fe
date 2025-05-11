"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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

      const response = await fetch("/api/sms/campaigns", {
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
                              <SelectItem value="">None</SelectItem>
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