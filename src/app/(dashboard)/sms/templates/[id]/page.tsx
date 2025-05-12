"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Edit, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SMSTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<SMSTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [variables, setVariables] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        setTemplate(data);
        
        // Parse variables JSON string
        try {
          const parsedVariables = JSON.parse(data.variables);
          setVariables(parsedVariables);
        } catch (error) {
          console.error("Error parsing variables:", error);
          setVariables([]);
        }
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/sms/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }

      toast.success("Template deleted successfully");
      router.push("/sms/templates");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete template");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Replace template variables with styled placeholders
  const renderTemplateContent = (content: string) => {
    return content.replace(/\{\{(\d+)\}\}/g, (match, num) => {
      const varIndex = parseInt(num, 10) - 1;
      const varName = variables[varIndex] || `Variable ${num}`;
      return `<span class="inline-block px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">${varName}</span>`;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sms/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to templates
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center py-20">
          <p className="text-muted-foreground">Loading template details...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sms/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to templates
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">Template not found</h2>
            <p className="text-muted-foreground mb-6">
              The template you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/sms/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sms/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to templates
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{template.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/sms/templates/${templateId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/sms/campaigns/new?templateId=${templateId}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Use in Campaign
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            View the template information and message content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Category</h3>
            <div>
              {template.category ? (
                <Badge variant="outline" className="capitalize">
                  {template.category}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">No category</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Message Content</h3>
            <div className="p-4 border rounded-md whitespace-pre-wrap">
              <div dangerouslySetInnerHTML={{ __html: renderTemplateContent(template.content) }} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Variables</h3>
            {variables.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {variables.map((variable, index) => (
                  <Badge key={index} variant="secondary">
                    {`{{${index + 1}}} - ${variable}`}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No variables defined</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 