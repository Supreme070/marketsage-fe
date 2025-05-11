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
import { ChevronRight, ListChecks, ListFilter, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelect from "@/components/ui/multi-select";
import { 
  getSMSCampaignById, 
  getListsWithContactCount, 
  getSegmentsWithContactCount, 
  getSMSTemplates 
} from "@/lib/api";

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

export default function EditSMSCampaign({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>(null);

  // Initialize form
  const form = useForm({
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

  // Fetch campaign data and resources
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [campaignData, templatesData, listsData, segmentsData] = await Promise.all([
          getSMSCampaignById(params.id),
          getSMSTemplates(),
          getListsWithContactCount(),
          getSegmentsWithContactCount(),
        ]);

        if (!campaignData) {
          // Campaign not found or user doesn't have permission
          setIsLoading(false);
          return;
        }

        setCampaign(campaignData);
        setTemplates(templatesData || []);
        setLists(listsData || []);
        setSegments(segmentsData || []);

        // Set form values
        form.reset({
          name: campaignData.name,
          description: campaignData.description || "",
          from: campaignData.from,
          content: campaignData.content || "",
          templateId: campaignData.templateId || "",
          listIds: campaignData.lists.map((list: any) => list.id),
          segmentIds: campaignData.segments.map((segment: any) => segment.id),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load campaign data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, form]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find((t: any) => t.id === templateId);
    if (selectedTemplate) {
      form.setValue("templateId", templateId);
      form.setValue("content", selectedTemplate.content);
    } else {
      form.setValue("templateId", "");
      // Only reset content if it was previously set from a template
      if (form.getValues("templateId")) {
        form.setValue("content", "");
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    
    try {
      // Ensure we have either content or templateId
      if (!data.content && !data.templateId) {
        toast.error("You must provide either content or select a template");
        setIsSaving(false);
        return;
      }

      // Ensure we have at least one recipient group selected
      if ((!data.listIds || data.listIds.length === 0) && 
          (!data.segmentIds || data.segmentIds.length === 0)) {
        toast.error("You must select at least one list or segment");
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/sms/campaigns/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update campaign");
      }

      toast.success("SMS campaign updated successfully");
      
      // Redirect to the campaigns list instead of individual campaign view
      router.push("/sms/campaigns");
    } catch (error: any) {
      console.error("Error updating SMS campaign:", error);
      toast.error(error.message || "Failed to update campaign");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading campaign data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Campaign Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The campaign you're looking for doesn't exist or you don't have permission to edit it.
            </p>
            <Button className="mt-4" onClick={() => router.push("/sms/campaigns")}>
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <BreadcrumbLink href={`/sms/campaigns/${params.id}`}>{campaign.name}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
          <BreadcrumbLink>Edit</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit SMS Campaign</h1>
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
                              {templates.map((template: any) => (
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
                            items={lists.map((list: any) => ({
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
                            items={segments.map((segment: any) => ({
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
                onClick={() => router.push(`/sms/campaigns/${params.id}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 