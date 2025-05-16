"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Clock, Globe, InfoIcon, ArrowUpDown, Plus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Mock timezones for the interface
const timezones = [
  { id: "1", name: "West African Time (WAT)", offset: "+01:00", status: "Active", campaigns: 5, optimizedSendTime: "9:00 AM" },
  { id: "2", name: "Lagos", offset: "+01:00", status: "Active", campaigns: 7, optimizedSendTime: "8:30 AM" },
  { id: "3", name: "Abuja", offset: "+01:00", status: "Active", campaigns: 4, optimizedSendTime: "9:00 AM" },
  { id: "4", name: "Port Harcourt", offset: "+01:00", status: "Active", campaigns: 3, optimizedSendTime: "8:45 AM" },
  { id: "5", name: "London (for Diaspora)", offset: "+00:00", status: "Active", campaigns: 2, optimizedSendTime: "3:00 PM" },
  { id: "6", name: "New York (for Diaspora)", offset: "-05:00", status: "Active", campaigns: 2, optimizedSendTime: "4:00 PM" },
  { id: "7", name: "South Africa", offset: "+02:00", status: "Inactive", campaigns: 0, optimizedSendTime: "10:00 AM" },
  { id: "8", name: "Ghana", offset: "+00:00", status: "Active", campaigns: 1, optimizedSendTime: "9:00 AM" },
  { id: "9", name: "Kenya", offset: "+03:00", status: "Active", campaigns: 2, optimizedSendTime: "11:00 AM" }
];

// Mock campaigns with timezone optimization data
const timezoneCampaigns = [
  { 
    id: "1", 
    name: "Nigerian Independence Promotion", 
    type: "Email", 
    timezoneOptimized: true, 
    performance: { 
      standard: { openRate: 22.4, clickRate: 3.2 },
      optimized: { openRate: 28.7, clickRate: 4.1 }
    }
  },
  { 
    id: "2", 
    name: "Lagos Business Conference", 
    type: "Email", 
    timezoneOptimized: true, 
    performance: { 
      standard: { openRate: 18.9, clickRate: 2.7 },
      optimized: { openRate: 24.5, clickRate: 3.8 }
    }
  },
  { 
    id: "3", 
    name: "Ramadan Special Offers", 
    type: "SMS", 
    timezoneOptimized: true, 
    performance: { 
      standard: { openRate: 31.2, clickRate: 5.8 },
      optimized: { openRate: 37.6, clickRate: 6.9 }
    }
  },
  { 
    id: "4", 
    name: "Quarterly Newsletter", 
    type: "Email", 
    timezoneOptimized: false, 
    performance: { 
      standard: { openRate: 20.5, clickRate: 2.9 },
      optimized: { openRate: 20.5, clickRate: 2.9 }
    }
  },
  { 
    id: "5", 
    name: "Diaspora Customer Survey", 
    type: "Email", 
    timezoneOptimized: true, 
    performance: { 
      standard: { openRate: 24.8, clickRate: 3.6 },
      optimized: { openRate: 29.3, clickRate: 4.5 }
    }
  }
];

// African regions for timezone configuration
const africanRegions = [
  "Nigeria - Lagos",
  "Nigeria - Abuja",
  "Nigeria - Kano",
  "Nigeria - Port Harcourt",
  "Nigeria - Enugu",
  "Ghana - Accra",
  "South Africa - Johannesburg",
  "Kenya - Nairobi",
  "Egypt - Cairo",
  "Ethiopia - Addis Ababa"
];

