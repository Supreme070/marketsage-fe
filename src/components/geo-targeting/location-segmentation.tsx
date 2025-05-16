"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Users, Plus, Filter, Search, Edit, Trash2, Globe, MapIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Mock data for location segments
const mockSegments = [
  {
    id: "1",
    name: "Lagos Region",
    type: "region",
    condition: "is in",
    value: ["Lagos", "Ogun", "Oyo", "Osun"],
    count: 5842,
    createdAt: "2023-09-10T14:30:00Z",
    active: true
  },
  {
    id: "2",
    name: "Northern States",
    type: "region",
    condition: "is in",
    value: ["Kano", "Kaduna", "Sokoto", "Zamfara"],
    count: 4231,
    createdAt: "2023-08-15T09:20:00Z",
    active: true
  },
  {
    id: "3",
    name: "Eastern Region",
    type: "region",
    condition: "is in",
    value: ["Enugu", "Anambra", "Imo", "Abia"],
    count: 3567,
    createdAt: "2023-07-22T11:45:00Z",
    active: true
  },
  {
    id: "4",
    name: "Major Cities",
    type: "city",
    condition: "is in",
    value: ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan"],
    count: 8941,
    createdAt: "2023-09-05T16:15:00Z",
    active: true
  },
  {
    id: "5",
    name: "Rural Areas",
    type: "population_density",
    condition: "less than",
    value: ["1000 people per square mile"],
    count: 2319,
    createdAt: "2023-08-28T10:30:00Z",
    active: false
  },
  {
    id: "6",
    name: "International Customers",
    type: "country",
    condition: "is not",
    value: ["Nigeria"],
    count: 1843,
    createdAt: "2023-09-12T08:45:00Z",
    active: true
  },
  {
    id: "7",
    name: "Tropical Climate Regions",
    type: "climate",
    condition: "is",
    value: ["Tropical", "Savanna", "Monsoon"],
    count: 3127,
    createdAt: "2023-08-19T13:20:00Z",
    active: true
  }
];

// Countries for the mock interface
const countries = [
  "Nigeria", "Ghana", "South Africa", "Kenya", 
  "Cameroon", "Ivory Coast", "Egypt", "Morocco", "Senegal", "Tanzania"
];

// Nigerian States for the mock interface
const usStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", 
  "Bayelsa", "Benue", "Borno", "Cross River", "Delta", 
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", 
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", 
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
];

// Major Nigerian cities for the mock interface
const majorCities = [
  "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt",
  "Benin City", "Kaduna", "Zaria", "Jos", "Ilorin",
  "Warri", "Enugu", "Maiduguri", "Aba", "Onitsha",
  "Calabar", "Uyo", "Sokoto", "Abeokuta", "Asaba"
];

