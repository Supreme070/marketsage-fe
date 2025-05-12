"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string;
  category?: string;
}

export default function EditSMSTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    variables: "",
    category: ""
  });

  const templateId = params.id as string;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sms/templates/${templateId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch template details");
        }
        
        const data = await response.json();
        
        // Parse variables JSON array to comma-separated string
        let variablesString = "";
        try {
          const parsedVariables = JSON.parse(data.variables);
          if (Array.isArray(parsedVariables)) {
            variablesString = parsedVariables.join(", ");
          }
        } catch (error) {
          console.error("Error parsing variables:", error);
        }
        
        setFormData({
          name: data.name,
          content: data.content,
          variables: variablesString,
          category: data.category || ""
        });
      } catch (error) {
        console.error("Error fetching template:", error);
        toast.error("Could not load template details");
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Format variables as a JSON array
      const formattedData = {
        ...formData,
        variables: JSON.stringify(
          formData.variables
            .split(",")
            .map(v => v.trim())
            .filter(v => v)
        )
      };

      const response = await fetch(`/api/sms/templates/${templateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      toast.success("SMS template updated successfully!");
      router.push(`/sms/templates/${templateId}`);
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/sms/templates/${templateId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to template
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading template data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/sms/templates/${templateId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to template
          </Link>
        </Button>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit SMS Template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your SMS message template details
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
            <CardDescription>
              Make changes to your SMS template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Order Confirmation"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Your order #{{1}} has been confirmed. Thank you for your purchase!"
                rows={5}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{"}{1}{"}}"}, {"{{"}{2}{"}}"}, etc. as placeholders for variables.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variables">Variables (comma-separated)</Label>
              <Input
                id="variables"
                name="variables"
                value={formData.variables}
                onChange={handleChange}
                placeholder="orderNumber, userName, date"
              />
              <p className="text-xs text-muted-foreground">
                List the variables used in your template, separated by commas.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.push(`/sms/templates/${templateId}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 