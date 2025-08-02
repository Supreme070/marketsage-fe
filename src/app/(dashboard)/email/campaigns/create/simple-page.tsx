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
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// This is a simplified version of the campaign creation page without using form libraries
// It's meant to help diagnose issues with the main form

export default function SimpleCreateCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [lists, setLists] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    from: "marketing@marketsage.com",
    replyTo: "",
    templateId: "",
    content: "",
    listIds: [],
    segmentIds: [],
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch templates
        const templatesResponse = await fetch("/api/v2/email/templates");
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData);
        }

        // Fetch lists
        const listsResponse = await fetch("/api/v2/lists");
        if (listsResponse.ok) {
          const listsData = await listsResponse.json();
          setLists(listsData);
        }

        // Fetch segments
        const segmentsResponse = await fetch("/api/v2/segments");
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

  // Handle template selection
  const handleTemplateChange = (templateId) => {
    setFormData(prev => ({
      ...prev,
      templateId
    }));
    
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setFormData(prev => ({
          ...prev,
          subject: selectedTemplate.subject,
          content: selectedTemplate.content
        }));
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for lists
  const handleListCheckboxChange = (listId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        listIds: [...prev.listIds, listId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        listIds: prev.listIds.filter(id => id !== listId)
      }));
    }
  };

  // Handle checkbox changes for segments
  const handleSegmentCheckboxChange = (segmentId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        segmentIds: [...prev.segmentIds, segmentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        segmentIds: prev.segmentIds.filter(id => id !== segmentId)
      }));
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data being submitted:", formData);
    setIsLoading(true);
    
    try {
      // Validation
      if (!formData.name) {
        throw new Error("Campaign name is required");
      }
      
      if (!formData.subject) {
        throw new Error("Subject line is required");
      }
      
      if (!formData.templateId && !formData.content) {
        throw new Error("Either a template or custom content is required");
      }
      
      if (!formData.listIds || formData.listIds.length === 0) {
        throw new Error("At least one list must be selected");
      }
      
      const response = await fetch("/api/v2/email/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
        description: error.message || "Failed to create campaign. Please try again.",
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
        <h2 className="text-3xl font-bold tracking-tight">Create Campaign (Simple Version)</h2>
      </div>

      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the basic details of your email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  placeholder="Monthly Newsletter - June 2023" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  A descriptive name to identify this campaign
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="A brief description of this campaign's purpose" 
                  className="min-h-[100px]"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From Address</Label>
                  <Input 
                    id="from" 
                    name="from"
                    placeholder="marketing@yourcompany.com" 
                    value={formData.from}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Address (Optional)</Label>
                  <Input 
                    id="replyTo" 
                    name="replyTo"
                    placeholder="support@yourcompany.com" 
                    value={formData.replyTo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Choose a template or create custom content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="templateId">Email Template</Label>
                <Select 
                  value={formData.templateId}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Content</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a pre-designed template or create custom content
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input 
                  id="subject" 
                  name="subject"
                  placeholder="Your Monthly Update from MarketSage" 
                  value={formData.subject}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  The subject line of your email
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Email Content</Label>
                <Textarea 
                  id="content" 
                  name="content"
                  placeholder="Enter your email content here..." 
                  className="min-h-[300px] font-mono"
                  value={formData.content}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  HTML content is supported. For more advanced editing, use the template editor.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>
                Select the lists and segments to receive this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Lists</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select one or more lists to receive this campaign
                  </p>
                </div>
                
                <div className="space-y-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  {lists.length === 0 ? (
                    <p className="text-muted-foreground">No lists available. Create a list first.</p>
                  ) : (
                    lists.map((list) => (
                      <div key={list.id} className="flex items-start space-x-3 mb-4">
                        <Checkbox
                          id={`list-${list.id}`}
                          checked={formData.listIds.includes(list.id)}
                          onCheckedChange={(checked) => handleListCheckboxChange(list.id, checked)}
                        />
                        <div className="space-y-1 leading-none">
                          <label htmlFor={`list-${list.id}`} className="font-normal cursor-pointer">
                            {list.name}
                          </label>
                          {list.description && (
                            <p className="text-sm text-muted-foreground">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {segments.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Segments (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add targeted segments to refine your audience
                    </p>
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                    {segments.map((segment) => (
                      <div key={segment.id} className="flex items-start space-x-3 mb-4">
                        <Checkbox
                          id={`segment-${segment.id}`}
                          checked={formData.segmentIds.includes(segment.id)}
                          onCheckedChange={(checked) => handleSegmentCheckboxChange(segment.id, checked)}
                        />
                        <div className="space-y-1 leading-none">
                          <label htmlFor={`segment-${segment.id}`} className="font-normal cursor-pointer">
                            {segment.name}
                          </label>
                          {segment.description && (
                            <p className="text-sm text-muted-foreground">
                              {segment.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleBack} type="button">
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
      )}
    </div>
  );
} 