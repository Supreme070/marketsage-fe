"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSMSCampaignById, getSMSCampaignStats } from "@/lib/api";

export default function SMSCampaignStats({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch campaign data and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignData, statsData] = await Promise.all([
          getSMSCampaignById(params.id),
          getSMSCampaignStats(params.id),
        ]);
        
        setCampaign(campaignData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
        toast.error("Failed to load campaign statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign || !stats) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Campaign Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The campaign you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button className="mt-4" onClick={() => router.push("/sms/campaigns")}>
              Back to Campaigns
            </Button>
          </div>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <BreadcrumbLink href={`/sms/campaigns/${params.id}`}>{campaign.name}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
          <BreadcrumbLink>Statistics</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name} - Statistics</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          <Button variant="outline" onClick={() => router.push(`/sms/campaigns/${params.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered || 0}</div>
            <Progress 
              value={stats.deliveryRate || 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.deliveryRate || 0)}% delivery rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed || 0}</div>
            <Progress 
              value={stats.failureRate || 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.failureRate || 0)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Statistics</CardTitle>
          <CardDescription>
            Detailed breakdown of message delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Sent</TableCell>
                <TableCell>{stats.sent || 0}</TableCell>
                <TableCell>
                  {stats.totalRecipients > 0 
                    ? `${Math.round((stats.sent || 0) / stats.totalRecipients * 100)}%` 
                    : '0%'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Delivered</TableCell>
                <TableCell>{stats.delivered || 0}</TableCell>
                <TableCell>
                  {stats.totalRecipients > 0 
                    ? `${Math.round((stats.delivered || 0) / stats.totalRecipients * 100)}%` 
                    : '0%'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Failed</TableCell>
                <TableCell>{stats.failed || 0}</TableCell>
                <TableCell>
                  {stats.totalRecipients > 0 
                    ? `${Math.round((stats.failed || 0) / stats.totalRecipients * 100)}%` 
                    : '0%'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 