"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewWhatsAppTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    variables: "",
    category: "marketing",
    status: "PENDING"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      const response = await fetch("/api/v2/whatsapp/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }

      toast.success("WhatsApp template created successfully!");
      router.push("/whatsapp/templates");
      router.refresh();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/whatsapp/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to templates
          </Link>
        </Button>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create WhatsApp Template</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new WhatsApp message template for your business communications.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New WhatsApp Template</CardTitle>
            <CardDescription>
              Fill in the details to create a new WhatsApp template
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
                placeholder="Welcome Message"
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
                placeholder="Hello {{1}}, welcome to our service! Thank you for joining us."
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
                placeholder="firstName, lastName, companyName"
              />
              <p className="text-xs text-muted-foreground">
                List the variables used in your template, separated by commas.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="reminders">Reminders</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => router.push("/whatsapp/templates")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 