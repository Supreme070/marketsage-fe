"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight, Copy, PenSquare, PlayCircle, Trash2, ArrowLeft, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSMSCampaignById } from "@/lib/api";

export default function SMSCampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Store the ID in a variable to avoid multiple accesses to params.id
  const campaignId = params.id;

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const data = await getSMSCampaignById(campaignId);
        setCampaign(data);
      } catch (error) {
        console.error("Failed to fetch SMS campaign:", error);
        toast.error("Failed to load SMS campaign details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Loading campaign details...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button className="mt-4" onClick={() => router.push("/sms/campaigns")}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "SENDING":
        return "bg-purple-100 text-purple-800";
      case "SENT":
        return "bg-green-100 text-green-800";
      case "PAUSED":
        return "bg-orange-100 text-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Handle campaign duplication
  const handleDuplicateCampaign = async () => {
    try {
      const response = await fetch(`/api/sms/campaigns/${campaignId}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await response.json();
        toast.success("Campaign duplicated successfully");
        router.push("/sms/campaigns");
      } else {
        toast.error("Failed to duplicate campaign");
      }
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    }
  };

  // Handle campaign deletion with confirmation
  const handleDeleteCampaign = async () => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        const response = await fetch(`/api/sms/campaigns/${campaignId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success("Campaign deleted successfully");
          router.push("/sms/campaigns");
        } else {
          toast.error("Failed to delete campaign");
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign");
      }
    }
  };

  return (
    <div className="container py-6 space-y-6">
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
          <BreadcrumbLink>{campaign.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/sms/campaigns")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDuplicateCampaign}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" onClick={() => router.push(`/sms/campaigns/${campaignId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteCampaign}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>View and manage this SMS campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="mt-1">{campaign.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">From</h3>
                <p className="mt-1">{campaign.from}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
                <p className="mt-1">{new Date(campaign.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="mt-1">{new Date(campaign.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{campaign.description || "No description provided"}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Content</h3>
              <div className="mt-1 p-4 border rounded-md whitespace-pre-wrap bg-muted/50">
                {campaign.content || "No content provided"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Lists</h3>
                {campaign.lists && campaign.lists.length > 0 ? (
                  <ul className="mt-1 list-disc list-inside">
                    {campaign.lists.map((list: any) => (
                      <li key={list.id} className="text-sm">{list.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No lists selected</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Segments</h3>
                {campaign.segments && campaign.segments.length > 0 ? (
                  <ul className="mt-1 list-disc list-inside">
                    {campaign.segments.map((segment: any) => (
                      <li key={segment.id} className="text-sm">{segment.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No segments selected</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 