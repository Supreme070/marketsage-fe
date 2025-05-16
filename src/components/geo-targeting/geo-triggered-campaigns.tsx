"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Search, Pin, MessageSquare, MapPin, Plus, Globe, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";

// Mock data for geo-triggered campaigns
const mockCampaigns = [
  {
    id: "1",
    name: "Lagos Store Opening",
    type: "Email",
    trigger: "Enter Location",
    location: "Lagos",
    radius: "5 km",
    status: "Active",
    sentCount: 842,
    openRate: 32.6
  },
  {
    id: "2",
    name: "Abuja Conference Promotion",
    type: "SMS",
    trigger: "Enter Location",
    location: "Abuja Conference Center",
    radius: "1 km",
    status: "Active",
    sentCount: 325,
    openRate: 41.2
  },
  {
    id: "3",
    name: "Port Harcourt Sale",
    type: "Email",
    trigger: "Weather Change",
    location: "Port Harcourt",
    radius: "10 km",
    status: "Scheduled",
    sentCount: 0,
    openRate: 0
  },
  {
    id: "4",
    name: "Lekki Beach Promotion",
    type: "WhatsApp",
    trigger: "Enter Location",
    location: "Lekki Beach",
    radius: "2 km",
    status: "Active",
    sentCount: 653,
    openRate: 38.7
  },
  {
    id: "5",
    name: "Ikeja Mall Promotion",
    type: "SMS",
    trigger: "Exit Location",
    location: "Ikeja Shopping Mall",
    radius: "0.5 km",
    status: "Paused",
    sentCount: 421,
    openRate: 29.3
  }
];

// Nigerian locations for the campaign creation form
const nigerianLocations = [
  "Lagos - Victoria Island",
  "Lagos - Ikeja",
  "Lagos - Lekki",
  "Abuja - Central Business District",
  "Abuja - Wuse",
  "Abuja - Maitama",
  "Port Harcourt - GRA",
  "Kano - Sabon Gari",
  "Ibadan - Bodija",
  "Enugu - New Haven"
];

export default function GeoTriggeredCampaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "Email",
    trigger: "Enter Location",
    location: "",
    radius: "1 km",
  });
  
  // Filter campaigns based on search
  const filteredCampaigns = campaigns.filter(campaign => {
    return campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           campaign.location.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Get status badge based on campaign status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "Paused":
        return <Badge className="bg-amber-100 text-amber-800">Paused</Badge>;
      case "Scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle creating a new geo-campaign
  const handleCreateCampaign = () => {
    const campaign = {
      id: (campaigns.length + 1).toString(),
      ...newCampaign,
      status: "Active",
      sentCount: 0,
      openRate: 0
    };
    
    setCampaigns([campaign, ...campaigns]);
    setCampaignDialogOpen(false);
    setNewCampaign({
      name: "",
      type: "Email",
      trigger: "Enter Location",
      location: "",
      radius: "1 km",
    });
    
    toast({
      title: "Campaign Created",
      description: `Geo-triggered campaign "${campaign.name}" has been created.`,
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Geo-Triggered Campaigns</h2>
          <p className="text-muted-foreground">
            Create automated campaigns triggered by customer locations
          </p>
        </div>
        
        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Geo-Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Geo-Triggered Campaign</DialogTitle>
              <DialogDescription>
                Set up a campaign that activates based on customer location
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="campaign-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="campaign-name"
                  placeholder="Enter campaign name"
                  className="col-span-3"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({
                    ...newCampaign,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Campaign Type</Label>
                <Select 
                  value={newCampaign.type}
                  onValueChange={(value) => setNewCampaign({
                    ...newCampaign,
                    type: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Trigger Type</Label>
                <Select
                  value={newCampaign.trigger}
                  onValueChange={(value) => setNewCampaign({
                    ...newCampaign,
                    trigger: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enter Location">Enter Location</SelectItem>
                    <SelectItem value="Exit Location">Exit Location</SelectItem>
                    <SelectItem value="Dwell Time">Dwell Time</SelectItem>
                    <SelectItem value="Weather Change">Weather Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Location</Label>
                <Select
                  value={newCampaign.location}
                  onValueChange={(value) => setNewCampaign({
                    ...newCampaign,
                    location: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Radius</Label>
                <Select
                  value={newCampaign.radius}
                  onValueChange={(value) => setNewCampaign({
                    ...newCampaign,
                    radius: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1 km">0.1 km</SelectItem>
                    <SelectItem value="0.5 km">0.5 km</SelectItem>
                    <SelectItem value="1 km">1 km</SelectItem>
                    <SelectItem value="2 km">2 km</SelectItem>
                    <SelectItem value="5 km">5 km</SelectItem>
                    <SelectItem value="10 km">10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || !newCampaign.location}
              >
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Active Geo-Campaigns</CardTitle>
            
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center">
                        <Pin className="mr-2 h-3 w-3 text-muted-foreground" />
                        {campaign.trigger}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{campaign.location}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {campaign.radius}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      {campaign.sentCount > 0 ? (
                        <div className="text-sm">
                          <span className="font-medium">{campaign.openRate}%</span>
                          <span className="text-muted-foreground ml-1">
                            ({campaign.sentCount} sent)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not started</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No campaigns found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? "Try adjusting your search term" 
                  : "Create your first geo-triggered campaign to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-green-500 mr-2" />
            <CardTitle className="text-sm font-medium text-green-800">Geo-Campaign Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Use entrance triggers for welcome offers when customers visit physical locations</li>
            <li>• Create exit triggers to encourage return visits with special offers</li>
            <li>• Combine with time conditions to deliver messages at optimal moments</li>
            <li>• Consider privacy regulations and always obtain proper consent for location data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 