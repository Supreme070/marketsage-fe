import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Copy,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  BarChart,
  Clock,
  Send,
  Pause,
} from "lucide-react";

// Sample data for email campaigns
const campaigns = [
  {
    id: "1",
    name: "Monthly Newsletter - May 2023",
    subject: "Your Monthly Update from MarketSage",
    status: "SENT",
    recipients: 1245,
    openRate: 32.4,
    clickRate: 12.8,
    sentAt: "2023-05-10",
  },
  {
    id: "2",
    name: "Product Launch - Pro Plan",
    subject: "Introducing Our New Pro Plan - Limited Time Offer",
    status: "SCHEDULED",
    recipients: 2500,
    openRate: null,
    clickRate: null,
    sentAt: "Scheduled for 2023-06-01",
  },
  {
    id: "3",
    name: "Seasonal Promotion - Summer Sale",
    subject: "Summer Sale - Up to 50% Off All Products",
    status: "DRAFT",
    recipients: null,
    openRate: null,
    clickRate: null,
    sentAt: null,
  },
  {
    id: "4",
    name: "Customer Satisfaction Survey",
    subject: "We'd Love Your Feedback - Take Our 2-Minute Survey",
    status: "SENT",
    recipients: 980,
    openRate: 28.7,
    clickRate: 15.2,
    sentAt: "2023-04-22",
  },
  {
    id: "5",
    name: "Webinar Invitation - Marketing Trends 2023",
    subject: "Join Our Exclusive Webinar on Marketing Trends",
    status: "SENDING",
    recipients: 3200,
    openRate: 18.5,
    clickRate: 7.3,
    sentAt: "In progress",
  },
];

export default function EmailCampaignsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage your email marketing campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{campaign.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {campaign.subject}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "SENT"
                            ? "default"
                            : campaign.status === "SCHEDULED"
                            ? "secondary"
                            : campaign.status === "SENDING"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {campaign.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.recipients !== null
                        ? campaign.recipients.toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {campaign.openRate !== null
                        ? `${campaign.openRate}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {campaign.clickRate !== null
                        ? `${campaign.clickRate}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {campaign.sentAt !== null ? campaign.sentAt : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "SENDING" && (
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" /> Send
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "SCHEDULED" && (
                            <DropdownMenuItem>
                              <Clock className="mr-2 h-4 w-4" /> Reschedule
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === "SENT" ||
                            campaign.status === "SENDING") && (
                            <DropdownMenuItem>
                              <BarChart className="mr-2 h-4 w-4" /> Reports
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>5</strong> of <strong>12</strong> campaigns
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
