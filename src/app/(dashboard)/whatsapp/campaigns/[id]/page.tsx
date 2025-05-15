"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ArrowLeft, ChevronRight, Edit, Trash2, Copy, Send, Calendar } from "lucide-react";
import { getWhatsAppCampaignById } from "@/lib/api";
import toast from "react-hot-toast";

export default function WhatsAppCampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Store the ID in a variable to avoid multiple accesses to params.id
  const campaignId = params.id;

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const data = await getWhatsAppCampaignById(campaignId);
        
        if (!data) {
          toast.error("Campaign not found");
          router.push("/whatsapp/campaigns");
          return;
        }
        
        setCampaign(data);
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("Failed to load campaign details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, router]);

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success("Campaign duplicated successfully");
        router.push('/whatsapp/campaigns');
      } else {
        toast.error("Failed to duplicate campaign");
      }
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        const response = await fetch(`/api/whatsapp/campaigns/${campaignId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          toast.success("Campaign deleted successfully");
          router.push('/whatsapp/campaigns');
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
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/whatsapp/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/whatsapp/campaigns/${campaignId}`}>
            {isLoading ? "Loading..." : campaign?.name || "Campaign Details"}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Loading campaign details...</p>
        </div>
      ) : campaign ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/whatsapp/campaigns/${campaignId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm">{campaign.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm">{campaign.description || "No description"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">From</p>
                  <p className="text-sm">{campaign.from}</p>
                </div>
                {campaign.scheduledFor && (
                  <div>
                    <p className="text-sm font-medium">Scheduled For</p>
                    <p className="text-sm">{new Date(campaign.scheduledFor).toLocaleString()}</p>
                  </div>
                )}
                {campaign.sentAt && (
                  <div>
                    <p className="text-sm font-medium">Sent At</p>
                    <p className="text-sm">{new Date(campaign.sentAt).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.template ? (
                  <div>
                    <p className="text-sm font-medium">Template: {campaign.template.name}</p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{campaign.content || "Using template content"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{campaign.content || "No content"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.lists && campaign.lists.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Lists</p>
                      <ul className="text-sm list-disc pl-5">
                        {campaign.lists.map((list: any) => (
                          <li key={list.id}>{list.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {campaign.segments && campaign.segments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Segments</p>
                      <ul className="text-sm list-disc pl-5">
                        {campaign.segments.map((segment: any) => (
                          <li key={segment.id}>{segment.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!campaign.lists || campaign.lists.length === 0) && 
                   (!campaign.segments || campaign.segments.length === 0) && (
                    <p className="text-sm text-gray-500">No recipients selected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.statistics ? (
                  <div className="space-y-2">
                    <p className="text-sm">Total Recipients: {campaign.statistics.totalRecipients || 0}</p>
                    {/* Add more statistics here when available */}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          {campaign.status === "DRAFT" && (
            <div className="flex space-x-4 mt-6">
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Campaign not found</p>
        </div>
      )}
    </div>
  );
} 