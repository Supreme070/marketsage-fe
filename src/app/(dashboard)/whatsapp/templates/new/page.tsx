"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWhatsAppTemplatePage() {
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
        <CardHeader>
          <CardTitle>New WhatsApp Template</CardTitle>
          <CardDescription>
            Fill in the details to create a new WhatsApp template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Template editor to be implemented</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 