"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getWhatsAppTemplates,
  getListsWithContactCount,
  getSegmentsWithContactCount
} from "@/lib/api";
import toast from "react-hot-toast";

// Schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  from: z.string().min(1, "From number is required"),
  templateId: z.string().optional(),
  content: z.string().optional(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
});

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
}

export default function CreateWhatsAppCampaign() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      from: "",
      templateId: "",
      content: "",
      listIds: [],
      segmentIds: [],
    },
  });

  // Fetch resources
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [templatesData, listsData, segmentsData] = await Promise.all([
          getWhatsAppTemplates(),
          getListsWithContactCount(),
          getSegmentsWithContactCount(),
        ]);

        setTemplates(templatesData || []);
        setLists(listsData || []);
        setSegments(segmentsData || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load resources");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

      const response = await fetch("/api/whatsapp/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Campaign created successfully");
        router.push("/whatsapp/campaigns");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("An error occurred while creating the campaign");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    form.setValue("templateId", templateId);
    
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        form.setValue("content", selectedTemplate.content);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/whatsapp/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/whatsapp/campaigns/new">
            Create Campaign
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create WhatsApp Campaign</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading resources...</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your WhatsApp campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name*</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Briefly describe the purpose of this campaign" 
                          {...field} 
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
                      <FormLabel>From Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Your WhatsApp number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Content</CardTitle>
                    <CardDescription>
                      Customize your WhatsApp message content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template (Optional)</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={handleTemplateChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No template</SelectItem>
                              {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your message content here" 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipients">
                <Card>
                  <CardHeader>
                    <CardTitle>Recipients</CardTitle>
                    <CardDescription>
                      Select the audience for your WhatsApp campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Lists</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {lists.map((list) => (
                            <FormField
                              key={list.id}
                              control={form.control}
                              name="listIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={list.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(list.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value || [], list.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== list.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-medium">
                                        {list.name}
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({list._count?.members || 0} contacts)
                                        </span>
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Segments</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {segments.map((segment) => (
                            <FormField
                              key={segment.id}
                              control={form.control}
                              name="segmentIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={segment.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(segment.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value || [], segment.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== segment.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-medium">
                                        {segment.name}
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({segment.estimatedCount || 0} contacts)
                                        </span>
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 