"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmailEditorProvider } from "@/components/email-editor/EmailEditor";

export default function TemplateEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const [templateName, setTemplateName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load template data if editing an existing template
  useEffect(() => {
    if (templateId) {
      // In a real app, this would fetch the template from the API
      // For now, we'll just set a placeholder name
      setTemplateName(`Template ${templateId}`);
    } else {
      setTemplateName("New Template");
    }
  }, [templateId]);

  // Handle save
  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.push("/email/templates");
    }, 1000);
  };

  // Handle back
  const handleBack = () => {
    router.push("/email/templates");
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-lg font-medium"
              placeholder="Template Name"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Test
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 overflow-hidden">
        <EmailEditorProvider />
      </div>
    </div>
  );
}
