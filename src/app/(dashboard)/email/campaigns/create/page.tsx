"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Define form validation schema
const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject line is required"),
  from: z.string().email("Must be a valid email").min(1, "From address is required"),
  replyTo: z.string().email("Must be a valid email").optional().or(z.literal("")),
  templateId: z.string().optional().or(z.literal("")),
  content: z.string().optional(),
  listIds: z.array(z.string()).min(1, "At least one list is required"),
  segmentIds: z.array(z.string()).default([]),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

// Types for API data
interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface List {
  id: string;
  name: string;
  description: string | null;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initialize form with default values
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      from: "marketing@marketsage.com",
      replyTo: "",
      templateId: "",
      content: "",
      listIds: [],
      segmentIds: [],
    },
  });

  // Fetch initial data (templates, lists, segments)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch templates
        const templatesResponse = await fetch("/api/email/templates");
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData);
        }

        // Fetch lists
        const listsResponse = await fetch("/api/lists");
        if (listsResponse.ok) {
          const listsData = await listsResponse.json();
          setLists(listsData);
        }

        // Fetch segments
        const segmentsResponse = await fetch("/api/segments");
        if (segmentsResponse.ok) {
          const segmentsData = await segmentsResponse.json();
          setSegments(segmentsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load required data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle template selection (populate subject and content automatically)
  useEffect(() => {
    const templateId = form.watch("templateId");
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        form.setValue("subject", selectedTemplate.subject);
        form.setValue("content", selectedTemplate.content);
      }
    }
  }, [form.watch("templateId"), templates, form]);

  // Form submission handler
  const onSubmit = async (data: CampaignFormValues) => {
    console.log("Form data being submitted:", data);
    setIsLoading(true);
    try {
      // Ensure all required fields are present
      if (!data.name) {
        toast({
          title: "Error",
          description: "Campaign name is required",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.subject) {
        toast({
          title: "Error",
          description: "Subject line is required",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Ensure the content is properly set if templateId is not provided
      if (!data.templateId && !data.content) {
        toast({
          title: "Error",
          description: "Either a template or custom content is required",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Ensure at least one list is selected
      if (!data.listIds || data.listIds.length === 0) {
        toast({
          title: "Error",
          description: "At least one list must be selected",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const campaign = await response.json();
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      
      // Navigate to the campaign detail page
      router.push(`/email/campaigns/${campaign.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: typeof error === "string" ? error : "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" size="icon" className="mr-4" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create Campaign</h2>
      </div>

      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Define the basic details of your email campaign
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
                            <Input placeholder="Monthly Newsletter - June 2023" {...field} />
                          </FormControl>
                          <FormDescription>
                            A descriptive name to identify this campaign
                          </FormDescription>
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
                              placeholder="A brief description of this campaign's purpose" 
                              className="min-h-[100px]"
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
                        name="from"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Address</FormLabel>
                            <FormControl>
                              <Input placeholder="marketing@yourcompany.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="replyTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reply-To Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="support@yourcompany.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Content</CardTitle>
                    <CardDescription>
                      Choose a template or create custom content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Template</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Custom Content</SelectItem>
                              {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select a pre-designed template or create custom content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Line</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Monthly Update from MarketSage" {...field} />
                          </FormControl>
                          <FormDescription>
                            The subject line of your email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your email content here..." 
                              className="min-h-[300px] font-mono"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            HTML content is supported. For more advanced editing, use the template editor.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="audience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Audience</CardTitle>
                    <CardDescription>
                      Select the lists and segments to receive this campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="listIds"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Lists</FormLabel>
                            <FormDescription>
                              Select one or more lists to receive this campaign
                            </FormDescription>
                          </div>
                          
                          <div className="space-y-2">
                            {lists.length === 0 ? (
                              <p className="text-muted-foreground">No lists available. Create a list first.</p>
                            ) : (
                              <ScrollArea className="h-[200px] border rounded-md p-4">
                                {lists.map((list) => (
                                  <FormField
                                    key={list.id}
                                    control={form.control}
                                    name="listIds"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={list.id}
                                          className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(list.id)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, list.id])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== list.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <FormLabel className="font-normal">
                                              {list.name}
                                            </FormLabel>
                                            {list.description && (
                                              <FormDescription>
                                                {list.description}
                                              </FormDescription>
                                            )}
                                          </div>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </ScrollArea>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {segments.length > 0 && (
                      <>
                        <Separator />
                        
                        <FormField
                          control={form.control}
                          name="segmentIds"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel>Segments (Optional)</FormLabel>
                                <FormDescription>
                                  Add targeted segments to refine your audience
                                </FormDescription>
                              </div>
                              
                              <div className="space-y-2">
                                <ScrollArea className="h-[200px] border rounded-md p-4">
                                  {segments.map((segment) => (
                                    <FormField
                                      key={segment.id}
                                      control={form.control}
                                      name="segmentIds"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={segment.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(segment.id)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, segment.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== segment.id
                                                        )
                                                      );
                                                }}
                                              />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                              <FormLabel className="font-normal">
                                                {segment.name}
                                              </FormLabel>
                                              {segment.description && (
                                                <FormDescription>
                                                  {segment.description}
                                                </FormDescription>
                                              )}
                                            </div>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                </ScrollArea>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 