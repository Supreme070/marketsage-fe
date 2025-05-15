"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ArrowRight,
  Filter,
  CalendarDays,
  LineChart,
  PieChart,
  TrendingUp,
  ShoppingCart,
  Mail,
  MessageCircle,
  MessageSquare,
  Zap,
  DollarSign,
  Users,
  CheckCircle2,
  Settings,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardDescription,
  CustomCardContent,
  CustomCardFooter,
} from "@/components/ui/custom-card";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { EntityType } from "@prisma/client";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ConversionsPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<string>("30d");
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    channels: {
      email: true,
      sms: true,
      whatsapp: true,
      automation: true
    },
    conversionTypes: {
      lead: true,
      purchase: true,
      signup: true,
      form: true
    },
    markets: {
      lagos: true,
      abuja: true,
      portHarcourt: true,
      ibadan: true,
      kano: true,
      eastern: true
    }
  });
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    trackingEnabled: true,
    autoAttributionEnabled: true,
    goalTracking: true,
    notificationsEnabled: true,
    apiMode: "production",
    dataRetention: "365"
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState("overview");
  
  // Helper functions for date ranges
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      case "ytd":
        return "Year to date";
      case "custom":
        return `${formatDate(customDateRange.startDate)} - ${formatDate(customDateRange.endDate)}`;
      default:
        return "Last 30 days";
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const calculateDateRange = (range: string) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "7d":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "ytd":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };
  
  // Event handlers
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    if (range !== "custom") {
      setCustomDateRange(calculateDateRange(range));
    }
    setShowDatePicker(false);
    toast.success(`Date range changed to ${getDateRangeLabel()}`);
  };
  
  const handleCustomDateChange = () => {
    if (new Date(customDateRange.startDate) > new Date(customDateRange.endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }
    
    setDateRange("custom");
    setShowDatePicker(false);
    toast.success(`Custom date range applied: ${formatDate(customDateRange.startDate)} - ${formatDate(customDateRange.endDate)}`);
  };
  
  const handleFilterChange = (category: string, filter: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [filter]: value
      }
    }));
  };
  
  const applyFilters = () => {
    setShowFilters(false);
    toast.success("Filters applied successfully");
  };
  
  const resetFilters = () => {
    setFilters({
      channels: {
        email: true,
        sms: true,
        whatsapp: true,
        automation: true
      },
      conversionTypes: {
        lead: true,
        purchase: true,
        signup: true,
        form: true
      },
      markets: {
        lagos: true,
        abuja: true,
        portHarcourt: true,
        ibadan: true,
        kano: true,
        eastern: true
      }
    });
    toast.success("Filters reset to default");
  };
  
  const saveSettings = () => {
    setShowSettings(false);
    toast.success("Conversion tracking settings saved");
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-secondary dark:text-white">Conversion Tracking</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarDays className="mr-2 h-4 w-4 text-secondary" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Date Range</h4>
                  <p className="text-sm text-muted-foreground">
                    Select a predefined range or specify custom dates
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={dateRange === "7d" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateRangeChange("7d")}
                    >
                      Last 7 days
                    </Button>
                    <Button 
                      variant={dateRange === "30d" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateRangeChange("30d")}
                    >
                      Last 30 days
                    </Button>
                    <Button 
                      variant={dateRange === "90d" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateRangeChange("90d")}
                    >
                      Last 90 days
                    </Button>
                    <Button 
                      variant={dateRange === "ytd" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleDateRangeChange("ytd")}
                    >
                      Year to date
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or select custom range
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label htmlFor="from" className="text-xs">From</Label>
                        <Input
                          id="from"
                          type="date"
                          className="h-8"
                          value={customDateRange.startDate}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="to" className="text-xs">To</Label>
                        <Input
                          id="to"
                          type="date"
                          className="h-8"
                          value={customDateRange.endDate}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleCustomDateChange}
                    >
                      Apply Custom Range
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Filters Dialog */}
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Conversion Data</DialogTitle>
                <DialogDescription>
                  Select the filters to apply to your conversion data.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Accordion type="single" collapsible defaultValue="channels" className="w-full">
                  <AccordionItem value="channels">
                    <AccordionTrigger>Channels</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="channel-email" 
                            checked={filters.channels.email}
                            onCheckedChange={(checked) => handleFilterChange('channels', 'email', checked as boolean)}
                          />
                          <Label htmlFor="channel-email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="channel-sms" 
                            checked={filters.channels.sms}
                            onCheckedChange={(checked) => handleFilterChange('channels', 'sms', checked as boolean)}
                          />
                          <Label htmlFor="channel-sms">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="channel-whatsapp" 
                            checked={filters.channels.whatsapp}
                            onCheckedChange={(checked) => handleFilterChange('channels', 'whatsapp', checked as boolean)}
                          />
                          <Label htmlFor="channel-whatsapp">WhatsApp</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="channel-automation" 
                            checked={filters.channels.automation}
                            onCheckedChange={(checked) => handleFilterChange('channels', 'automation', checked as boolean)}
                          />
                          <Label htmlFor="channel-automation">Automation Workflows</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="conversionTypes">
                    <AccordionTrigger>Conversion Types</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-lead" 
                            checked={filters.conversionTypes.lead}
                            onCheckedChange={(checked) => handleFilterChange('conversionTypes', 'lead', checked as boolean)}
                          />
                          <Label htmlFor="type-lead">Lead Generation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-purchase" 
                            checked={filters.conversionTypes.purchase}
                            onCheckedChange={(checked) => handleFilterChange('conversionTypes', 'purchase', checked as boolean)}
                          />
                          <Label htmlFor="type-purchase">Purchases</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-signup" 
                            checked={filters.conversionTypes.signup}
                            onCheckedChange={(checked) => handleFilterChange('conversionTypes', 'signup', checked as boolean)}
                          />
                          <Label htmlFor="type-signup">Sign-ups</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-form" 
                            checked={filters.conversionTypes.form}
                            onCheckedChange={(checked) => handleFilterChange('conversionTypes', 'form', checked as boolean)}
                          />
                          <Label htmlFor="type-form">Form Submissions</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="markets">
                    <AccordionTrigger>Nigerian Markets</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-lagos" 
                            checked={filters.markets.lagos}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'lagos', checked as boolean)}
                          />
                          <Label htmlFor="market-lagos">Lagos Metropolitan</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-abuja" 
                            checked={filters.markets.abuja}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'abuja', checked as boolean)}
                          />
                          <Label htmlFor="market-abuja">Abuja & FCT</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-portHarcourt" 
                            checked={filters.markets.portHarcourt}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'portHarcourt', checked as boolean)}
                          />
                          <Label htmlFor="market-portHarcourt">Port Harcourt</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-ibadan" 
                            checked={filters.markets.ibadan}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'ibadan', checked as boolean)}
                          />
                          <Label htmlFor="market-ibadan">Ibadan & SW Cities</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-kano" 
                            checked={filters.markets.kano}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'kano', checked as boolean)}
                          />
                          <Label htmlFor="market-kano">Kano & Northern Markets</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="market-eastern" 
                            checked={filters.markets.eastern}
                            onCheckedChange={(checked) => handleFilterChange('markets', 'eastern', checked as boolean)}
                          />
                          <Label htmlFor="market-eastern">Eastern Markets</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetFilters}>Reset</Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Settings Dialog */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Conversion Tracking Settings</DialogTitle>
                <DialogDescription>
                  Configure how conversion tracking works in your MarketSage account.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between space-y-0.5">
                  <div>
                    <Label htmlFor="tracking-enabled" className="text-sm font-medium">
                      Enable Conversion Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on/off tracking for all conversion events
                    </p>
                  </div>
                  <Switch 
                    id="tracking-enabled" 
                    checked={settings.trackingEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, trackingEnabled: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between space-y-0.5">
                  <div>
                    <Label htmlFor="auto-attribution" className="text-sm font-medium">
                      Automatic Attribution
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically attribute conversions to campaigns
                    </p>
                  </div>
                  <Switch 
                    id="auto-attribution" 
                    checked={settings.autoAttributionEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, autoAttributionEnabled: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between space-y-0.5">
                  <div>
                    <Label htmlFor="goal-tracking" className="text-sm font-medium">
                      Goal Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Track progress against conversion goals
                    </p>
                  </div>
                  <Switch 
                    id="goal-tracking" 
                    checked={settings.goalTracking}
                    onCheckedChange={(checked) => setSettings({...settings, goalTracking: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between space-y-0.5">
                  <div>
                    <Label htmlFor="notifications" className="text-sm font-medium">
                      Conversion Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified for significant conversion events
                    </p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, notificationsEnabled: checked})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-mode">API Tracking Mode</Label>
                  <Select 
                    value={settings.apiMode}
                    onValueChange={(value) => setSettings({...settings, apiMode: value})}
                  >
                    <SelectTrigger id="api-mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention (days)</Label>
                  <Input 
                    id="data-retention" 
                    type="number" 
                    min="30" 
                    max="3650"
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to keep conversion data (30 days minimum)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveSettings}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/5 dark:bg-secondary/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ConversionMetrics 
            title="Overall Conversion Performance"
            description="Summary of conversions across all channels"
            period="MONTHLY"
            startDate={customDateRange.startDate}
            endDate={customDateRange.endDate}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Conversion Rate
                </CustomCardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">8.3%</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowRight className="mr-1 h-3 w-3 text-green-500" />
                  1.2% from last month
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Total Conversions
                </CustomCardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">483</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Revenue
                </CustomCardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">₦5.8M</div>
                <p className="text-xs text-muted-foreground">
                  ₦12,000 avg. per conversion
                </p>
              </CustomCardContent>
            </CustomCard>

            <CustomCard>
              <CustomCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CustomCardTitle className="text-sm font-medium">
                  Cost Per Conversion
                </CustomCardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CustomCardHeader>
              <CustomCardContent>
                <div className="text-2xl font-bold">₦1,200</div>
                <p className="text-xs text-muted-foreground">
                  -₦180 from last month
                </p>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <CustomCard className="md:col-span-8">
              <CustomCardHeader>
                <CustomCardTitle>Conversion Funnel</CustomCardTitle>
                <CustomCardDescription>
                  Analyze your marketing funnel performance
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="h-[500px] relative">
                  {/* Improved Funnel Visualization with better spacing */}
                  <div className="flex flex-col items-center space-y-8 pt-4">
                    <div className="w-full max-w-lg bg-primary/10 px-4 py-4 rounded-md text-center relative">
                      <div className="font-medium">Visitors</div>
                      <div className="text-2xl font-bold">12,450</div>
                      <div className="text-sm text-muted-foreground">100%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/10"></div>
                    </div>

                    <div className="w-full max-w-[85%] bg-primary/20 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Leads</div>
                      <div className="text-2xl font-bold">5,280</div>
                      <div className="text-sm text-muted-foreground">42.4%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/20"></div>
                    </div>

                    <div className="w-full max-w-[70%] bg-primary/30 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Opportunities</div>
                      <div className="text-2xl font-bold">1,860</div>
                      <div className="text-sm text-muted-foreground">14.9%</div>
                    </div>
                    
                    <div className="relative w-full flex justify-center">
                      <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[20px] border-primary/30"></div>
                    </div>

                    <div className="w-full max-w-[55%] bg-primary/40 px-4 py-4 rounded-md text-center">
                      <div className="font-medium">Conversions</div>
                      <div className="text-2xl font-bold">483</div>
                      <div className="text-sm text-muted-foreground">3.9%</div>
                    </div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="md:col-span-4">
              <CustomCardHeader>
                <CustomCardTitle>Channel Breakdown</CustomCardTitle>
                <CustomCardDescription>
                  Conversion by marketing channel
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <div className="text-sm font-medium">152 (31%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-primary" style={{ width: '31%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 text-accent mr-2" />
                        <span className="text-sm font-medium">SMS</span>
                      </div>
                      <div className="text-sm font-medium">125 (26%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-accent" style={{ width: '26%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 text-secondary mr-2" />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </div>
                      <div className="text-sm font-medium">96 (20%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium">Automations</span>
                      </div>
                      <div className="text-sm font-medium">110 (23%)</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <CustomCard className="md:col-span-6">
              <CustomCardHeader>
                <CustomCardTitle>Nigerian Market Segments</CustomCardTitle>
                <CustomCardDescription>
                  Conversion rates by key market segments
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Segment</div>
                    <div className="font-medium">Conversion Rate</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Lagos Metropolitan</span>
                    </div>
                    <div className="text-sm font-medium">12.4%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Abuja & FCT</span>
                    </div>
                    <div className="text-sm font-medium">10.8%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Port Harcourt</span>
                    </div>
                    <div className="text-sm font-medium">9.1%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Ibadan & SW Cities</span>
                    </div>
                    <div className="text-sm font-medium">8.2%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Kano & Northern Markets</span>
                    </div>
                    <div className="text-sm font-medium">6.5%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Eastern Markets</span>
                    </div>
                    <div className="text-sm font-medium">7.3%</div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>

            <CustomCard className="md:col-span-6">
              <CustomCardHeader>
                <CustomCardTitle>Top Performing Products</CustomCardTitle>
                <CustomCardDescription>
                  Products with highest conversion rates
                </CustomCardDescription>
              </CustomCardHeader>
              <CustomCardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="font-medium">Product</div>
                    <div className="font-medium">Conversions</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Premium Banking Solutions</span>
                    </div>
                    <div className="text-sm font-medium">87</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Telecom Service Bundles</span>
                    </div>
                    <div className="text-sm font-medium">65</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">E-commerce Solutions</span>
                    </div>
                    <div className="text-sm font-medium">52</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Educational Course Package</span>
                    </div>
                    <div className="text-sm font-medium">48</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Real Estate Consultation</span>
                    </div>
                    <div className="text-sm font-medium">42</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm">Healthcare Services</span>
                    </div>
                    <div className="text-sm font-medium">39</div>
                  </div>
                </div>
              </CustomCardContent>
            </CustomCard>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ConversionMetrics 
              entityType={EntityType.EMAIL_CAMPAIGN}
              title="Email Campaign Conversions"
              description="Track email campaign conversion performance"
              period="WEEKLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
            
            <ConversionMetrics 
              entityType={EntityType.SMS_CAMPAIGN}
              title="SMS Campaign Conversions"
              description="Track SMS campaign conversion performance"
              period="WEEKLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
            
            <ConversionMetrics 
              entityType={EntityType.WHATSAPP_CAMPAIGN}
              title="WhatsApp Campaign Conversions"
              description="Track WhatsApp campaign conversion performance"
              period="WEEKLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
            
            <ConversionMetrics 
              entityType={EntityType.WORKFLOW}
              title="Workflow Conversions"
              description="Track workflow automation conversion performance"
              period="WEEKLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ConversionMetrics 
              entityType={EntityType.EMAIL_CAMPAIGN}
              title="Email Campaigns"
              description="Email campaign conversion attribution"
              period="MONTHLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
            
            <ConversionMetrics 
              entityType={EntityType.SMS_CAMPAIGN}
              title="SMS Campaigns"
              description="SMS campaign conversion attribution"
              period="MONTHLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
            
            <ConversionMetrics 
              entityType={EntityType.WHATSAPP_CAMPAIGN}
              title="WhatsApp Campaigns"
              description="WhatsApp campaign conversion attribution"
              period="MONTHLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <ConversionMetrics 
              title="Conversion Goals"
              description="Track progress against your conversion goals"
              period="YEARLY"
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