export default function LocationSegmentation() {
  const { toast } = useToast();
  const [segments, setSegments] = useState(mockSegments);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentSegment, setCurrentSegment] = useState({
    name: "",
    type: "country",
    condition: "is in",
    locations: [] as string[],
  });
  
  // Filter segments based on search and active status
  const filteredSegments = segments.filter(segment => {
    const searchMatch = segment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const activeMatch = showActive ? segment.active : true;
    return searchMatch && activeMatch;
  });
  
  const handleCreateSegment = () => {
    const newSegment = {
      id: (segments.length + 1).toString(),
      name: currentSegment.name,
      type: currentSegment.type,
      condition: currentSegment.condition,
      value: currentSegment.locations,
      count: Math.floor(Math.random() * 5000) + 1000,
      createdAt: new Date().toISOString(),
      active: true
    };
    
    setSegments([newSegment, ...segments]);
    setLocationDialogOpen(false);
    setCurrentSegment({
      name: "",
      type: "country",
      condition: "is in",
      locations: [],
    });
    
    toast({
      title: "Segment Created",
      description: `Location segment "${newSegment.name}" has been created successfully.`,
    });
  };
  
  const handleDeleteSegment = (id: string) => {
    setSegments(segments.filter(segment => segment.id !== id));
    toast({
      title: "Segment Deleted",
      description: "Location segment has been deleted successfully.",
    });
  };
  
  const handleToggleActive = (id: string) => {
    setSegments(segments.map(segment => 
      segment.id === id ? { ...segment, active: !segment.active } : segment
    ));
  };
  
  const getLocationOptions = () => {
    switch (currentSegment.type) {
      case "country":
        return countries;
      case "region":
        return usStates;
      case "city":
        return majorCities;
      default:
        return [];
    }
  };
  
  const locationOptions = getLocationOptions();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Location Segments</h2>
          <p className="text-muted-foreground">
            Create audience segments based on geographic criteria
          </p>
        </div>
        
        <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Location Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Location Segment</DialogTitle>
              <DialogDescription>
                Define a segment of contacts based on geographic criteria
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="segment-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="segment-name"
                  placeholder="Enter segment name"
                  className="col-span-3"
                  value={currentSegment.name}
                  onChange={(e) => setCurrentSegment({
                    ...currentSegment,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Location Type</Label>
                <Select 
                  value={currentSegment.type}
                  onValueChange={(value) => setCurrentSegment({
                    ...currentSegment,
                    type: value,
                    locations: [] // Reset selections when type changes
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="region">State/Region</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="postal_code">Postal Code</SelectItem>
                    <SelectItem value="climate">Climate Zone</SelectItem>
                    <SelectItem value="population_density">Population Density</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Condition</Label>
                <Select
                  value={currentSegment.condition}
                  onValueChange={(value) => setCurrentSegment({
                    ...currentSegment,
                    condition: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="is">Is</SelectItem>
                    <SelectItem value="is not">Is Not</SelectItem>
                    <SelectItem value="is in">Is In</SelectItem>
                    <SelectItem value="is not in">Is Not In</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater than">Greater Than</SelectItem>
                    <SelectItem value="less than">Less Than</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Locations</Label>
                <div className="col-span-3 space-y-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <MapPin className="mr-2 h-4 w-4" />
                        {currentSegment.locations.length > 0 
                          ? `${currentSegment.locations.length} ${currentSegment.type}${currentSegment.locations.length > 1 ? 's' : ''} selected`
                          : `Select ${currentSegment.type}s`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-4 border-b">
                        <h4 className="font-medium text-sm">Select locations</h4>
                        <p className="text-xs text-muted-foreground">
                          Choose one or more locations to include in this segment
                        </p>
                      </div>
                      <div className="p-4 h-[300px] overflow-y-auto">
                        {locationOptions.length > 0 ? (
                          <div className="space-y-2">
                            {locationOptions.map((location) => (
                              <div key={location} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`location-${location}`} 
                                  checked={currentSegment.locations.includes(location)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setCurrentSegment({
                                        ...currentSegment,
                                        locations: [...currentSegment.locations, location]
                                      });
                                    } else {
                                      setCurrentSegment({
                                        ...currentSegment,
                                        locations: currentSegment.locations.filter(l => l !== location)
                                      });
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`location-${location}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {location}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground">
                              Select a location type first
                            </p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {currentSegment.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentSegment.locations.map((location) => (
                        <Badge key={location} variant="secondary" className="flex items-center">
                          {location}
                          <button
                            className="ml-1 hover:text-red-500 focus:outline-none"
                            onClick={() => {
                              setCurrentSegment({
                                ...currentSegment,
                                locations: currentSegment.locations.filter(l => l !== location)
                              });
                            }}
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSegment}
                disabled={!currentSegment.name || currentSegment.locations.length === 0}
              >
                Create Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Geographic Segments</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search segments..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-active"
                  checked={showActive}
                  onCheckedChange={setShowActive}
                />
                <Label htmlFor="show-active">Active only</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSegments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {segment.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <span className="text-sm">{segment.condition}</span>
                              <Badge variant="secondary" className="ml-2">
                                {segment.value.length > 1 
                                  ? `${segment.value.length} locations` 
                                  : segment.value[0]}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-semibold">Locations:</p>
                              <ul className="list-disc pl-4">
                                {segment.value.map((val, index) => (
                                  <li key={index}>{val}</li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {segment.count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(segment.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={segment.active ? "default" : "secondary"}>
                        {segment.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleActive(segment.id)}
                        >
                          {segment.active 
                            ? <span className="text-xs font-medium">Disable</span> 
                            : <span className="text-xs font-medium">Enable</span>
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500"
                          onClick={() => handleDeleteSegment(segment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No segments found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm 
                  ? "Try adjusting your search term" 
                  : "Create your first location segment to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <MapIcon className="h-5 w-5 text-blue-500 mr-2" />
            <CardTitle className="text-sm font-medium text-blue-800">Location Segmentation Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create segments based on multiple geographic criteria for targeted campaigns</li>
            <li>• Use climate zones to target seasonal offers appropriate for different regions</li>
            <li>• Combine location data with behavioral data for even more targeted segments</li>
            <li>• For local businesses, focus on creating segments within your service area</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 