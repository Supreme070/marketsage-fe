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
  MessageSquare,
  Copy,
  Eye,
  FileText,
  Calendar
} from "lucide-react";
import Link from "next/link";

// Sample SMS templates data
const smsTemplates = [
  {
    id: "1",
    name: "Order Delivery Update",
    category: "Transactional",
    type: "SMS",
    lastUpdated: "2024-04-29T10:15:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 3650,
    tags: ["delivery", "order"]
  },
  {
    id: "2",
    name: "Appointment Reminder",
    category: "Reminder",
    type: "SMS",
    lastUpdated: "2024-05-03T15:30:00Z",
    createdBy: "Jane Smith",
    status: "ACTIVE",
    usageCount: 4280,
    tags: ["appointment", "reminder"]
  },
  {
    id: "3",
    name: "Flash Sale Alert",
    category: "Marketing",
    type: "SMS",
    lastUpdated: "2024-05-01T09:45:00Z",
    createdBy: "John Doe",
    status: "ACTIVE",
    usageCount: 7890,
    tags: ["sale", "marketing"]
  },
  {
    id: "4",
    name: "Payment Confirmation",
    category: "Transactional",
    type: "SMS",
    lastUpdated: "2024-04-28T14:20:00Z",
    createdBy: "System",
    status: "ACTIVE",
    usageCount: 9240,
    tags: ["payment", "transactional"]
  }
];

export default function SMSTemplatesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">SMS Templates</h2>
        <Button asChild>
          <Link href="/sms/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>SMS Templates</CardTitle>
          <CardDescription>
            Create and manage your SMS message templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              SMS templates allow you to quickly send consistent messages to your contacts.
            </p>
            <Button asChild>
              <Link href="/sms/templates/new">
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