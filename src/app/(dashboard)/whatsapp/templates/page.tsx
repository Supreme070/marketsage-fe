"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageCircle,
  Copy,
  Eye,
  FileText,
  Calendar
} from "lucide-react";
import Link from "next/link";

// Sample WhatsApp templates data
const whatsappTemplates = [
  {
    id: "1",
    name: "Order Confirmation",
    category: "Transactional",
    type: "WHATSAPP",
    lastUpdated: "2024-04-30T11:20:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 2870,
    tags: ["order", "confirmation"]
  },
  {
    id: "2",
    name: "Shipping Update",
    category: "Transactional",
    type: "WHATSAPP",
    lastUpdated: "2024-05-02T13:45:00Z",
    createdBy: "System",
    status: "ACTIVE",
    usageCount: 3450,
    tags: ["shipping", "tracking"]
  },
  {
    id: "3",
    name: "Service Appointment",
    category: "Reminder",
    type: "WHATSAPP",
    lastUpdated: "2024-05-04T09:30:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 1890,
    tags: ["appointment", "service"]
  },
  {
    id: "4",
    name: "Welcome Message",
    category: "Onboarding",
    type: "WHATSAPP",
    lastUpdated: "2024-04-27T16:15:00Z",
    createdBy: "John Doe",
    status: "DRAFT",
    usageCount: 0,
    tags: ["welcome", "onboarding"]
  }
];

export default function WhatsAppTemplatesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Templates</h2>
        <Button asChild>
          <Link href="/whatsapp/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Templates</CardTitle>
          <CardDescription>
            Create and manage your WhatsApp message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Templates allow you to send pre-approved messages to your contacts via WhatsApp Business API.
            </p>
            <Button asChild>
              <Link href="/whatsapp/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Template
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 