export default function LocalTimeDelivery() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timezones");
  const [searchTerm, setSearchTerm] = useState("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    offset: "+01:00",
    status: "Active",
    optimizedSendTime: "9:00 AM"
  });
  
  // Filter timezones based on search
  const filteredTimezones = timezones.filter(tz => 
    tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.offset.includes(searchTerm)
  );

  // Handle creating a new timezone configuration
  const handleAddConfiguration = () => {
    const config = {
      id: (timezones.length + 1).toString(),
      ...newConfig,
      campaigns: 0
    };
    
    // Update state with new timezone
    timezones.unshift(config);
    
    setConfigDialogOpen(false);
    setNewConfig({
      name: "",
      offset: "+01:00",
      status: "Active",
      optimizedSendTime: "9:00 AM"
    });
    
    toast({
      title: "Configuration Added",
      description: `Timezone configuration for "${config.name}" has been added.`,
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Local Time Delivery</h2>
          <p className="text-muted-foreground">
            Optimize campaign delivery based on recipients' timezones
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timezones</SelectItem>
              <SelectItem value="active">Active Timezones</SelectItem>
              <SelectItem value="nigeria">Nigeria</SelectItem>
              <SelectItem value="diaspora">Diaspora</SelectItem>
              <SelectItem value="africa">Africa</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Timezone Configuration</DialogTitle>
                <DialogDescription>
                  Create a new timezone delivery configuration
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="region-name" className="text-right">
                    Region Name
                  </Label>
                  <Select
                    value={newConfig.name}
                    onValueChange={(value) => setNewConfig({
                      ...newConfig,
                      name: value
                    })}
                  >
                    <SelectTrigger id="region-name" className="col-span-3">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {africanRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">UTC Offset</Label>
                  <Select 
                    value={newConfig.offset}
                    onValueChange={(value) => setNewConfig({
                      ...newConfig,
                      offset: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select offset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+00:00">UTC +00:00</SelectItem>
                      <SelectItem value="+01:00">UTC +01:00</SelectItem>
                      <SelectItem value="+02:00">UTC +02:00</SelectItem>
                      <SelectItem value="+03:00">UTC +03:00</SelectItem>
                      <SelectItem value="-05:00">UTC -05:00</SelectItem>
                      <SelectItem value="-08:00">UTC -08:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Optimal Send Time</Label>
                  <Select
                    value={newConfig.optimizedSendTime}
                    onValueChange={(value) => setNewConfig({
                      ...newConfig,
                      optimizedSendTime: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select optimal time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                      <SelectItem value="8:30 AM">8:30 AM</SelectItem>
                      <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                      <SelectItem value="9:30 AM">9:30 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      <SelectItem value="8:00 PM">8:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <Select 
                    value={newConfig.status}
                    onValueChange={(value) => setNewConfig({
                      ...newConfig,
                      status: value
                    })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddConfiguration}
                  disabled={!newConfig.name}
                >
                  Add Configuration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="bg-white p-3 rounded-full">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-blue-800">Local Time Optimization</h3>
              <p className="text-sm text-blue-700">
                Sending campaigns at the optimal local time for each recipient increases open rates by an average of 18%.
                Campaigns are automatically adjusted to deliver during peak engagement hours based on recipient timezone.
              </p>
            </div>
            <div className="md:ml-auto flex items-center space-x-2 bg-white px-3 py-1 rounded-full">
              <Switch id="auto-optimize" defaultChecked />
              <Label htmlFor="auto-optimize" className="text-sm font-medium">Auto-optimize new campaigns</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Timezone Coverage</CardTitle>
              <Badge className="bg-green-100 text-green-800">{timezones.length} Zones</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">84%</div>
            <p className="text-sm text-muted-foreground">Of audience with timezone data</p>
            <Progress value={84} className="h-2 mt-3" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Optimized Campaigns</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">4 Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+23%</div>
            <p className="text-sm text-muted-foreground">Average open rate improvement</p>
            <Progress value={23} className="h-2 mt-3 bg-blue-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Optimal Send Times</CardTitle>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm">Europe</div>
                <Badge variant="outline">10:00-11:30 AM</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">North America</div>
                <Badge variant="outline">8:30-10:00 AM</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">Asia Pacific</div>
                <Badge variant="outline">9:00-10:30 AM</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Timezone Configurations</CardTitle>
            
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search timezones..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTimezones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Timezone</TableHead>
                  <TableHead>UTC Offset</TableHead>
                  <TableHead>Optimal Send Time</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimezones.map((tz) => (
                  <TableRow key={tz.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                        {tz.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">UTC {tz.offset}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {tz.optimizedSendTime}
                      </div>
                    </TableCell>
                    <TableCell>{tz.campaigns}</TableCell>
                    <TableCell>
                      <Badge className={tz.status === "Active" ? "bg-green-100 text-green-800" : "bg-slate-100"}>
                        {tz.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No timezones found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? "Try adjusting your search term" 
                  : "Add timezone configurations to optimize delivery"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Timezone-Optimized Campaigns</CardTitle>
          <CardDescription>
            Campaigns that deliver based on recipient local time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Timezone Optimized</TableHead>
                <TableHead>Standard Open Rate</TableHead>
                <TableHead>Optimized Open Rate</TableHead>
                <TableHead>Improvement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timezoneCampaigns.map((campaign) => {
                const improvement = campaign.performance.optimized.openRate - campaign.performance.standard.openRate;
                
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.timezoneOptimized ? (
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>{campaign.performance.standard.openRate}%</TableCell>
                    <TableCell>{campaign.performance.optimized.openRate}%</TableCell>
                    <TableCell>
                      {improvement > 0 ? (
                        <div className="flex items-center text-green-600">
                          <ArrowUpDown className="mr-1 h-4 w-4" />
                          +{improvement.toFixed(1)}%
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No change</div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <CardTitle className="text-sm font-medium text-blue-800">Local Time Delivery Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Optimal send times vary by region and industry - test to find your audience's best times</li>
            <li>• Collect timezone data from user profiles, IP addresses, or mobile device information</li>
            <li>• Consider day of week along with time of day for maximum engagement</li>
            <li>• Use A/B testing to compare standard vs. timezone-optimized delivery performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 